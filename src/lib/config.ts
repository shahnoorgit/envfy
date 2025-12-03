import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { parseEnvContent } from "../utils/env-parser.js";
import { generateTypes, type GenerateTypesOptions } from "./generate-types.js";

export interface ConfigOptions {
  path?: string;           // .env file path (default: ".env")
  override?: boolean;      // override existing process.env (default: false)
  debug?: boolean;         // log debug info (default: false)
  encoding?: BufferEncoding; // file encoding (default: "utf8")
  schema?: z.ZodObject<any>;      // Zod schema for validation & type generation
  generateTypes?: boolean | Partial<GenerateTypesOptions>; // Auto-generate types
}

export interface ConfigResult {
  parsed?: { [key: string]: string };
  error?: Error;
}

/**
 * Load and parse a .env file and populate process.env
 * 
 * @param options - Configuration options
 * @returns Result object with parsed values or error
 * 
 * @example
 * ```typescript
 * import { config } from 'pushenv';
 * import { z } from 'zod';
 * 
 * // Load .env from current directory
 * config();
 * 
 * // Load from custom path
 * config({ path: '.env.production' });
 * 
 * // Override existing env vars
 * config({ override: true });
 * 
 * // Load + auto-generate TypeScript types
 * config({
 *   schema: z.object({ PORT: z.string() }),
 *   generateTypes: true
 * });
 * ```
 */
export function config(options: ConfigOptions = {}): ConfigResult {
  const {
    path: envPath = ".env",
    override = false,
    debug = false,
    encoding = "utf8",
    schema,
    generateTypes: shouldGenerateTypes,
  } = options;

  try {
    // Resolve the path relative to cwd
    const resolvedPath = path.resolve(process.cwd(), envPath);

    if (debug) {
      console.log(`[pushenv] Loading environment from: ${resolvedPath}`);
    }

    // Check if file exists
    if (!fs.existsSync(resolvedPath)) {
      const error = new Error(`ENOENT: no such file or directory, open '${resolvedPath}'`);
      (error as any).code = "ENOENT";
      
      if (debug) {
        console.log(`[pushenv] File not found: ${resolvedPath}`);
      }
      
      return { error };
    }

    // Read the file
    const content = fs.readFileSync(resolvedPath, { encoding });

    if (debug) {
      console.log(`[pushenv] File read successfully (${content.length} bytes)`);
    }

    // Parse the content
    const parseResult = parseEnvContent(content);
    const parsed = parseResult.env;

    if (debug) {
      console.log(`[pushenv] Parsed ${parseResult.count} environment variables`);
    }

    // Populate process.env
    let loadedCount = 0;
    let skippedCount = 0;

    for (const [key, value] of Object.entries(parsed)) {
      const hasExisting = Object.prototype.hasOwnProperty.call(process.env, key);
      
      if (hasExisting && !override) {
        if (debug) {
          console.log(`[pushenv] Skipped ${key} (already exists, use override: true to replace)`);
        }
        skippedCount++;
        continue;
      }

      process.env[key] = value;
      loadedCount++;

      if (debug) {
        console.log(`[pushenv] Set ${key}=${value.substring(0, 20)}${value.length > 20 ? "..." : ""}`);
      }
    }

    if (debug) {
      console.log(`[pushenv] Loaded ${loadedCount} variables, skipped ${skippedCount}`);
    }

    // Auto-generate TypeScript types if requested
    if (shouldGenerateTypes && schema) {
      const typeGenOptions: Partial<GenerateTypesOptions> = 
        typeof shouldGenerateTypes === 'object' 
          ? shouldGenerateTypes 
          : {};

      generateTypes({
        schema,
        silent: !debug,
        ...typeGenOptions,
      });
    }

    return { parsed };

  } catch (error) {
    if (debug) {
      console.error(`[pushenv] Error:`, error);
    }

    return {
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

