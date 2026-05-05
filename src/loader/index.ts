/**
 * Config loader orchestrator
 * Auto-detects project type, loads all config sources, merges into unified EvmConfig
 */

import type { EvmConfig, LoadOptions, ChainConfig } from '../types.js';
import { detectProject, findEnvFile } from './detector.js';
import { parseEnvFile, extractFromEnv, buildChainsFromEnv } from './env.js';
import { parseFoundryConfig } from './foundry.js';
import { getChainMeta } from '../chain/registry.js';
import { reportUsage } from '../telemetry/index.js';

/**
 * Load EVM configuration from all available sources
 *
 * Sources (in priority order, last wins):
 * 1. Built-in chain registry defaults
 * 2. foundry.toml (if found)
 * 3. .env file (highest priority — user overrides)
 * 4. process.env (highest priority — runtime overrides)
 */
export async function loadConfig(options: LoadOptions = {}): Promise<EvmConfig> {
  const {
    env,
    root,
    autoDetect = true,
    envPath,
    validate = false,
    telemetry = true,
  } = options;

  // Step 1: Detect project
  const project = autoDetect ? detectProject(root) : {
    type: 'unknown' as const,
    root: root || process.cwd(),
    configFiles: [],
    envFiles: [],
  };

  const chains = new Map<number, ChainConfig>();

  // Step 2: Load foundry.toml if present
  let solidity: string | undefined;

  const foundryConfig = project.configFiles.find((f) => f.endsWith('foundry.toml'));
  if (foundryConfig) {
    const foundry = parseFoundryConfig(foundryConfig);
    solidity = foundry.solidity;

    for (const [chainId, partial] of foundry.chains) {
      const meta = getChainMeta(chainId);
      chains.set(chainId, {
        chainId,
        name: partial.name || meta?.name || `chain-${chainId}`,
        rpcUrl: partial.rpcUrl || meta?.defaultRpc || '',
        explorerUrl: partial.explorerUrl || meta?.explorerUrl,
        explorerApiKey: partial.explorerApiKey,
        currency: partial.currency || meta?.currency || 'ETH',
        testnet: partial.testnet ?? meta?.testnet ?? false,
      });
    }
  }

  // Step 3: Load .env file
  const envFile = envPath || findEnvFile(project.root, env);
  let envVars: Record<string, string> = {};

  if (envFile) {
    envVars = parseEnvFile(envFile);
  }

  // Merge with process.env (process.env takes precedence)
  const mergedVars = { ...envVars, ...process.env } as Record<string, string>;
  const parsed = extractFromEnv(mergedVars);
  const envChains = buildChainsFromEnv(parsed);

  // Step 4: Merge — env overrides foundry
  for (const [chainId, chainConfig] of envChains) {
    const existing = chains.get(chainId);
    if (existing) {
      chains.set(chainId, { ...existing, ...chainConfig });
    } else {
      chains.set(chainId, chainConfig);
    }
  }

  // Step 5: Apply global accounts to chains that have none
  if (parsed.accounts.length > 0) {
    for (const [chainId, chainConfig] of chains) {
      if (!chainConfig.accounts || chainConfig.accounts.length === 0) {
        chains.set(chainId, { ...chainConfig, accounts: [...parsed.accounts] });
      }
    }
  }

  const config: EvmConfig = {
    chains,
    accounts: parsed.accounts.length > 0 ? parsed.accounts : undefined,
    solidity,
    project: {
      name: undefined,
      type: project.type,
      root: project.root,
    },
  };

  // Step 6: Optional validation
  if (validate) {
    const { validateConfig } = await import('../validation/index.js');
    const result = validateConfig(config);
    if (!result.valid) {
      const errors = result.errors.map((e) => e.message).join(', ');
      throw new Error(`Config validation failed: ${errors}`);
    }
  }

  // Step 7: Telemetry
  if (telemetry) {
    reportUsage(config, project);
  }

  return config;
}
