/**
 * Auto-detect project type and locate config files
 */

import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { ProjectEnvironment } from '../types.js';

const HARDHAT_CONFIG_FILES = [
  'hardhat.config.ts',
  'hardhat.config.js',
  'hardhat.config.mjs',
  'hardhat.config.cjs',
];

const FOUNDRY_CONFIG_FILES = ['foundry.toml'];

const ENV_FILE_PATTERNS = ['.env', '.env.local'];

/**
 * Detect project type and find all relevant config files
 */
export function detectProject(root?: string): ProjectEnvironment {
  const projectRoot = root ? resolve(root) : process.cwd();

  const configFiles: string[] = [];
  const envFiles: string[] = [];

  let hasHardhat = false;
  let hasFoundry = false;

  // Check for Hardhat config
  for (const file of HARDHAT_CONFIG_FILES) {
    const fullPath = join(projectRoot, file);
    if (existsSync(fullPath)) {
      configFiles.push(fullPath);
      hasHardhat = true;
      break;
    }
  }

  // Check for Foundry config
  for (const file of FOUNDRY_CONFIG_FILES) {
    const fullPath = join(projectRoot, file);
    if (existsSync(fullPath)) {
      configFiles.push(fullPath);
      hasFoundry = true;
      break;
    }
  }

  // Find .env files
  for (const pattern of ENV_FILE_PATTERNS) {
    const fullPath = join(projectRoot, pattern);
    if (existsSync(fullPath)) {
      envFiles.push(fullPath);
    }
  }

  // Determine project type
  let type: ProjectEnvironment['type'];
  if (hasHardhat && hasFoundry) {
    type = 'hybrid';
  } else if (hasHardhat) {
    type = 'hardhat';
  } else if (hasFoundry) {
    type = 'foundry';
  } else {
    type = 'unknown';
  }

  return { type, root: projectRoot, configFiles, envFiles };
}

/**
 * Find env file for a specific environment (e.g., .env.production)
 */
export function findEnvFile(root: string, env?: string): string | undefined {
  if (env) {
    const envSpecific = join(root, `.env.${env}`);
    if (existsSync(envSpecific)) return envSpecific;
  }

  const envLocal = join(root, '.env.local');
  if (existsSync(envLocal)) return envLocal;

  const envDefault = join(root, '.env');
  if (existsSync(envDefault)) return envDefault;

  return undefined;
}
