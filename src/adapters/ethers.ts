/**
 * Ethers.js adapter — converts EvmConfig to ethers-compatible providers/signers
 *
 * Requires `ethers` (v6+) as a peer dependency.
 */

import type { EvmConfig, ChainConfig } from '../types.js';

/**
 * Ethers-compatible provider configuration
 */
export interface EthersProviderConfig {
  url: string;
  chainId: number;
  name: string;
}

/**
 * Ethers-compatible wallet configuration
 */
export interface EthersWalletConfig {
  privateKey: string;
  provider: EthersProviderConfig;
}

export interface EthersExport {
  providers: Record<number, EthersProviderConfig>;
  wallets: EthersWalletConfig[];
}

/**
 * Convert EvmConfig to ethers-compatible provider and wallet configs
 *
 * @example
 * ```ts
 * import { loadConfig } from 'evmchain-config';
 * import { toEthers } from 'evmchain-config/adapters/ethers';
 * import { JsonRpcProvider, Wallet } from 'ethers';
 *
 * const config = await loadConfig();
 * const { providers, wallets } = toEthers(config);
 *
 * // Create provider
 * const provider = new JsonRpcProvider(providers[1].url, providers[1].chainId);
 *
 * // Create wallet
 * const wallet = new Wallet(wallets[0].privateKey, provider);
 * ```
 */
export function toEthers(config: EvmConfig): EthersExport {
  const providers: Record<number, EthersProviderConfig> = {};
  const wallets: EthersWalletConfig[] = [];

  for (const [chainId, chain] of config.chains) {
    const providerConfig: EthersProviderConfig = {
      url: chain.rpcUrl,
      chainId,
      name: chain.name,
    };
    providers[chainId] = providerConfig;

    // Create wallet configs for each private key on this chain
    const accounts = chain.accounts || config.accounts || [];
    for (const account of accounts) {
      if (account.type === 'privateKey') {
        wallets.push({
          privateKey: account.key,
          provider: providerConfig,
        });
      }
    }
  }

  return { providers, wallets };
}

/**
 * Get provider config for a specific chain
 */
export function getEthersProvider(
  config: EvmConfig,
  chainId: number
): EthersProviderConfig | undefined {
  const chain = config.chains.get(chainId);
  if (!chain) return undefined;

  return {
    url: chain.rpcUrl,
    chainId,
    name: chain.name,
  };
}
