export interface R2Config {
  endpoint: string;
  accessKey: string;
  secretKey: string;
  bucket: string;
}

/**
 * Get R2 configuration from environment variables
 * Expected vars: R2_ACCESS_KEY, R2_SECRET_KEY (or R2_SECRET_ACCESS_KEY), R2_ENDPOINT, R2_BUCKET
 */
export function getR2ConfigFromEnv(): R2Config | null {
  const accessKey = process.env["R2_ACCESS_KEY"];
  // Support both R2_SECRET_ACCESS_KEY (AWS S3 standard) and R2_SECRET_KEY (shorter name)
  const secretKey = process.env["R2_SECRET_ACCESS_KEY"] || process.env["R2_SECRET_KEY"];
  const endpoint = process.env["R2_ENDPOINT"];
  const bucket = process.env["R2_BUCKET"];

  if (!accessKey || !secretKey || !endpoint || !bucket) {
    return null;
  }

  return {
    endpoint,
    accessKey,
    secretKey,
    bucket,
  };
}

/**
 * Check if R2 environment variables are configured
 */
export function isR2Configured(): boolean {
  return getR2ConfigFromEnv() !== null;
}

/**
 * Validate R2 credentials by attempting to list the bucket
 * Returns true if valid, throws error if invalid
 */
export async function validateR2Credentials(config: R2Config): Promise<boolean> {
  const url = `${config.endpoint}/${config.bucket}`;
  
  try {
    const response = await fetch(url, {
      method: "HEAD",
    });

    if (response.status === 403) {
      throw new Error("Invalid R2 credentials - access denied");
    }
    if (response.status === 404) {
      throw new Error(`R2 bucket '${config.bucket}' not found`);
    }

    return true;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("Invalid R2") || error.message.includes("bucket")) {
        throw error;
      }
      console.warn(`Warning: Could not validate R2 connection: ${error.message}`);
    }
    return true;
  }
}

/**
 * Get R2 configuration status message
 */
export function getR2StatusMessage(): string {
  const config = getR2ConfigFromEnv();
  if (!config) {
    return "R2 not configured (set R2_ACCESS_KEY, R2_SECRET_KEY, R2_ENDPOINT, R2_BUCKET)";
  }
  return `R2 configured: bucket '${config.bucket}'`;
}
