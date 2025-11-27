import fs from "node:fs";
import path from "node:path";
import inquirer from "inquirer";
import chalk from "chalk";
import {
  isProjectInitialized,
  saveProjectConfig,
  saveKeyEntry,
  getProjectConfigDir,
  getGlobalKeysPath,
  envFileExists,
  type ProjectConfig,
  type KeyEntry,
} from "../utils/config.js";
import {
  generateProjectId,
  deriveKeyFromPassphrase,
} from "../utils/crypto.js";

export async function initCommand(): Promise<void> {
  console.log(chalk.cyan("\n🔐 pushenv - Secure .env sync for teams\n"));

  // Step 1: Check if already initialized
  if (isProjectInitialized()) {
    console.log(chalk.yellow("⚠️  This project is already initialized."));
    const { reinitialize } = await inquirer.prompt<{ reinitialize: boolean }>([
      {
        type: "confirm",
        name: "reinitialize",
        message: "Do you want to reinitialize? This will overwrite existing config.",
        default: false,
      },
    ]);

    if (!reinitialize) {
      console.log(chalk.gray("Initialization cancelled."));
      return;
    }
    console.log();
  }

  // Step 2: Ask for .env location
  const { envPath } = await inquirer.prompt<{ envPath: string }>([
    {
      type: "input",
      name: "envPath",
      message: "Where is your .env file located?",
      default: ".env",
      validate: (input: string) => {
        if (!input.trim()) {
          return "Please enter a path";
        }
        return true;
      },
    },
  ]);

  const resolvedEnvPath = path.resolve(process.cwd(), envPath);
  const relativeEnvPath = path.relative(process.cwd(), resolvedEnvPath);

  // Check if .env exists
  if (!envFileExists(resolvedEnvPath)) {
    console.log(chalk.yellow(`\n⚠️  File '${relativeEnvPath}' does not exist yet.`));
    const { createEnv } = await inquirer.prompt<{ createEnv: boolean }>([
      {
        type: "confirm",
        name: "createEnv",
        message: "Would you like to create an empty .env file?",
        default: true,
      },
    ]);

    if (createEnv) {
      const envDir = path.dirname(resolvedEnvPath);
      if (!fs.existsSync(envDir)) {
        fs.mkdirSync(envDir, { recursive: true });
      }
      fs.writeFileSync(resolvedEnvPath, "# Environment variables\n", "utf8");
      console.log(chalk.green(`✓ Created ${relativeEnvPath}`));
    }
    console.log();
  } else {
    console.log(chalk.green(`✓ Found ${relativeEnvPath}\n`));
  }

  // Step 3: Ask for passphrase
  const { passphrase } = await inquirer.prompt<{ passphrase: string }>([
    {
      type: "password",
      name: "passphrase",
      message: "Enter a passphrase to encrypt your .env:",
      mask: "*",
      validate: (input: string) => {
        if (input.length < 8) {
          return "Passphrase must be at least 8 characters";
        }
        return true;
      },
    },
  ]);

  const { confirmPassphrase } = await inquirer.prompt<{ confirmPassphrase: string }>([
    {
      type: "password",
      name: "confirmPassphrase",
      message: "Confirm your passphrase:",
      mask: "*",
      validate: (input: string) => {
        if (input !== passphrase) {
          return "Passphrases do not match";
        }
        return true;
      },
    },
  ]);

  console.log();

  // Step 4: Generate encryption key
  console.log(chalk.gray("Generating encryption key..."));
  const { key, salt } = deriveKeyFromPassphrase(passphrase);
  console.log(chalk.green("✓ Encryption key generated"));

  // Step 5: Generate project ID
  const projectId = generateProjectId();
  console.log(chalk.green(`✓ Project ID: ${chalk.cyan(projectId)}`));

  // Step 6: Save project config
  const projectConfig: ProjectConfig = {
    projectId,
    envPath: relativeEnvPath,
    createdAt: new Date().toISOString(),
  };

  saveProjectConfig(projectConfig);
  console.log(chalk.green(`✓ Saved config to ${getProjectConfigDir()}/config.json`));

  // Step 7: Save key entry to global config (salt + derived key only)
  const keyEntry: KeyEntry = {
    projectId,
    salt: salt.toString("base64"),
    key: key.toString("base64"),
    createdAt: new Date().toISOString(),
  };
  saveKeyEntry(keyEntry);
  console.log(chalk.green(`✓ Saved key to ${getGlobalKeysPath()}`));
  // Step 8: Print success message
  console.log(chalk.green("\n" + "═".repeat(50)));
  console.log(chalk.green.bold("\n🎉 Project initialized successfully!\n"));
  console.log(chalk.white("Your .env file is ready to be synced securely."));
  console.log();
  console.log(chalk.cyan("Next steps:"));
  console.log(chalk.white(`  1. Add your secrets to ${chalk.yellow(relativeEnvPath)}`));
  console.log(chalk.white(`  2. Run ${chalk.yellow("pushenv push")} to encrypt and upload`));
  console.log(chalk.white(`  3. Commit ${chalk.yellow(".pushenv/config.json")} to your repo`));
  console.log(chalk.white(`  4. Share the passphrase securely with your team`));
  console.log(chalk.white(`  5. Team members run ${chalk.yellow("pushenv pull")} to sync`));
  console.log();
  console.log(chalk.gray(`Project ID: ${projectId}`));
  console.log(chalk.gray(`Config: .pushenv/config.json`));
  console.log(chalk.green("═".repeat(50) + "\n"));
}
