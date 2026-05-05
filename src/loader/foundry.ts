/**
 * Foundry config (foundry.toml) parser
 * Extracts RPC endpoints and chain configuration from Foundry projects
 */

import { readFileSync } from 'node:fs';
import type { ChainConfig } from '../types.js';
import { getChainMeta } from '../chain/registry.js';
import { resolveChainHint } from './env.js';

interface FoundryProfile {
  src?: string;
  out?: string;
  libs?: string[];
  solc_version?: string;
  optimizer?: boolean;
  optimizer_runs?: number;
  evm_version?: string;
  rpc_endpoints?: Record<string, string>;
  etherscan?: Record<string, { key: string; url?: string; chain?: number }>;
}

interface FoundryConfig {
  profile?: {
    default?: FoundryProfile;
    [key: string]: FoundryProfile | undefined;
  };
  rpc_endpoints?: Record<string, string>;
  etherscan?: Record<string, { key: string; url?: string; chain?: number }>;
}

/**
 * Parse foundry.toml and extract chain configuration
 */
export function parseFoundryConfig(filePath: string): {
  chains: Map<number, Partial<ChainConfig>>;
  solidity?: string;
} {
  let parsed: FoundryConfig;

  try {
    const content = readFileSync(filePath, 'utf-8');
    parsed = parseToml(content);
  } catch {
    return { chains: new Map() };
  }

  const chains = new Map<number, Partial<ChainConfig>>();

  // Extract RPC endpoints from [rpc_endpoints] or [profile.default.rpc_endpoints]
  const rpcEndpoints =
    parsed.rpc_endpoints ||
    parsed.profile?.default?.rpc_endpoints ||
    {};

  for (const [name, url] of Object.entries(rpcEndpoints)) {
    // Skip template variables like "${MAINNET_RPC_URL}"
    if (url.includes('${')) continue;

    const chainId = resolveChainHint(name);
    if (!chainId) continue;

    const meta = getChainMeta(chainId);
    chains.set(chainId, {
      chainId,
      name: meta?.name || name,
      rpcUrl: url,
      explorerUrl: meta?.explorerUrl,
      currency: meta?.currency,
      testnet: meta?.testnet,
    });
  }

  // Extract etherscan keys
  const etherscan =
    parsed.etherscan ||
    parsed.profile?.default?.etherscan ||
    {};

  for (const [name, config] of Object.entries(etherscan)) {
    const chainId = config.chain || resolveChainHint(name);
    if (!chainId) continue;

    const existing = chains.get(chainId) || { chainId };
    existing.explorerApiKey = config.key;
    chains.set(chainId, existing);
  }

  // Extract solidity version
  const solidity = parsed.profile?.default?.solc_version;

  return { chains, solidity };
}

/**
 * Minimal TOML parser for foundry.toml
 * Handles the subset of TOML used by Foundry configs
 */
function parseToml(content: string): FoundryConfig {
  const result: Record<string, unknown> = {};
  let currentSection = result;
  let currentPath: string[] = [];

  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim();

    // Skip comments and empty lines
    if (!line || line.startsWith('#')) continue;

    // Section header [section.subsection]
    const sectionMatch = line.match(/^\[([^\]]+)\]$/);
    if (sectionMatch) {
      currentPath = sectionMatch[1].split('.');
      currentSection = result;
      for (const part of currentPath) {
        if (!(part in (currentSection as Record<string, unknown>))) {
          (currentSection as Record<string, unknown>)[part] = {};
        }
        currentSection = (currentSection as Record<string, unknown>)[
          part
        ] as Record<string, unknown>;
      }
      continue;
    }

    // Key-value pair
    const kvMatch = line.match(/^(\w+)\s*=\s*(.+)$/);
    if (kvMatch) {
      const [, key, rawValue] = kvMatch;
      (currentSection as Record<string, unknown>)[key] = parseTomlValue(rawValue);
    }
  }

  return result as unknown as FoundryConfig;
}

function parseTomlValue(raw: string): unknown {
  const trimmed = raw.trim();

  // String (quoted)
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  // Boolean
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;

  // Number
  if (/^-?\d+$/.test(trimmed)) return parseInt(trimmed, 10);
  if (/^-?\d+\.\d+$/.test(trimmed)) return parseFloat(trimmed);

  // Array (simple, single-line)
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    const inner = trimmed.slice(1, -1).trim();
    if (!inner) return [];
    return inner.split(',').map((item) => parseTomlValue(item.trim()));
  }

  return trimmed;
}
