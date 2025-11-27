#!/usr/bin/env node
import { Command } from "commander";
import { initCommand } from "./commands/init.js";
import { pushCommand } from "./commands/push.js";
import { pullCommand } from "./commands/pull.js";
import { listStagesCommand } from "./commands/list-stages.js";
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
  .command("push")
  .description("Encrypt and upload your .env to the cloud")
  .option("-s, --stage <stage>", "Stage/environment to push", DEFAULT_STAGE)
  .action(async (options: { stage: string }) => {
    try {
      await pushCommand(options.stage);
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

program.parse();
