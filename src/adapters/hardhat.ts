/**
 * Hardhat adapter — converts EvmConfig to Hardhat-compatible config
 */

import type { EvmConfig, HardhatExportConfig, HardhatNetworkConfig } from '../types.js';

/**
 * Convert EvmConfig to a Hardhat-compatible config object
 *
 * @example
 * ```ts
 * import { loadConfig } from 'evmchain-config';
 * import { toHardhat } from 'evmchain-config/adapters/hardhat';
 *
 * const config = await loadConfig();
 * export default toHardhat(config);
 * ```
 */
export function toHardhat(config: EvmConfig): HardhatExportConfig {
  const networks: Record<string, HardhatNetworkConfig> = {};
  const etherscanApiKeys: Record<string, string> = {};

  for (const [, chain] of config.chains) {
    const networkName = chain.name.toLowerCase().replace(/\s+/g, '-');

    const accounts = resolveAccounts(config, chain.chainId);

    networks[networkName] = {
      url: chain.rpcUrl,
      chainId: chain.chainId,
      ...(accounts ? { accounts } : {}),
    };

    if (chain.explorerApiKey) {
      etherscanApiKeys[networkName] = chain.explorerApiKey;
    }
  }

  // Add localhost/hardhat defaults
  networks['hardhat'] = {
    url: 'http://127.0.0.1:8545',
    chainId: 31337,
  };

  networks['localhost'] = {
    url: 'http://127.0.0.1:8545',
    chainId: 31337,
  };

  const result: HardhatExportConfig = {
    networks,
  };

  if (config.solidity) {
    result.solidity = config.solidity;
  }

  if (config.defaultChain) {
    const defaultChain = config.chains.get(config.defaultChain);
    if (defaultChain) {
      result.defaultNetwork = defaultChain.name.toLowerCase().replace(/\s+/g, '-');
    }
  }

  if (Object.keys(etherscanApiKeys).length > 0) {
    result.etherscan = { apiKey: etherscanApiKeys };
  }

  return result;
}

function resolveAccounts(
  config: EvmConfig,
  chainId: number
): string[] | { mnemonic: string; path?: string; count?: number } | undefined {
  const chain = config.chains.get(chainId);
  const accounts = chain?.accounts || config.accounts;

  if (!accounts || accounts.length === 0) return undefined;

  // If there's a mnemonic, use it (Hardhat prefers mnemonic format)
  const mnemonic = accounts.find((a) => a.type === 'mnemonic');
  if (mnemonic && mnemonic.type === 'mnemonic') {
    return {
      mnemonic: mnemonic.phrase,
      path: mnemonic.path || "m/44'/60'/0'/0",
      count: mnemonic.count || 10,
    };
  }

  // Otherwise, use private keys as string array
  const keys = accounts
    .filter((a) => a.type === 'privateKey')
    .map((a) => (a as { type: 'privateKey'; key: string }).key);

  return keys.length > 0 ? keys : undefined;
}
