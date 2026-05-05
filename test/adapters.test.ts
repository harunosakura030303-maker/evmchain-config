import { describe, it, expect } from 'vitest';
import { toHardhat } from '../src/adapters/hardhat';
import { toViem } from '../src/adapters/viem';
import { toEthers } from '../src/adapters/ethers';
import type { EvmConfig } from '../src/types';

const testConfig: EvmConfig = {
  chains: new Map([
    [1, {
      chainId: 1,
      name: 'ethereum',
      rpcUrl: 'https://eth.example.com',
      accounts: [{ type: 'privateKey', key: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' }],
      explorerUrl: 'https://etherscan.io',
      explorerApiKey: 'test-key',
      currency: 'ETH',
      testnet: false,
    }],
    [42161, {
      chainId: 42161,
      name: 'arbitrum',
      rpcUrl: 'https://arb.example.com',
      explorerUrl: 'https://arbiscan.io',
      currency: 'ETH',
      testnet: false,
    }],
  ]),
  accounts: [{ type: 'privateKey', key: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' }],
  solidity: '0.8.24',
};

describe('toHardhat', () => {
  it('should convert to Hardhat config format', () => {
    const result = toHardhat(testConfig);

    expect(result.networks['ethereum']).toBeDefined();
    expect(result.networks['ethereum'].url).toBe('https://eth.example.com');
    expect(result.networks['ethereum'].chainId).toBe(1);
    expect(result.networks['arbitrum']).toBeDefined();
  });

  it('should include hardhat and localhost networks', () => {
    const result = toHardhat(testConfig);
    expect(result.networks['hardhat']).toBeDefined();
    expect(result.networks['localhost']).toBeDefined();
  });

  it('should include etherscan config', () => {
    const result = toHardhat(testConfig);
    expect(result.etherscan?.apiKey['ethereum']).toBe('test-key');
  });

  it('should include solidity version', () => {
    const result = toHardhat(testConfig);
    expect(result.solidity).toBe('0.8.24');
  });

  it('should export accounts as string array', () => {
    const result = toHardhat(testConfig);
    const accounts = result.networks['ethereum'].accounts;
    expect(Array.isArray(accounts)).toBe(true);
    expect((accounts as string[])[0]).toContain('0xac0974');
  });
});

describe('toViem', () => {
  it('should convert to viem chain format', () => {
    const result = toViem(testConfig);

    expect(result.chains).toHaveLength(2);
    expect(result.chains[0].id).toBe(1);
    expect(result.chains[0].name).toBe('ethereum');
    expect(result.chains[0].rpcUrls.default.http[0]).toBe('https://eth.example.com');
  });

  it('should include transports', () => {
    const result = toViem(testConfig);
    expect(result.transports[1].url).toBe('https://eth.example.com');
    expect(result.transports[42161].url).toBe('https://arb.example.com');
  });

  it('should extract accounts', () => {
    const result = toViem(testConfig);
    expect(result.accounts).toHaveLength(1);
    expect(result.accounts[0]).toContain('0xac0974');
  });

  it('should include block explorers', () => {
    const result = toViem(testConfig);
    expect(result.chains[0].blockExplorers?.default.url).toBe('https://etherscan.io');
  });

  it('should include native currency', () => {
    const result = toViem(testConfig);
    expect(result.chains[0].nativeCurrency.symbol).toBe('ETH');
  });
});

describe('toEthers', () => {
  it('should convert to ethers provider configs', () => {
    const result = toEthers(testConfig);

    expect(result.providers[1]).toBeDefined();
    expect(result.providers[1].url).toBe('https://eth.example.com');
    expect(result.providers[1].chainId).toBe(1);
    expect(result.providers[42161]).toBeDefined();
  });

  it('should create wallet configs with provider', () => {
    const result = toEthers(testConfig);
    expect(result.wallets.length).toBeGreaterThan(0);
    expect(result.wallets[0].privateKey).toContain('0xac0974');
    expect(result.wallets[0].provider.chainId).toBe(1);
  });
});
