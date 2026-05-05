/**
 * Environment variable parser — reads .env files and process.env
 * Extracts chain-specific configuration from environment variables
 */

import { readFileSync } from 'node:fs';
import type { AccountConfig, ChainConfig } from '../types.js';
import { getChainMeta, getChainByName } from '../chain/registry.js';

/** Well-known env var patterns for EVM config */
const RPC_PATTERNS = [
  /^(.+?)_RPC_URL$/i,
  /^(.+?)_RPC$/i,
  /^(.+?)_URL$/i,
  /^RPC_URL_(.+)$/i,
  /^(.+?)_PROVIDER_URL$/i,
  /^(.+?)_ENDPOINT$/i,
];

const KEY_PATTERNS = [
  /^PRIVATE_KEY$/i,
  /^DEPLOYER_KEY$/i,
  /^DEPLOYER_PRIVATE_KEY$/i,
  /^SIGNER_KEY$/i,
  /^SIGNER_PRIVATE_KEY$/i,
  /^WALLET_KEY$/i,
  /^WALLET_PRIVATE_KEY$/i,
  /^(.+?)_PRIVATE_KEY$/i,
  /^(.+?)_KEY$/i,
];

const MNEMONIC_PATTERNS = [
  /^MNEMONIC$/i,
  /^SEED_PHRASE$/i,
  /^HD_WALLET_MNEMONIC$/i,
  /^(.+?)_MNEMONIC$/i,
];

const EXPLORER_KEY_PATTERNS = [
  /^ETHERSCAN_API_KEY$/i,
  /^(.+?)SCAN_API_KEY$/i,
  /^EXPLORER_API_KEY$/i,
  /^(.+?)_EXPLORER_KEY$/i,
  /^(.+?)_VERIFY_KEY$/i,
];

const API_KEY_PATTERNS = [
  /^ALCHEMY_API_KEY$/i,
  /^ALCHEMY_KEY$/i,
  /^INFURA_API_KEY$/i,
  /^INFURA_KEY$/i,
  /^INFURA_PROJECT_ID$/i,
  /^(.+?)_API_KEY$/i,
];

interface ParsedEnv {
  rpcUrls: Map<string, string>;
  accounts: AccountConfig[];
  explorerKeys: Map<string, string>;
  apiKeys: Map<string, string>;
  raw: Record<string, string>;
}

/**
 * Parse a .env file into key-value pairs
 */
export function parseEnvFile(filePath: string): Record<string, string> {
  const content = readFileSync(filePath, 'utf-8');
  const result: Record<string, string> = {};

  for (const line of content.split('\n')) {
    const trimmed = line.trim();

    // Skip comments and empty lines
    if (!trimmed || trimmed.startsWith('#')) continue;

    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();

    // Remove surrounding quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (key && value) {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Extract structured EVM config from environment variables
 */
export function extractFromEnv(vars: Record<string, string>): ParsedEnv {
  const rpcUrls = new Map<string, string>();
  const accounts: AccountConfig[] = [];
  const explorerKeys = new Map<string, string>();
  const apiKeys = new Map<string, string>();

  for (const [key, value] of Object.entries(vars)) {
    // Match RPC URLs
    for (const pattern of RPC_PATTERNS) {
      const match = key.match(pattern);
      if (match) {
        const chainHint = match[1]?.toLowerCase() || 'default';
        rpcUrls.set(chainHint, value);
        break;
      }
    }

    // Match private keys
    for (const pattern of KEY_PATTERNS) {
      const match = key.match(pattern);
      if (match && isPrivateKey(value)) {
        accounts.push({ type: 'privateKey', key: normalizeKey(value) });
        break;
      }
    }

    // Match mnemonics
    for (const pattern of MNEMONIC_PATTERNS) {
      if (key.match(pattern) && isMnemonic(value)) {
        accounts.push({ type: 'mnemonic', phrase: value });
        break;
      }
    }

    // Match explorer API keys
    for (const pattern of EXPLORER_KEY_PATTERNS) {
      const match = key.match(pattern);
      if (match) {
        const chainHint = match[1]?.toLowerCase() || 'default';
        explorerKeys.set(chainHint, value);
        break;
      }
    }

    // Match API provider keys
    for (const pattern of API_KEY_PATTERNS) {
      const match = key.match(pattern);
      if (match) {
        const provider = match[1]?.toLowerCase() || key.toLowerCase();
        apiKeys.set(provider, value);
        break;
      }
    }
  }

  return { rpcUrls, accounts, explorerKeys, apiKeys, raw: vars };
}

/**
 * Resolve a chain hint (name or partial) to a chain ID
 */
export function resolveChainHint(hint: string): number | undefined {
  const lower = hint.toLowerCase().replace(/[-_\s]/g, '');

  // Direct chain name match
  const byName = getChainByName(hint);
  if (byName) return byName.chainId;

  // Common aliases
  const aliases: Record<string, number> = {
    mainnet: 1,
    ethereum: 1,
    eth: 1,
    optimism: 10,
    op: 10,
    bsc: 56,
    binance: 56,
    gnosis: 100,
    xdai: 100,
    polygon: 137,
    matic: 137,
    fantom: 250,
    ftm: 250,
    zksync: 324,
    base: 8453,
    arbitrum: 42161,
    arb: 42161,
    avalanche: 43114,
    avax: 43114,
    linea: 59144,
    scroll: 534352,
    blast: 81457,
    sepolia: 11155111,
    arbsepolia: 421614,
    arbitrumsepolia: 421614,
    basesepolia: 84532,
    opsepolia: 11155420,
    optimismsepolia: 11155420,
  };

  return aliases[lower];
}

/**
 * Build chain configs from parsed environment data
 */
export function buildChainsFromEnv(parsed: ParsedEnv): Map<number, ChainConfig> {
  const chains = new Map<number, ChainConfig>();

  for (const [hint, rpcUrl] of parsed.rpcUrls) {
    const chainId = resolveChainHint(hint);
    if (!chainId) continue;

    const meta = getChainMeta(chainId);
    const existing = chains.get(chainId);

    chains.set(chainId, {
      chainId,
      name: meta?.name || hint,
      rpcUrl,
      accounts: existing?.accounts || [...parsed.accounts],
      explorerUrl: meta?.explorerUrl,
      explorerApiKey:
        parsed.explorerKeys.get(hint) ||
        parsed.explorerKeys.get('default'),
      currency: meta?.currency || 'ETH',
      testnet: meta?.testnet || false,
    });
  }

  return chains;
}

// --- Helpers ---

function isPrivateKey(value: string): boolean {
  const cleaned = value.startsWith('0x') ? value.slice(2) : value;
  return /^[a-fA-F0-9]{64}$/.test(cleaned);
}

function isMnemonic(value: string): boolean {
  const words = value.trim().split(/\s+/);
  return words.length === 12 || words.length === 24;
}

function normalizeKey(value: string): string {
  return value.startsWith('0x') ? value : `0x${value}`;
}
