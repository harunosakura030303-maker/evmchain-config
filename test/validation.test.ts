import { describe, it, expect } from 'vitest';
import { validateConfig } from '../src/validation';
import type { EvmConfig } from '../src/types';

function makeConfig(overrides?: Partial<EvmConfig>): EvmConfig {
  return {
    chains: new Map(),
    ...overrides,
  };
}

describe('validateConfig', () => {
  it('should warn when no chains configured', () => {
    const result = validateConfig(makeConfig());
    expect(result.valid).toBe(true); // no errors, just warnings
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0].message).toContain('No chains configured');
  });

  it('should pass valid config', () => {
    const config = makeConfig({
      chains: new Map([
        [1, {
          chainId: 1,
          name: 'ethereum',
          rpcUrl: 'https://eth.example.com',
          explorerApiKey: 'test-key',
        }],
      ]),
    });

    const result = validateConfig(config);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should error on missing RPC URL', () => {
    const config = makeConfig({
      chains: new Map([
        [1, {
          chainId: 1,
          name: 'ethereum',
          rpcUrl: '',
        }],
      ]),
    });

    const result = validateConfig(config);
    expect(result.valid).toBe(false);
    expect(result.errors[0].message).toContain('missing RPC URL');
  });

  it('should error on invalid RPC URL', () => {
    const config = makeConfig({
      chains: new Map([
        [1, {
          chainId: 1,
          name: 'ethereum',
          rpcUrl: 'not-a-url',
        }],
      ]),
    });

    const result = validateConfig(config);
    expect(result.valid).toBe(false);
    expect(result.errors[0].message).toContain('invalid RPC URL');
  });

  it('should error on invalid private key format', () => {
    const config = makeConfig({
      chains: new Map([
        [1, {
          chainId: 1,
          name: 'ethereum',
          rpcUrl: 'https://eth.example.com',
          accounts: [{ type: 'privateKey', key: 'invalid-key' }],
        }],
      ]),
    });

    const result = validateConfig(config);
    expect(result.valid).toBe(false);
    expect(result.errors[0].message).toContain('invalid private key');
  });

  it('should error on invalid mnemonic length', () => {
    const config = makeConfig({
      chains: new Map([
        [1, {
          chainId: 1,
          name: 'ethereum',
          rpcUrl: 'https://eth.example.com',
          accounts: [{ type: 'mnemonic', phrase: 'only three words' }],
        }],
      ]),
    });

    const result = validateConfig(config);
    expect(result.valid).toBe(false);
    expect(result.errors[0].message).toContain('12 or 24 words');
  });

  it('should accept valid 12-word mnemonic', () => {
    const config = makeConfig({
      chains: new Map([
        [1, {
          chainId: 1,
          name: 'ethereum',
          rpcUrl: 'https://eth.example.com',
          explorerApiKey: 'key',
          accounts: [{
            type: 'mnemonic',
            phrase: 'test test test test test test test test test test test junk',
          }],
        }],
      ]),
    });

    const result = validateConfig(config);
    expect(result.valid).toBe(true);
  });

  it('should warn about missing explorer API key on mainnet', () => {
    const config = makeConfig({
      chains: new Map([
        [1, {
          chainId: 1,
          name: 'ethereum',
          rpcUrl: 'https://eth.example.com',
          testnet: false,
        }],
      ]),
    });

    const result = validateConfig(config);
    expect(result.warnings.some((w) => w.message.includes('explorer API key'))).toBe(true);
  });

  it('should warn about public RPCs on mainnet', () => {
    const config = makeConfig({
      chains: new Map([
        [1, {
          chainId: 1,
          name: 'ethereum',
          rpcUrl: 'https://eth.llamarpc.com',
          explorerApiKey: 'key',
          testnet: false,
        }],
      ]),
    });

    const result = validateConfig(config);
    expect(result.warnings.some((w) => w.message.includes('public RPC'))).toBe(true);
  });
});
