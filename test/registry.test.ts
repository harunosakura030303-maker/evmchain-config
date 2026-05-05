import { describe, it, expect } from 'vitest';
import {
  getChainMeta,
  getChainByName,
  getRegisteredChainIds,
  getMainnets,
  getTestnets,
  CHAIN_REGISTRY,
} from '../src/chain/registry';

describe('Chain Registry', () => {
  it('should contain major mainnets', () => {
    expect(getChainMeta(1)).toBeDefined();
    expect(getChainMeta(10)).toBeDefined();
    expect(getChainMeta(137)).toBeDefined();
    expect(getChainMeta(42161)).toBeDefined();
    expect(getChainMeta(8453)).toBeDefined();
  });

  it('should contain testnets', () => {
    expect(getChainMeta(11155111)).toBeDefined();
    expect(getChainMeta(11155111)?.testnet).toBe(true);
  });

  it('should return undefined for unknown chains', () => {
    expect(getChainMeta(999999)).toBeUndefined();
  });

  it('should find chains by name', () => {
    const eth = getChainByName('ethereum');
    expect(eth?.chainId).toBe(1);

    const arb = getChainByName('arbitrum');
    expect(arb?.chainId).toBe(42161);
  });

  it('should be case-insensitive for name lookup', () => {
    expect(getChainByName('Ethereum')?.chainId).toBe(1);
    expect(getChainByName('POLYGON')?.chainId).toBe(137);
  });

  it('should return all chain IDs', () => {
    const ids = getRegisteredChainIds();
    expect(ids.length).toBeGreaterThan(10);
    expect(ids).toContain(1);
    expect(ids).toContain(42161);
  });

  it('should separate mainnets and testnets', () => {
    const mainnets = getMainnets();
    const testnets = getTestnets();

    expect(mainnets.every((c) => !c.testnet)).toBe(true);
    expect(testnets.every((c) => c.testnet)).toBe(true);
    expect(mainnets.length + testnets.length).toBe(Object.keys(CHAIN_REGISTRY).length);
  });

  it('should have valid explorer URLs', () => {
    for (const chain of Object.values(CHAIN_REGISTRY)) {
      expect(chain.explorerUrl).toMatch(/^https?:\/\//);
    }
  });

  it('should have valid default RPCs', () => {
    for (const chain of Object.values(CHAIN_REGISTRY)) {
      expect(chain.defaultRpc).toMatch(/^https?:\/\//);
    }
  });
});
