import fs from "node:fs";
import path from "node:path";
import os from "node:os";

export interface ProjectConfig {
  projectId: string;
  envPath: string;
  createdAt: string;
}

export interface KeyEntry {
  projectId: string;
  salt: string;
  /**
   * Symmetric encryption key derived from the passphrase using PBKDF2.
   * Stored as base64 so that the raw passphrase never touches disk.
   */
  key: string;
  createdAt: string;
}

export interface GlobalKeysConfig {
  keys: KeyEntry[];
}

/**
 * Delete a key entry by project ID
 */
export function deleteKeyEntry(projectId: string): void {
  const current = readGlobalKeysConfig();
  const filtered = current.keys.filter((k) => k.projectId !== projectId);
  if (filtered.length === current.keys.length) {
    // Nothing to delete
    return;
  }

  const updated: GlobalKeysConfig = { keys: filtered };
  const keysPath = getGlobalKeysPath();
  const configDir = getGlobalConfigDir();
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  fs.writeFileSync(keysPath, JSON.stringify(updated, null, 2), "utf8");
}

const PROJECT_CONFIG_DIR = ".envfy";
const PROJECT_CONFIG_FILE = "config.json";
const GLOBAL_CONFIG_DIR = ".envfy";
const GLOBAL_KEYS_FILE = "keys.json";

/**
 * Get the project config directory path
 */
export function getProjectConfigDir(projectRoot: string = process.cwd()): string {
  return path.join(projectRoot, PROJECT_CONFIG_DIR);
}

/**
 * Get the project config file path
 */
export function getProjectConfigPath(projectRoot: string = process.cwd()): string {
  return path.join(getProjectConfigDir(projectRoot), PROJECT_CONFIG_FILE);
}

/**
 * Get the global config directory path (~/.envfy)
 */
export function getGlobalConfigDir(): string {
  return path.join(os.homedir(), GLOBAL_CONFIG_DIR);
}

/**
 * Get the global keys file path (~/.envfy/keys.json)
 */
export function getGlobalKeysPath(): string {
  return path.join(getGlobalConfigDir(), GLOBAL_KEYS_FILE);
}

/**
 * Check if a project is already initialized
 */
export function isProjectInitialized(projectRoot: string = process.cwd()): boolean {
  return fs.existsSync(getProjectConfigPath(projectRoot));
}

/**
 * Read the project config
 */
export function readProjectConfig(projectRoot: string = process.cwd()): ProjectConfig | null {
  const configPath = getProjectConfigPath(projectRoot);
  if (!fs.existsSync(configPath)) {
    return null;
  }
  const content = fs.readFileSync(configPath, "utf8");
  return JSON.parse(content) as ProjectConfig;
}

/**
 * Save the project config
 */
export function saveProjectConfig(
  config: ProjectConfig,
  projectRoot: string = process.cwd()
): void {
  const configDir = getProjectConfigDir(projectRoot);
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  const configPath = getProjectConfigPath(projectRoot);
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf8");
}

/**
 * Read the global keys config
 */
export function readGlobalKeysConfig(): GlobalKeysConfig {
  const keysPath = getGlobalKeysPath();
  if (!fs.existsSync(keysPath)) {
    return { keys: [] };
  }
  const content = fs.readFileSync(keysPath, "utf8");
  return JSON.parse(content) as GlobalKeysConfig;
}

/**
 * Save a key entry to the global keys config
 */
export function saveKeyEntry(entry: KeyEntry): void {
  const configDir = getGlobalConfigDir();
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  const config = readGlobalKeysConfig();
  
  // Update existing or add new
  const existingIndex = config.keys.findIndex((k) => k.projectId === entry.projectId);
  if (existingIndex >= 0) {
    config.keys[existingIndex] = entry;
  } else {
    config.keys.push(entry);
  }

  const keysPath = getGlobalKeysPath();
  fs.writeFileSync(keysPath, JSON.stringify(config, null, 2), "utf8");
}

/**
 * Get a key entry by project ID
 */
export function getKeyEntry(projectId: string): KeyEntry | undefined {
  const config = readGlobalKeysConfig();
  return config.keys.find((k) => k.projectId === projectId);
}

/**
 * Check if a .env file exists at the given path
 */
export function envFileExists(envPath: string): boolean {
  return fs.existsSync(envPath);
}
