import fs from "node:fs";
import path from "node:path";
import inquirer from "inquirer";
import chalk from "chalk";
import {
  isProjectInitialized,
  readProjectConfig,
  getKeyEntry,
} from "../utils/config.js";
import { encrypt } from "../utils/crypto.js";
import { uploadToR2 } from "../utils/r2-client.js";

export async function pushCommand(): Promise<void> {
  console.log(chalk.cyan("\n🔐 pushenv push - Encrypt and upload .env\n"));

  // Check if project is initialized
  if (!isProjectInitialized()) {
    console.log(chalk.red("✗ Project not initialized."));
    console.log(chalk.gray("  Run 'pushenv init' first to set up your project."));
    process.exit(1);
  }

  const config = readProjectConfig()!;

  // Check if .env file exists
  const envPath = path.resolve(process.cwd(), config.envPath);
  if (!fs.existsSync(envPath)) {
    console.log(chalk.red(`✗ .env file not found at ${config.envPath}`));
    process.exit(1);
  }

  console.log(chalk.gray(`Project: ${config.projectId}`));
  console.log(chalk.gray(`Env file: ${config.envPath}\n`));

  // Load derived key material for this project
  const keyEntry = getKeyEntry(config.projectId);
  if (!keyEntry) {
    console.log(chalk.red("✗ No key material found for this project on this machine."));
    console.log(
      chalk.gray(
        "  Run 'pushenv pull' here once (with the shared passphrase) to set up this machine."
      )
    );
    process.exit(1);
  }

  console.log();

  // Read .env file
  console.log(chalk.gray("Reading .env file..."));
  const envContent = fs.readFileSync(envPath, "utf8");
  const lineCount = envContent.split("\n").filter((l) => l.trim() && !l.startsWith("#")).length;
  console.log(chalk.green(`✓ Found ${lineCount} environment variables`));

  // Encrypt
  console.log(chalk.gray("Encrypting..."));
  const salt = Buffer.from(keyEntry.salt, "base64");
  const key = Buffer.from(keyEntry.key, "base64");
  const encrypted = encrypt(envContent, key);
  
  // Store salt with encrypted data so teammates can decrypt
  // Format: salt_hex:encrypted_data
  const dataToUpload = `${salt.toString("hex")}:${encrypted}`;
  console.log(chalk.green("✓ Encrypted successfully"));

  // Upload to R2
  console.log(chalk.gray("Uploading to cloud..."));
  try {
    await uploadToR2(config.projectId, dataToUpload);
    console.log(chalk.green("✓ Uploaded to cloud storage"));
  } catch (error) {
    if (error instanceof Error) {
      console.log(chalk.red(`✗ Upload failed: ${error.message}`));
    }
    process.exit(1);
  }

  // Success message
  console.log(chalk.green("\n" + "═".repeat(50)));
  console.log(chalk.green.bold("\n🎉 Push successful!\n"));
  console.log(chalk.white("Your encrypted .env is now in the cloud."));
  console.log();
  console.log(chalk.cyan("Share with your team:"));
  console.log(chalk.white(`  1. Commit ${chalk.yellow(".pushenv/config.json")} to your repo`));
  console.log(chalk.white(`  2. Share the ${chalk.yellow("passphrase")} securely (Signal, 1Password, etc.)`));
  console.log(chalk.white(`  3. Teammates run ${chalk.yellow("pushenv pull")} and enter the passphrase`));
  console.log(chalk.green("\n" + "═".repeat(50) + "\n"));
}

