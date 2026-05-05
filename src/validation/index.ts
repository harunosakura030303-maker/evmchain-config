/**
 * Config validation — checks RPC format, key format, chain consistency
 */

import type { EvmConfig, ValidationResult, ValidationError, ValidationWarning } from '../types.js';
import { getChainMeta } from '../chain/registry.js';

/**
 * Validate the loaded EVM configuration
 */
export function validateConfig(config: EvmConfig): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (config.chains.size === 0) {
    warnings.push({
      field: 'chains',
      message: 'No chains configured. Add RPC URLs to your .env or config file.',
    });
  }

  for (const [chainId, chain] of config.chains) {
    // Validate RPC URL format
    if (!chain.rpcUrl) {
      errors.push({
        chain: chainId,
        field: 'rpcUrl',
        message: `Chain ${chain.name} (${chainId}): missing RPC URL`,
      });
    } else if (!isValidUrl(chain.rpcUrl)) {
      errors.push({
        chain: chainId,
        field: 'rpcUrl',
        message: `Chain ${chain.name} (${chainId}): invalid RPC URL format: ${maskValue(chain.rpcUrl)}`,
      });
    }

    // Validate accounts
    if (chain.accounts) {
      for (let i = 0; i < chain.accounts.length; i++) {
        const account = chain.accounts[i];

        if (account.type === 'privateKey') {
          if (!isValidPrivateKey(account.key)) {
            errors.push({
              chain: chainId,
              field: `accounts[${i}]`,
              message: `Chain ${chain.name} (${chainId}): invalid private key format`,
            });
          }
        }

        if (account.type === 'mnemonic') {
          const wordCount = account.phrase.trim().split(/\s+/).length;
          if (wordCount !== 12 && wordCount !== 24) {
            errors.push({
              chain: chainId,
              field: `accounts[${i}]`,
              message: `Chain ${chain.name} (${chainId}): mnemonic must be 12 or 24 words (got ${wordCount})`,
            });
          }
        }
      }
    }

    // Warn about known chain ID mismatches
    const meta = getChainMeta(chainId);
    if (meta && chain.name && meta.name !== chain.name.toLowerCase()) {
      warnings.push({
        chain: chainId,
        field: 'name',
        message: `Chain ${chainId}: name "${chain.name}" differs from registry "${meta.name}"`,
      });
    }

    // Warn about missing explorer config
    if (!chain.explorerApiKey && !chain.testnet) {
      warnings.push({
        chain: chainId,
        field: 'explorerApiKey',
        message: `Chain ${chain.name} (${chainId}): no explorer API key — contract verification will fail`,
      });
    }

    // Warn about using public RPCs for mainnet
    if (!chain.testnet && chain.rpcUrl && isPublicRpc(chain.rpcUrl)) {
      warnings.push({
        chain: chainId,
        field: 'rpcUrl',
        message: `Chain ${chain.name} (${chainId}): using public RPC — consider a dedicated provider for reliability`,
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// --- Helpers ---

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:', 'ws:', 'wss:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

function isValidPrivateKey(key: string): boolean {
  const cleaned = key.startsWith('0x') ? key.slice(2) : key;
  return /^[a-fA-F0-9]{64}$/.test(cleaned);
}

function isPublicRpc(url: string): boolean {
  const publicHosts = [
    'llamarpc.com',
    'rpc.ankr.com',
    'publicnode.com',
    'drpc.org',
    'cloudflare-eth.com',
    'binance.org',
    'polygon-rpc.com',
    'rpc.ftm.tools',
    'mainnet.optimism.io',
    'mainnet.base.org',
    'arb1.arbitrum.io',
    'sepolia.org',
  ];
  try {
    const hostname = new URL(url).hostname;
    return publicHosts.some((h) => hostname.endsWith(h));
  } catch {
    return false;
  }
}

function maskValue(value: string): string {
  if (value.length <= 8) return '***';
  return value.slice(0, 4) + '...' + value.slice(-4);
}
