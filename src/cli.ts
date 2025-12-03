#!/usr/bin/env node
import { Command } from "commander";
import { initCommand } from "./commands/init.js";
import { addStageCommand } from "./commands/add-stage.js";
import { pushCommand } from "./commands/push.js";
import { pullCommand } from "./commands/pull.js";
import { listStagesCommand } from "./commands/list-stages.js";
import { runCommand } from "./commands/run.js";
import { diffCommand } from "./commands/diff.js";
import { historyCommand } from "./commands/history.js";
import { rollbackCommand } from "./commands/rollback.js";
import { exampleCommand } from "./commands/example.js";
import { generateTypesCommand } from "./commands/generate-types.js";
import { PACKAGE_VERSION } from "./config/version.js";
import { DEFAULT_STAGE } from "./utils/config.js";

const program = new Command();

program
  .name("pushenv")
  .description("Secure .env sync CLI for teams")
  .version(PACKAGE_VERSION);

program
  .command("init")
  .description("Initialize pushenv in your project")
  .action(async () => {
    try {
      await initCommand();
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error: ${error.message}`);
      }
      process.exit(1);
    }
  });

program
  .command("add-stage")
  .description("Add a new stage/environment to an existing project")
  .action(async () => {
    try {
      await addStageCommand();
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error: ${error.message}`);
      }
      process.exit(1);
    }
  });

program
  .command("push")
  .description("Encrypt and upload your .env to the cloud")
  .option("-s, --stage <stage>", "Stage/environment to push", DEFAULT_STAGE)
  .option("-m, --message <message>", "Message for this version")
  .option("-f, --force", "Force push even if no changes detected", false)
  .action(async (options: { stage: string; message?: string; force?: boolean }) => {
    try {
      await pushCommand(options.stage, {
        message: options.message,
        force: options.force,
      });
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error: ${error.message}`);
      }
      process.exit(1);
    }
  });

program
  .command("pull")
  .description("Download and decrypt .env from the cloud")
  .option("-s, --stage <stage>", "Stage/environment to pull", DEFAULT_STAGE)
  .action(async (options: { stage: string }) => {
    try {
      await pullCommand(options.stage);
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error: ${error.message}`);
      }
      process.exit(1);
    }
  });

program
  .command("list-stages")
  .alias("ls")
  .description("List all configured stages and their status")
  .action(async () => {
    try {
      await listStagesCommand();
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error: ${error.message}`);
      }
      process.exit(1);
    }
  });

program
  .command("run <command...>")
  .description("Run a command with secrets injected (no .env file created)")
  .option("-s, --stage <stage>", "Stage/environment to use", DEFAULT_STAGE)
  .option("-v, --verbose", "Show injected variable names", false)
  .option("--dry-run", "Show what would be injected without running", false)
  .action(async (command: string[], options: { stage: string; verbose: boolean; dryRun: boolean }) => {
    try {
      await runCommand(command, {
        stage: options.stage,
        verbose: options.verbose,
        dryRun: options.dryRun,
      });
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error: ${error.message}`);
      }
      process.exit(1);
    }
  });

program
  .command("diff")
  .description("Compare local .env with remote (encrypted) version")
  .option("-s, --stage <stage>", "Stage/environment to compare", DEFAULT_STAGE)
  .option("-v, --version <version>", "Compare with specific version number")
  .action(async (options: { stage: string; version?: string }) => {
    try {
      const version = options.version ? parseInt(options.version, 10) : undefined;
      if (options.version && isNaN(version!)) {
        console.error("Error: Version must be a number");
        process.exit(1);
      }
      await diffCommand(options.stage, { version });
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error: ${error.message}`);
      }
      process.exit(1);
    }
  });

program
  .command("history")
  .description("Show version history for a stage")
  .option("-s, --stage <stage>", "Stage/environment to show history for", DEFAULT_STAGE)
  .action(async (options: { stage: string }) => {
    try {
      await historyCommand(options.stage);
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error: ${error.message}`);
      }
      process.exit(1);
    }
  });

program
  .command("rollback")
  .description("Restore a previous version (creates new version with rollback data)")
  .option("-s, --stage <stage>", "Stage/environment to rollback", DEFAULT_STAGE)
  .option("-v, --version <version>", "Version number to rollback to (required)")
  .action(async (options: { stage: string; version?: string }) => {
    try {
      if (!options.version) {
        console.error("Error: Version number is required. Use --version <number>");
        process.exit(1);
      }
      const version = parseInt(options.version, 10);
      if (isNaN(version)) {
        console.error("Error: Version must be a number");
        process.exit(1);
      }
      await rollbackCommand(options.stage, version);
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error: ${error.message}`);
      }
      process.exit(1);
    }
  });

program
  .command("example")
  .description("Generate example .env file with placeholder values (safe to commit)")
  .option("-s, --stage <stage>", "Stage/environment to use", DEFAULT_STAGE)
  .option("-o, --output <path>", "Output file path (default: .env.{stage}.example)")
  .action(async (options: { stage: string; output?: string }) => {
    try {
      await exampleCommand(options.stage, options.output);
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error: ${error.message}`);
      }
      process.exit(1);
    }
  });

program
  .command("generate-types")
  .alias("types")
  .description("Generate TypeScript type definitions from .env file")
  .option("-e, --env-path <path>", "Path to .env file", ".env")
  .option("-o, --output <path>", "Output file path", "pushenv-env.d.ts")
  .option("--skip-gitignore", "Skip adding to .gitignore", false)
  .action(async (options: { envPath: string; output: string; skipGitignore: boolean }) => {
    try {
      await generateTypesCommand({
        envPath: options.envPath,
        output: options.output,
        skipGitignore: options.skipGitignore,
      });
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error: ${error.message}`);
      }
      process.exit(1);
    }
  });

program.parse();
