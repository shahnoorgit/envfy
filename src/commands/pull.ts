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
  type KeyEntry,
} from "../utils/config.js";
import {
  deriveKeyFromPassphrase,
  decrypt,
} from "../utils/crypto.js";
import { downloadFromR2, existsInR2 } from "../utils/r2-client.js";

export async function pullCommand(): Promise<void> {
  console.log(chalk.cyan("\n🔐 pushenv pull - Download and decrypt .env\n"));

  // Check if project is initialized (has .pushenv/config.json)
  if (!isProjectInitialized()) {
    console.log(chalk.red("✗ No pushenv config found in this project."));
    console.log(chalk.gray("  Make sure .pushenv/config.json exists (should be in the repo)."));
    process.exit(1);
  }

  const config = readProjectConfig()!;

  console.log(chalk.gray(`Project: ${config.projectId}`));
  console.log(chalk.gray(`Env file: ${config.envPath}\n`));

  // Check if encrypted data exists in R2
  console.log(chalk.gray("Checking cloud storage..."));
  const exists = await existsInR2(config.projectId);
  if (!exists) {
    console.log(chalk.red("\n✗ No encrypted .env found for this project."));
    console.log(chalk.gray("  Ask your teammate to run 'pushenv push' first."));
    process.exit(1);
  }
  console.log(chalk.green("✓ Found encrypted .env in cloud"));

  // Check if local .env already exists
  const envPath = path.resolve(process.cwd(), config.envPath);
  if (fs.existsSync(envPath)) {
    const { overwrite } = await inquirer.prompt<{ overwrite: boolean }>([
      {
        type: "confirm",
        name: "overwrite",
        message: `${config.envPath} already exists. Overwrite?`,
        default: false,
      },
    ]);

    if (!overwrite) {
      console.log(chalk.gray("\nPull cancelled."));
      return;
    }
  }

  console.log();

  // Download from R2
  console.log(chalk.gray("Downloading from cloud..."));
  let encryptedData: string;
  try {
    encryptedData = await downloadFromR2(config.projectId);
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

    // Write to .env file
    const envDir = path.dirname(envPath);
    if (!fs.existsSync(envDir)) {
      fs.mkdirSync(envDir, { recursive: true });
    }
    fs.writeFileSync(envPath, decrypted, "utf8");

    const lineCount = decrypted.split("\n").filter((l) => l.trim() && !l.startsWith("#")).length;
    console.log(chalk.green(`✓ Saved ${lineCount} environment variables to ${config.envPath}`));

    // Success message
    console.log(chalk.green("\n" + "═".repeat(50)));
    console.log(chalk.green.bold("\n🎉 Pull successful!\n"));
    console.log(chalk.white(`Your .env file is ready at ${chalk.yellow(config.envPath)}`));
    console.log();
    console.log(chalk.gray("Remember: Never commit .env to version control!"));
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

