import { spawn, type ChildProcess } from "node:child_process";
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
import { parseEnvContent } from "../utils/env-parser.js";

export interface RunOptions {
  stage: string;
  verbose: boolean;
  dryRun: boolean;
}

export async function runCommand(
  command: string[],
  options: RunOptions
): Promise<void> {
  const { stage, verbose, dryRun } = options;

  console.log(chalk.cyan("\n🔐 pushenv run - Zero-file execution\n"));

  // Check if project is initialized
  if (!isProjectInitialized()) {
    console.log(chalk.red("✗ Project not initialized."));
    console.log(chalk.gray("  Run 'pushenv init' first to set up your project."));
    process.exit(1);
  }

  const config = readProjectConfig()!;

  console.log(chalk.gray(`  Project: ${config.projectId}`));
  console.log(chalk.gray(`  Stage: ${stage}`));
  console.log();

  // Check if encrypted data exists in R2 for this stage
  console.log(chalk.gray("  Fetching secrets..."));
  const exists = await existsInR2(config.projectId, stage);
  if (!exists) {
    console.log(chalk.red(`\n✗ No encrypted .env found for stage '${stage}'.`));
    console.log(chalk.gray(`  Run 'pushenv push --stage ${stage}' first.`));
    process.exit(1);
  }

  // Download encrypted data
  let encryptedData: string;
  try {
    encryptedData = await downloadFromR2(config.projectId, stage);
    console.log(chalk.green("  ✓ Fetched secrets"));
  } catch (error) {
    if (error instanceof Error) {
      console.log(chalk.red(`\n✗ Download failed: ${error.message}`));
    }
    process.exit(1);
  }

  // Extract salt and decrypt
  console.log(chalk.gray("  Decrypting..."));
  
  const firstColon = encryptedData.indexOf(":");
  if (firstColon === -1) {
    console.log(chalk.red("\n✗ Invalid encrypted data format."));
    process.exit(1);
  }
  
  const saltHex = encryptedData.slice(0, firstColon);
  const actualEncryptedData = encryptedData.slice(firstColon + 1);
  const salt = Buffer.from(saltHex, "hex");
  
  let decrypted: string;
  try {
    // Get key (from storage or prompt for passphrase)
    let keyBuffer: Buffer | null = null;
    let shouldPersistKey = false;

    const existingKeyEntry = getKeyEntry(config.projectId);
    if (existingKeyEntry) {
      keyBuffer = Buffer.from(existingKeyEntry.key, "base64");
    } else {
      console.log();
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
    
    decrypted = decrypt(actualEncryptedData, keyBuffer);
    console.log(chalk.green("  ✓ Decrypted"));

    // Persist key if this is first time
    if (shouldPersistKey) {
      const keyEntry: KeyEntry = {
        projectId: config.projectId,
        salt: saltHex,
        key: (keyBuffer as Buffer).toString("base64"),
        createdAt: new Date().toISOString(),
      };
      saveKeyEntry(keyEntry);
    }
  } catch (error) {
    if (error instanceof Error) {
      const existingKeyEntry = getKeyEntry(config.projectId);
      if (existingKeyEntry) {
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

  // Parse env content
  const { env, count, keys } = parseEnvContent(decrypted);
  console.log(chalk.green(`  ✓ Loaded ${count} environment variables`));

  // Verbose mode - show variable names
  if (verbose || dryRun) {
    console.log();
    console.log(chalk.gray("  Variables to inject:"));
    const displayKeys = keys.slice(0, 10);
    for (const key of displayKeys) {
      console.log(chalk.gray(`    • ${key}`));
    }
    if (keys.length > 10) {
      console.log(chalk.gray(`    ... and ${keys.length - 10} more`));
    }
  }

  // Dry run mode - don't actually run
  if (dryRun) {
    console.log();
    console.log(chalk.cyan("  Command that would run:"));
    console.log(chalk.white(`    ${command.join(" ")}`));
    console.log();
    console.log(chalk.yellow("  (No command executed - dry run)"));
    console.log();
    return;
  }

  // Print separator before running command
  console.log();
  console.log(chalk.cyan("═".repeat(50)));
  console.log(chalk.cyan(`  Running: ${chalk.white(command.join(" "))}`));
  console.log(chalk.cyan("═".repeat(50)));
  console.log();

  // Spawn child process with injected environment
  const [cmd, ...args] = command;
  
  if (!cmd) {
    console.log(chalk.red("✗ No command specified."));
    process.exit(1);
  }

  const child: ChildProcess = spawn(cmd, args, {
    env: {
      ...process.env,  // Inherit existing environment
      ...env,          // Inject decrypted secrets
    },
    stdio: "inherit",  // Pipe stdin/stdout/stderr
    shell: true,       // Use shell for command parsing
  });

  // Forward signals to child process
  const signals: NodeJS.Signals[] = ["SIGINT", "SIGTERM", "SIGHUP"];
  
  const signalHandler = (signal: NodeJS.Signals) => {
    if (child.pid) {
      child.kill(signal);
    }
  };

  for (const signal of signals) {
    process.on(signal, () => signalHandler(signal));
  }

  // Wait for child to exit
  child.on("error", (error) => {
    console.log(chalk.red(`\n✗ Failed to start command: ${error.message}`));
    process.exit(1);
  });

  child.on("exit", (code, signal) => {
    // Clean up signal handlers
    for (const sig of signals) {
      process.removeAllListeners(sig);
    }

    if (signal) {
      // Process was killed by a signal
      process.exit(128 + (signalToNumber(signal) || 0));
    }
    
    process.exit(code ?? 0);
  });
}

/**
 * Convert signal name to number for exit code calculation
 */
function signalToNumber(signal: NodeJS.Signals): number {
  const signalMap: Record<string, number> = {
    SIGHUP: 1,
    SIGINT: 2,
    SIGQUIT: 3,
    SIGTERM: 15,
  };
  return signalMap[signal] || 0;
}

