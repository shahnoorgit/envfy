import fs from "node:fs";
import path from "node:path";
import inquirer from "inquirer";
import chalk from "chalk";
import {
  isProjectInitialized,
  readProjectConfig,
  getKeyEntry,
  saveKeyEntry,
  deleteKeyEntry,
  getEnvPathForStage,
  getConfiguredStages,
  type KeyEntry,
} from "../utils/config.js";
import {
  deriveKeyFromPassphrase,
  decrypt,
} from "../utils/crypto.js";
import { downloadFromR2, existsInR2 } from "../utils/r2-client.js";

export async function pullCommand(stage: string): Promise<void> {
  console.log(chalk.cyan(`\n🔐 pushenv pull - Download and decrypt .env (${stage})\n`));

  // Check if project is initialized (has .pushenv/config.json)
  if (!isProjectInitialized()) {
    console.log(chalk.red("✗ No pushenv config found in this project."));
    console.log(chalk.gray("  Make sure .pushenv/config.json exists (should be in the repo)."));
    process.exit(1);
  }

  const config = readProjectConfig()!;

  // Check if stage is configured
  const envPathForStage = getEnvPathForStage(config, stage);
  if (!envPathForStage) {
    const configuredStages = getConfiguredStages(config);
    console.log(chalk.red(`✗ Stage '${stage}' is not configured for this project.`));
    console.log(chalk.gray(`  Configured stages: ${configuredStages.join(", ")}`));
    console.log(chalk.gray(`  Run 'pushenv init' to reconfigure stages.`));
    process.exit(1);
  }

  console.log(chalk.gray(`Project: ${config.projectId}`));
  console.log(chalk.gray(`Stage: ${stage}`));
  console.log(chalk.gray(`Env file: ${envPathForStage}\n`));

  // Production confirmation
  if (stage === "production") {
    console.log(chalk.red.bold("\n⚠️  WARNING: You are about to pull PRODUCTION environment"));
    console.log(chalk.red(`   This will overwrite ${envPathForStage} with production secrets.`));
    console.log();
    
    const { confirm } = await inquirer.prompt<{ confirm: boolean }>([
      {
        type: "confirm",
        name: "confirm",
        message: chalk.red.bold("Are you sure you want to pull PRODUCTION?"),
        default: false,
      },
    ]);

    if (!confirm) {
      console.log(chalk.gray("\nPull cancelled."));
      return;
    }
    console.log();
  }

  // Check if encrypted data exists in R2 for this stage
  console.log(chalk.gray("Checking cloud storage..."));
  const exists = await existsInR2(config.projectId, stage);
  if (!exists) {
    console.log(chalk.red(`\n✗ No encrypted .env found for stage '${stage}'.`));
    console.log(chalk.gray(`  Ask your teammate to run 'pushenv push --stage ${stage}' first.`));
    process.exit(1);
  }
  console.log(chalk.green(`✓ Found encrypted .env for ${stage} in cloud`));

  // Check if local .env already exists
  const envPath = path.resolve(process.cwd(), envPathForStage);
  if (fs.existsSync(envPath)) {
    const { overwrite } = await inquirer.prompt<{ overwrite: boolean }>([
      {
        type: "confirm",
        name: "overwrite",
        message: `${envPathForStage} already exists. Overwrite?`,
        default: false,
      },
    ]);

    if (!overwrite) {
      console.log(chalk.gray("\nPull cancelled."));
      return;
    }
  }

  console.log();

  // Download from R2 with stage
  console.log(chalk.gray("Downloading from cloud..."));
  let encryptedData: string;
  try {
    encryptedData = await downloadFromR2(config.projectId, stage);
    console.log(chalk.green("✓ Downloaded encrypted data"));
  } catch (error) {
    if (error instanceof Error) {
      console.log(chalk.red(`✗ Download failed: ${error.message}`));
    }
    process.exit(1);
  }

  // Try to decrypt
  console.log(chalk.gray("Decrypting..."));
  
  // Extract salt from downloaded data
  // Format: salt_hex:encrypted_data
  const firstColon = encryptedData.indexOf(":");
  if (firstColon === -1) {
    console.log(chalk.red("\n✗ Invalid encrypted data format."));
    process.exit(1);
  }
  
  const saltHex = encryptedData.slice(0, firstColon);
  const actualEncryptedData = encryptedData.slice(firstColon + 1);
  const salt = Buffer.from(saltHex, "hex");
  
  try {
    // Prefer stored key if available for this machine
    let keyBuffer: Buffer | null = null;
    let shouldPersistKey = false;

    const existingKeyEntry = getKeyEntry(config.projectId);
    if (existingKeyEntry) {
      keyBuffer = Buffer.from(existingKeyEntry.key, "base64");
    } else {
      // Ask user for passphrase once on this machine
      const response = await inquirer.prompt<{ passphrase: string }>([
        {
          type: "password",
          name: "passphrase",
          message: "Enter the passphrase:",
          mask: "*",
        },
      ]);
      const passphrase = response.passphrase;

      const { key } = deriveKeyFromPassphrase(passphrase, salt);
      keyBuffer = key;
      shouldPersistKey = true;
    }
    
    const decrypted = decrypt(actualEncryptedData, keyBuffer);
    console.log(chalk.green("✓ Decrypted successfully"));

    // If this machine had no key yet and decryption succeeded, persist it now
    if (shouldPersistKey) {
      const keyEntry: KeyEntry = {
        projectId: config.projectId,
        salt: saltHex,
        key: (keyBuffer as Buffer).toString("base64"),
        createdAt: new Date().toISOString(),
      };
      saveKeyEntry(keyEntry);
    }

    // Create header with metadata
    const now = new Date();
    const stageEmoji = stage === "production" ? " ⚠️" : "";
    const header = `# ════════════════════════════════════════
# PushEnv Environment File
# Stage: ${stage.toUpperCase()}${stageEmoji}
# Synced: ${now.toISOString()}
# File: ${envPathForStage}
# ════════════════════════════════════════
# DO NOT COMMIT THIS FILE TO VERSION CONTROL
# DO NOT SHARE THIS FILE
#
`;

    // Remove existing PushEnv header if present, keep user's comments if any
    const existingContent = decrypted;
    const lines = existingContent.split("\n");
    let contentStart = 0;

    // Skip PushEnv headers (multiple # lines at start)
    let foundPushEnvHeader = false;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]?.trim() || "";
      if (line && !line.startsWith("#")) {
        contentStart = i;
        break;
      }
      if (line.includes("PushEnv") || line.includes("═")) {
        foundPushEnvHeader = true;
      }
    }

    // If we found a PushEnv header, skip to first non-comment line after it
    if (foundPushEnvHeader) {
      for (let i = contentStart; i < lines.length; i++) {
        const line = lines[i]?.trim() || "";
        if (line && !line.startsWith("#")) {
          contentStart = i;
          break;
        }
      }
    }

    // Combine header with actual env content
    const envContentWithHeader = header + lines.slice(contentStart).join("\n");

    // Write to .env file
    const envDir = path.dirname(envPath);
    if (!fs.existsSync(envDir)) {
      fs.mkdirSync(envDir, { recursive: true });
    }
    fs.writeFileSync(envPath, envContentWithHeader, "utf8");

    const lineCount = decrypted.split("\n").filter((l) => l.trim() && !l.startsWith("#")).length;
    console.log(chalk.green(`✓ Saved ${lineCount} environment variables to ${envPathForStage}`));

    // Success message
    console.log(chalk.green("\n" + "═".repeat(50)));
    console.log(chalk.green.bold(`\n🎉 Pull successful! (${stage})\n`));
    console.log(chalk.white(`Your ${stage} .env file is ready at ${chalk.yellow(envPathForStage)}`));
    console.log();
    console.log(chalk.gray("Remember: Never commit .env files to version control!"));
    console.log(chalk.green("═".repeat(50) + "\n"));

  } catch (error) {
    if (error instanceof Error) {
      const existingKeyEntry = getKeyEntry(config.projectId);
      if (existingKeyEntry) {
        // Stored key is invalid for this encrypted data; reset so user can re-enter
        deleteKeyEntry(config.projectId);
      }

      if (error.message.includes("Unsupported state") || error.message.includes("auth")) {
        console.log(chalk.red("\n✗ Incorrect passphrase. Please try again."));
      } else {
        console.log(chalk.red(`\n✗ Decryption failed: ${error.message}`));
      }
    }
    process.exit(1);
  }
}
