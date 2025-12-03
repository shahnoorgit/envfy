import fs from "node:fs";
import path from "node:path";
import inquirer from "inquirer";
import chalk from "chalk";
import {
  isProjectInitialized,
  readProjectConfig,
  saveProjectConfig,
  getProjectConfigDir,
  envFileExists,
  AVAILABLE_STAGES,
  getConfiguredStages,
  type StageConfig,
} from "../utils/config.js";

export async function addStageCommand(): Promise<void> {
  console.log(chalk.cyan("\n🔐 pushenv add-stage - Add new stage to project\n"));

  // Check if project is initialized
  if (!isProjectInitialized()) {
    console.log(chalk.red("✗ Project not initialized."));
    console.log(chalk.gray("  Run 'pushenv init' first to set up your project."));
    process.exit(1);
  }

  const config = readProjectConfig()!;
  const currentStages = getConfiguredStages(config);

  console.log(chalk.gray(`Current stages: ${currentStages.join(", ")}\n`));

  // Get available stages that aren't configured yet
  const availableToAdd = AVAILABLE_STAGES.filter(
    (stage) => !currentStages.includes(stage)
  );

  if (availableToAdd.length === 0) {
    console.log(chalk.yellow("⚠️  All available stages are already configured."));
    console.log(chalk.gray(`  Configured stages: ${currentStages.join(", ")}`));
    console.log();
    return;
  }

  // Ask which stage to add
  const { stageToAdd } = await inquirer.prompt<{ stageToAdd: string }>([
    {
      type: "list",
      name: "stageToAdd",
      message: "Which stage do you want to add?",
      choices: availableToAdd,
    },
  ]);

  console.log();

  // Ask for .env file location with auto-rename to .env.{stage}
  const defaultEnvPath = `.env.${stageToAdd}`;
  
  const { envPath } = await inquirer.prompt<{ envPath: string }>([
    {
      type: "input",
      name: "envPath",
      message: `Where should the ${chalk.yellow(stageToAdd)} .env file be located?`,
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

  // Warn if using plain .env
  if (relativeEnvPath === ".env") {
    console.log(chalk.yellow("\n⚠️  WARNING: Using '.env' for a specific stage is not recommended."));
    console.log(chalk.gray(`  Consider using '${defaultEnvPath}' instead for clarity and safety.\n`));
    
    const { usePlainEnv } = await inquirer.prompt<{ usePlainEnv: boolean }>([
      {
        type: "confirm",
        name: "usePlainEnv",
        message: "Continue with '.env' anyway?",
        default: false,
      },
    ]);

    if (!usePlainEnv) {
      console.log(chalk.gray("\nAdd stage cancelled."));
      return;
    }
  }

  // Check if .env file exists for this stage
  if (!envFileExists(resolvedEnvPath)) {
    console.log(chalk.yellow(`  ⚠️  File '${relativeEnvPath}' does not exist yet.`));
    const { createEnv } = await inquirer.prompt<{ createEnv: boolean }>([
      {
        type: "confirm",
        name: "createEnv",
        message: `  Would you like to create an empty ${stageToAdd} .env file?`,
        default: true,
      },
    ]);

    if (createEnv) {
      const envDir = path.dirname(resolvedEnvPath);
      if (!fs.existsSync(envDir)) {
        fs.mkdirSync(envDir, { recursive: true });
      }
      fs.writeFileSync(resolvedEnvPath, `# ${stageToAdd.toUpperCase()} environment variables\n`, "utf8");
      console.log(chalk.green(`  ✓ Created ${relativeEnvPath}`));
    }
  } else {
    console.log(chalk.green(`  ✓ Found ${relativeEnvPath}`));
  }

  console.log();

  // Add the stage to config
  if (!config.stages) {
    config.stages = {};
  }

  config.stages[stageToAdd] = { envPath: relativeEnvPath };

  // Save updated config
  saveProjectConfig(config);
  console.log(chalk.green(`✓ Added stage '${stageToAdd}' to config`));
  console.log(chalk.green(`✓ Saved config to ${getProjectConfigDir()}/config.json`));

  // Print success message
  console.log(chalk.green("\n" + "═".repeat(50)));
  console.log(chalk.green.bold(`\n🎉 Stage '${stageToAdd}' added successfully!\n`));

  console.log(chalk.cyan("All configured stages:"));
  const updatedStages = getConfiguredStages(config);
  for (const stage of updatedStages) {
    console.log(chalk.white(`  • ${chalk.yellow(stage)}: ${config.stages![stage]!.envPath}`));
  }
  console.log();

  console.log(chalk.cyan("Next steps:"));
  console.log(chalk.white(`  1. Add your secrets to ${chalk.yellow(relativeEnvPath)}`));
  console.log(chalk.white(`  2. Run ${chalk.yellow(`pushenv push --stage ${stageToAdd}`)} to encrypt and upload`));
  console.log(chalk.white(`  3. Team members run ${chalk.yellow(`pushenv pull --stage ${stageToAdd}`)} to sync`));
  console.log();
  console.log(chalk.gray(`Config: .pushenv/config.json`));
  console.log(chalk.green("═".repeat(50) + "\n"));
}






