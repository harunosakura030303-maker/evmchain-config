import { describe, it, expect } from 'vitest';
import { parseEnvFile, extractFromEnv, resolveChainHint, buildChainsFromEnv } from '../src/loader/env';

describe('parseEnvFile', () => {
  it('should parse key-value pairs', () => {
    // This test uses a fixture file — see test/fixtures/.env.test
    const result = parseEnvFile(new URL('./fixtures/.env.test', import.meta.url).pathname);
    expect(result['ETHEREUM_RPC_URL']).toBe('https://eth-mainnet.example.com');
    expect(result['PRIVATE_KEY']).toBe('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80');
    expect(result['MNEMONIC']).toBe('test test test test test test test test test test test junk');
  });

  it('should skip comments and empty lines', () => {
    const result = parseEnvFile(new URL('./fixtures/.env.test', import.meta.url).pathname);
    expect(result['COMMENT']).toBeUndefined();
  });

  it('should handle quoted values', () => {
    const result = parseEnvFile(new URL('./fixtures/.env.test', import.meta.url).pathname);
    expect(result['QUOTED_VALUE']).toBe('hello world');
  });
});

describe('extractFromEnv', () => {
  it('should extract RPC URLs by pattern', () => {
    const vars = {
      ETHEREUM_RPC_URL: 'https://eth.example.com',
      ARBITRUM_RPC_URL: 'https://arb.example.com',
      BASE_RPC: 'https://base.example.com',
    };

    const result = extractFromEnv(vars);
    expect(result.rpcUrls.get('ethereum')).toBe('https://eth.example.com');
    expect(result.rpcUrls.get('arbitrum')).toBe('https://arb.example.com');
    expect(result.rpcUrls.get('base')).toBe('https://base.example.com');
  });

  it('should extract private keys', () => {
    const vars = {
      PRIVATE_KEY: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
    };

    const result = extractFromEnv(vars);
    expect(result.accounts).toHaveLength(1);
    expect(result.accounts[0].type).toBe('privateKey');
  });

  it('should extract mnemonics', () => {
    const vars = {
      MNEMONIC: 'test test test test test test test test test test test junk',
    };

    const result = extractFromEnv(vars);
    expect(result.accounts).toHaveLength(1);
    expect(result.accounts[0].type).toBe('mnemonic');
  });

  it('should extract explorer API keys', () => {
    const vars = {
      ETHERSCAN_API_KEY: 'abc123',
      ARBISCAN_API_KEY: 'def456',
    };

    const result = extractFromEnv(vars);
    expect(result.explorerKeys.get('default')).toBe('abc123');
    expect(result.explorerKeys.get('arb')).toBe('def456');
  });

  it('should not extract invalid private keys', () => {
    const vars = {
      PRIVATE_KEY: 'not-a-valid-key',
    };

    const result = extractFromEnv(vars);
    expect(result.accounts).toHaveLength(0);
  });
});

describe('resolveChainHint', () => {
  it('should resolve common chain names', () => {
    expect(resolveChainHint('ethereum')).toBe(1);
    expect(resolveChainHint('eth')).toBe(1);
    expect(resolveChainHint('mainnet')).toBe(1);
    expect(resolveChainHint('arbitrum')).toBe(42161);
    expect(resolveChainHint('arb')).toBe(42161);
    expect(resolveChainHint('base')).toBe(8453);
    expect(resolveChainHint('optimism')).toBe(10);
    expect(resolveChainHint('polygon')).toBe(137);
    expect(resolveChainHint('sepolia')).toBe(11155111);
  });

  it('should be case-insensitive', () => {
    expect(resolveChainHint('ETHEREUM')).toBe(1);
    expect(resolveChainHint('Arbitrum')).toBe(42161);
    expect(resolveChainHint('BASE')).toBe(8453);
  });

  it('should return undefined for unknown chains', () => {
    expect(resolveChainHint('unknownchain')).toBeUndefined();
  });
});

describe('buildChainsFromEnv', () => {
  it('should build chain configs from parsed env data', () => {
    const parsed = extractFromEnv({
      ETHEREUM_RPC_URL: 'https://eth.example.com',
      ARBITRUM_RPC_URL: 'https://arb.example.com',
      PRIVATE_KEY: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
      ETHERSCAN_API_KEY: 'abc123',
    });

    const chains = buildChainsFromEnv(parsed);

    expect(chains.size).toBe(2);
    expect(chains.get(1)?.rpcUrl).toBe('https://eth.example.com');
    expect(chains.get(42161)?.rpcUrl).toBe('https://arb.example.com');
    expect(chains.get(1)?.accounts).toHaveLength(1);
  });
});
