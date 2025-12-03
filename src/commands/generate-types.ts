import fs from "node:fs";
import path from "node:path";
import chalk from "chalk";
import { generateTypes } from "../lib/generate-types.js";
import { z } from "zod";
import { parseEnvContent } from "../utils/env-parser.js";

export interface GenerateTypesCommandOptions {
  envPath?: string;
  output?: string;
  skipGitignore?: boolean;
}

/**
 * CLI command to generate TypeScript type definitions
 * 
 * This command reads an .env file and generates TypeScript types
 * for process.env with proper type inference.
 */
export async function generateTypesCommand(options: GenerateTypesCommandOptions = {}): Promise<void> {
  console.log(chalk.cyan("\n🔧 PushEnv Type Generator\n"));

  const {
    envPath = ".env",
    output = "pushenv-env.d.ts",
    skipGitignore = false,
  } = options;

  try {
    // Resolve the .env file path
    const resolvedEnvPath = path.resolve(process.cwd(), envPath);

    // Check if .env file exists
    if (!fs.existsSync(resolvedEnvPath)) {
      console.error(chalk.red(`❌ Error: .env file not found at ${resolvedEnvPath}`));
      console.log(chalk.yellow("\n💡 Tip: Specify a custom path with --env-path"));
      console.log(chalk.gray(`   Example: pushenv generate-types --env-path .env.production\n`));
      process.exit(1);
    }

    console.log(chalk.gray(`Reading environment from: ${path.relative(process.cwd(), resolvedEnvPath)}`));

    // Read and parse the .env file
    const content = fs.readFileSync(resolvedEnvPath, "utf8");
    const parseResult = parseEnvContent(content);

    if (parseResult.count === 0) {
      console.log(chalk.yellow("\n⚠️  No environment variables found in .env file"));
      console.log(chalk.gray("   Add some variables and try again\n"));
      process.exit(0);
    }

    console.log(chalk.green(`✓ Found ${parseResult.count} environment variables\n`));

    // Generate a basic Zod schema from the parsed env vars
    // All variables are strings by default (with optional support)
    const schemaShape: Record<string, z.ZodTypeAny> = {};
    
    for (const key of parseResult.keys) {
      // Make all variables optional since we're inferring from .env
      schemaShape[key] = z.string().optional();
    }

    const schema = z.object(schemaShape);

    // Generate the TypeScript types
    const result = generateTypes({
      schema,
      output,
      addToGitignore: !skipGitignore,
      silent: false,
    });

    if (!result.success) {
      console.error(chalk.red("\n❌ Failed to generate types"));
      if (result.error) {
        console.error(chalk.red(result.error.message));
      }
      process.exit(1);
    }

    // Success message
    console.log(chalk.green.bold("🎉 Type generation complete!\n"));
    
    console.log(chalk.cyan("Next steps:"));
    console.log(chalk.white(`  1. TypeScript will now auto-complete process.env variables`));
    console.log(chalk.white(`  2. Add to tsconfig.json if needed: "include": ["${output}"]`));
    console.log(chalk.white(`  3. For better types, use Zod schemas with generateTypes()`));
    
    console.log(chalk.gray("\n💡 Pro tip: Use pushenv.generateTypes() in code for Zod-powered types!"));
    console.log(chalk.gray("   Example:"));
    console.log(chalk.gray("     import { generateTypes } from 'pushenv';"));
    console.log(chalk.gray("     import { z } from 'zod';"));
    console.log(chalk.gray(""));
    console.log(chalk.gray("     generateTypes({"));
    console.log(chalk.gray("       schema: z.object({"));
    console.log(chalk.gray("         PORT: z.coerce.number(),"));
    console.log(chalk.gray("         NODE_ENV: z.enum(['development', 'production']),"));
    console.log(chalk.gray("       })"));
    console.log(chalk.gray("     });\n"));

  } catch (error) {
    console.error(chalk.red("\n❌ Error generating types:"));
    console.error(error);
    process.exit(1);
  }
}

