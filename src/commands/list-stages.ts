import chalk from "chalk";
import {
  isProjectInitialized,
  readProjectConfig,
  getConfiguredStages,
  getEnvPathForStage,
  envFileExists,
} from "../utils/config.js";
import { existsInR2 } from "../utils/r2-client.js";
import path from "node:path";

export async function listStagesCommand(): Promise<void> {
  console.log(chalk.cyan("\n🔐 pushenv list-stages - Show configured environments\n"));

  // Check if project is initialized
  if (!isProjectInitialized()) {
    console.log(chalk.red("✗ Project not initialized."));
    console.log(chalk.gray("  Run 'pushenv init' first to set up your project."));
    process.exit(1);
  }

  const config = readProjectConfig()!;
  const stages = getConfiguredStages(config);

  console.log(chalk.gray(`Project: ${config.projectId}\n`));

  if (stages.length === 0) {
    console.log(chalk.yellow("No stages configured."));
    console.log(chalk.gray("  Run 'pushenv init' to configure stages."));
    return;
  }

  console.log(chalk.white.bold("Configured stages:\n"));

  // Check each stage's status
  for (const stage of stages) {
    const envPath = getEnvPathForStage(config, stage);
    if (!envPath) continue;

    const resolvedEnvPath = path.resolve(process.cwd(), envPath);
    const localExists = envFileExists(resolvedEnvPath);
    const cloudExists = await existsInR2(config.projectId, stage);

    const localStatus = localExists
      ? chalk.green("✓ local")
      : chalk.gray("✗ local");
    const cloudStatus = cloudExists
      ? chalk.green("✓ cloud")
      : chalk.gray("✗ cloud");

    console.log(
      `  ${chalk.yellow(stage.padEnd(12))} ${chalk.gray(envPath.padEnd(20))} ${localStatus}  ${cloudStatus}`
    );
  }

  console.log();
  console.log(chalk.gray("Legend:"));
  console.log(chalk.gray("  ✓ local  = .env file exists locally"));
  console.log(chalk.gray("  ✓ cloud  = encrypted .env is in cloud storage"));
  console.log();
  console.log(chalk.cyan("Commands:"));
  console.log(chalk.white(`  pushenv push --stage <stage>   Push a stage to cloud`));
  console.log(chalk.white(`  pushenv pull --stage <stage>   Pull a stage from cloud`));
  console.log();
}

