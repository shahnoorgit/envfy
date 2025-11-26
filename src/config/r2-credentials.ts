/**
 * Owner's R2 credentials - bundled with the CLI
 * These are YOUR credentials that power the service for all users
 * 
 * For production: Use environment variables at build time or a secrets manager
 * For now: These are loaded from your local .env during development
 */

import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Load owner's .env from the package directory (for development)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(__dirname, "../..");
dotenv.config({ path: path.join(packageRoot, ".env") });

export interface R2Credentials {
  endpoint: string;
  accessKey: string;
  secretKey: string;
  bucket: string;
}

export function getR2Credentials(): R2Credentials {
  const endpoint = process.env["R2_ENDPOINT"];
  const accessKey = process.env["R2_ACCESS_KEY"];
  const secretKey = process.env["R2_SECRET_KEY"];
  const bucket = process.env["R2_BUCKET"] ?? "envfy";

  if (!endpoint || !accessKey || !secretKey) {
    throw new Error(
      "R2 credentials not configured. This is an internal CLI error."
    );
  }

  return {
    endpoint,
    accessKey,
    secretKey,
    bucket,
  };
}

