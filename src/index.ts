/**
 * PushEnv - Secure .env management with validation
 * 
 * Use as a library (like dotenv) or as a CLI tool for team sync
 * 
 * @example Library usage (drop-in dotenv replacement)
 * ```typescript
 * import pushenv, { z } from 'pushenv';
 * 
 * // Load .env file
 * pushenv.config();
 * 
 * // Load with options
 * pushenv.config({ path: '.env.production', override: true });
 * 
 * // Validate with Zod schema (z is re-exported from pushenv!)
 * pushenv.validate({
 *   schema: z.object({
 *     PORT: z.string().regex(/^\d+$/),
 *     DATABASE_URL: z.string().url(),
 *   })
 * });
 * ```
 * 
 * @example Named imports (no separate zod install needed!)
 * ```typescript
 * import { config, validateOrThrow, z } from 'pushenv';
 * 
 * config();
 * 
 * const env = validateOrThrow(z.object({
 *   PORT: z.coerce.number(),
 *   DATABASE_URL: z.string().url(),
 * }));
 * 
 * env.PORT;        // number ✓ Fully typed!
 * env.DATABASE_URL // string ✓ Validated URL!
 * ```
 * 
 * @example CLI usage
 * ```bash
 * # Install globally for CLI
 * npm install -g pushenv
 * 
 * # Initialize project
 * pushenv init
 * 
 * # Push encrypted .env to cloud
 * pushenv push --stage production
 * 
 * # Pull encrypted .env from cloud
 * pushenv pull --stage production
 * 
 * # Run command with env in memory (no .env file)
 * pushenv run --stage production "npm start"
 * ```
 */

// Import functions
import { config, type ConfigOptions, type ConfigResult } from "./lib/config.js";
import { 
  validate, 
  validateOrThrow,
  type ValidateOptions, 
  type ValidateResult,
  type ValidationError 
} from "./lib/validate.js";
import {
  generateTypes,
  generateTypesFromSchema,
  type GenerateTypesOptions,
  type GenerateTypesResult
} from "./lib/generate-types.js";

// Re-export Zod so users don't need to install it separately
export { z } from "zod";

// Named exports
export { 
  config, 
  validate, 
  validateOrThrow,
  generateTypes,
  generateTypesFromSchema,
  type ConfigOptions,
  type ConfigResult,
  type ValidateOptions,
  type ValidateResult,
  type ValidationError,
  type GenerateTypesOptions,
  type GenerateTypesResult
};

// Default export with all functions (supports pushenv.config() style)
export default {
  config,
  validate,
  validateOrThrow,
  generateTypes,
  generateTypesFromSchema,
};

