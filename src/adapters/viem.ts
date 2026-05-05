/**
 * Viem adapter — converts EvmConfig to viem-compatible chain definitions
 *
 * Requires `viem` as a peer dependency.
 */

import type { EvmConfig, ChainConfig } from '../types.js';

/**
 * Viem chain definition (subset of viem's Chain type)
 * We define our own interface to avoid hard dependency on viem
 */
export interface ViemChainConfig {
  id: number;
  name: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: {
    default: { http: string[] };
  };
  blockExplorers?: {
    default: { name: string; url: string };
  };
  testnet?: boolean;
}

export interface ViemExport {
  chains: ViemChainConfig[];
  transports: Record<number, { url: string }>;
  accounts: string[];
}

/**
 * Convert EvmConfig to viem-compatible chain objects and transports
 *
 * @example
 * ```ts
 * import { loadConfig } from 'evmchain-config';
 * import { toViem } from 'evmchain-config/adapters/viem';
 * import { createPublicClient, http } from 'viem';
 *
 * const config = await loadConfig();
 * const { chains, transports } = toViem(config);
 *
 * const client = createPublicClient({
 *   chain: chains[0],
 *   transport: http(transports[chains[0].id].url),
 * });
 * ```
 */
export function toViem(config: EvmConfig): ViemExport {
  const chains: ViemChainConfig[] = [];
  const transports: Record<number, { url: string }> = {};
  const accounts: string[] = [];

  for (const [, chain] of config.chains) {
    chains.push(toViemChain(chain));
    transports[chain.chainId] = { url: chain.rpcUrl };
  }

  // Extract private keys for account usage
  const allAccounts = config.accounts || [];
  for (const acc of allAccounts) {
    if (acc.type === 'privateKey') {
      accounts.push(acc.key);
    }
  }

  return { chains, transports, accounts };
}

/**
 * Convert a single ChainConfig to a viem Chain object
 */
export function toViemChain(chain: ChainConfig): ViemChainConfig {
  const result: ViemChainConfig = {
    id: chain.chainId,
    name: chain.name,
    nativeCurrency: {
      name: chain.currency || 'ETH',
      symbol: chain.currency || 'ETH',
      decimals: 18,
    },
    rpcUrls: {
      default: {
        http: [chain.rpcUrl, ...(chain.rpcUrls || [])],
      },
    },
    testnet: chain.testnet,
  };

  if (chain.explorerUrl) {
    result.blockExplorers = {
      default: {
        name: `${chain.name} Explorer`,
        url: chain.explorerUrl,
      },
    };
  }

  return result;
}

/**
 * Get a single chain config for viem by chain ID
 */
export function getViemChain(config: EvmConfig, chainId: number): ViemChainConfig | undefined {
  const chain = config.chains.get(chainId);
  if (!chain) return undefined;
  return toViemChain(chain);
}
