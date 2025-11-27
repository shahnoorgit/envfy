#!/usr/bin/env node
import { Command } from "commander";
import { initCommand } from "./commands/init.js";
import { pushCommand } from "./commands/push.js";
import { pullCommand } from "./commands/pull.js";
import { PACKAGE_VERSION } from "./config/version.js";

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
  .action(async () => {
    try {
      await pushCommand();
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
  .action(async () => {
    try {
      await pullCommand();
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error: ${error.message}`);
      }
      process.exit(1);
    }
  });

program.parse();
