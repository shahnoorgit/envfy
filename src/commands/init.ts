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
  AVAILABLE_STAGES,
  DEFAULT_STAGE,
  type ProjectConfig,
  type KeyEntry,
  type StageConfig,
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

  // Step 2: Ask which stages to configure
  const { selectedStages } = await inquirer.prompt<{ selectedStages: string[] }>([
    {
      type: "checkbox",
      name: "selectedStages",
      message: "Which stages/environments do you want to configure?",
      choices: AVAILABLE_STAGES.map((stage) => ({
        name: stage,
        value: stage,
        checked: stage === DEFAULT_STAGE, // development checked by default
      })),
      validate: (input: string[]) => {
        if (input.length === 0) {
          return "Please select at least one stage";
        }
        return true;
      },
    },
  ]);

  console.log();

  // Step 3: For each selected stage, ask for .env file location
  const stages: { [stage: string]: StageConfig } = {};
  
  for (const stage of selectedStages) {
    const defaultEnvPath = selectedStages.length === 1 ? ".env" : `.env.${stage}`;
    
  const { envPath } = await inquirer.prompt<{ envPath: string }>([
    {
      type: "input",
      name: "envPath",
        message: `Where is your ${chalk.yellow(stage)} .env file located?`,
        default: defaultEnvPath,
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

    // Check if .env exists for this stage
  if (!envFileExists(resolvedEnvPath)) {
      console.log(chalk.yellow(`  ⚠️  File '${relativeEnvPath}' does not exist yet.`));
    const { createEnv } = await inquirer.prompt<{ createEnv: boolean }>([
      {
        type: "confirm",
        name: "createEnv",
          message: `  Would you like to create an empty ${stage} .env file?`,
        default: true,
      },
    ]);

    if (createEnv) {
      const envDir = path.dirname(resolvedEnvPath);
      if (!fs.existsSync(envDir)) {
        fs.mkdirSync(envDir, { recursive: true });
      }
        fs.writeFileSync(resolvedEnvPath, `# ${stage.toUpperCase()} environment variables\n`, "utf8");
        console.log(chalk.green(`  ✓ Created ${relativeEnvPath}`));
    }
    } else {
      console.log(chalk.green(`  ✓ Found ${relativeEnvPath}`));
    }

    stages[stage] = { envPath: relativeEnvPath };
    console.log();
  }

  // Step 4: Ask for passphrase
  const { passphrase } = await inquirer.prompt<{ passphrase: string }>([
    {
      type: "password",
      name: "passphrase",
      message: "Enter a passphrase to encrypt your .env files:",
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

  // Step 5: Generate encryption key
  console.log(chalk.gray("Generating encryption key..."));
  const { key, salt } = deriveKeyFromPassphrase(passphrase);
  console.log(chalk.green("✓ Encryption key generated"));

  // Step 6: Generate project ID
  const projectId = generateProjectId();
  console.log(chalk.green(`✓ Project ID: ${chalk.cyan(projectId)}`));

  // Step 7: Save project config with stages
  // Use the first stage's envPath as the legacy envPath for backward compatibility
  const firstStage = selectedStages[0]!;
  const firstStageEnvPath = stages[firstStage]!.envPath;
  
  const projectConfig: ProjectConfig = {
    projectId,
    envPath: firstStageEnvPath, // Legacy field for backward compatibility
    createdAt: new Date().toISOString(),
    stages,
  };

  saveProjectConfig(projectConfig);
  console.log(chalk.green(`✓ Saved config to ${getProjectConfigDir()}/config.json`));

  // Step 8: Save key entry to global config (salt + derived key only)
  const keyEntry: KeyEntry = {
    projectId,
    salt: salt.toString("base64"),
    key: key.toString("base64"),
    createdAt: new Date().toISOString(),
  };
  saveKeyEntry(keyEntry);
  console.log(chalk.green(`✓ Saved key to ${getGlobalKeysPath()}`));

  // Step 9: Print success message
  console.log(chalk.green("\n" + "═".repeat(50)));
  console.log(chalk.green.bold("\n🎉 Project initialized successfully!\n"));
  console.log(chalk.white("Your .env files are ready to be synced securely."));
  console.log();
  
  console.log(chalk.cyan("Configured stages:"));
  for (const stage of selectedStages) {
    console.log(chalk.white(`  • ${chalk.yellow(stage)}: ${stages[stage]!.envPath}`));
  }
  console.log();

  console.log(chalk.cyan("Next steps:"));
  console.log(chalk.white(`  1. Add your secrets to your .env files`));
  if (selectedStages.length === 1) {
  console.log(chalk.white(`  2. Run ${chalk.yellow("pushenv push")} to encrypt and upload`));
  } else {
    console.log(chalk.white(`  2. Run ${chalk.yellow("pushenv push --stage <stage>")} to encrypt and upload`));
    console.log(chalk.white(`     Example: ${chalk.gray(`pushenv push --stage production`)}`));
  }
  console.log(chalk.white(`  3. Commit ${chalk.yellow(".pushenv/config.json")} to your repo`));
  console.log(chalk.white(`  4. Share the passphrase securely with your team`));
  console.log(chalk.white(`  5. Team members run ${chalk.yellow("pushenv pull --stage <stage>")} to sync`));
  console.log();
  console.log(chalk.gray(`Project ID: ${projectId}`));
  console.log(chalk.gray(`Config: .pushenv/config.json`));
  console.log(chalk.green("═".repeat(50) + "\n"));
}