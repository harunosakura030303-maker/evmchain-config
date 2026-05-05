/**
 * Built-in chain registry — common EVM chains with default RPC endpoints
 */

export interface ChainMeta {
  chainId: number;
  name: string;
  currency: string;
  explorerUrl: string;
  testnet: boolean;
  defaultRpc: string;
}

export const CHAIN_REGISTRY: Record<number, ChainMeta> = {
  // Mainnets
  1: {
    chainId: 1,
    name: 'ethereum',
    currency: 'ETH',
    explorerUrl: 'https://etherscan.io',
    testnet: false,
    defaultRpc: 'https://eth.llamarpc.com',
  },
  10: {
    chainId: 10,
    name: 'optimism',
    currency: 'ETH',
    explorerUrl: 'https://optimistic.etherscan.io',
    testnet: false,
    defaultRpc: 'https://mainnet.optimism.io',
  },
  56: {
    chainId: 56,
    name: 'bsc',
    currency: 'BNB',
    explorerUrl: 'https://bscscan.com',
    testnet: false,
    defaultRpc: 'https://bsc-dataseed.binance.org',
  },
  100: {
    chainId: 100,
    name: 'gnosis',
    currency: 'xDAI',
    explorerUrl: 'https://gnosisscan.io',
    testnet: false,
    defaultRpc: 'https://rpc.gnosischain.com',
  },
  137: {
    chainId: 137,
    name: 'polygon',
    currency: 'MATIC',
    explorerUrl: 'https://polygonscan.com',
    testnet: false,
    defaultRpc: 'https://polygon-rpc.com',
  },
  250: {
    chainId: 250,
    name: 'fantom',
    currency: 'FTM',
    explorerUrl: 'https://ftmscan.com',
    testnet: false,
    defaultRpc: 'https://rpc.ftm.tools',
  },
  324: {
    chainId: 324,
    name: 'zksync',
    currency: 'ETH',
    explorerUrl: 'https://explorer.zksync.io',
    testnet: false,
    defaultRpc: 'https://mainnet.era.zksync.io',
  },
  8453: {
    chainId: 8453,
    name: 'base',
    currency: 'ETH',
    explorerUrl: 'https://basescan.org',
    testnet: false,
    defaultRpc: 'https://mainnet.base.org',
  },
  42161: {
    chainId: 42161,
    name: 'arbitrum',
    currency: 'ETH',
    explorerUrl: 'https://arbiscan.io',
    testnet: false,
    defaultRpc: 'https://arb1.arbitrum.io/rpc',
  },
  42170: {
    chainId: 42170,
    name: 'arbitrum-nova',
    currency: 'ETH',
    explorerUrl: 'https://nova.arbiscan.io',
    testnet: false,
    defaultRpc: 'https://nova.arbitrum.io/rpc',
  },
  43114: {
    chainId: 43114,
    name: 'avalanche',
    currency: 'AVAX',
    explorerUrl: 'https://snowtrace.io',
    testnet: false,
    defaultRpc: 'https://api.avax.network/ext/bc/C/rpc',
  },
  59144: {
    chainId: 59144,
    name: 'linea',
    currency: 'ETH',
    explorerUrl: 'https://lineascan.build',
    testnet: false,
    defaultRpc: 'https://rpc.linea.build',
  },
  534352: {
    chainId: 534352,
    name: 'scroll',
    currency: 'ETH',
    explorerUrl: 'https://scrollscan.com',
    testnet: false,
    defaultRpc: 'https://rpc.scroll.io',
  },
  81457: {
    chainId: 81457,
    name: 'blast',
    currency: 'ETH',
    explorerUrl: 'https://blastscan.io',
    testnet: false,
    defaultRpc: 'https://rpc.blast.io',
  },

  // Testnets
  11155111: {
    chainId: 11155111,
    name: 'sepolia',
    currency: 'ETH',
    explorerUrl: 'https://sepolia.etherscan.io',
    testnet: true,
    defaultRpc: 'https://rpc.sepolia.org',
  },
  421614: {
    chainId: 421614,
    name: 'arbitrum-sepolia',
    currency: 'ETH',
    explorerUrl: 'https://sepolia.arbiscan.io',
    testnet: true,
    defaultRpc: 'https://sepolia-rollup.arbitrum.io/rpc',
  },
  84532: {
    chainId: 84532,
    name: 'base-sepolia',
    currency: 'ETH',
    explorerUrl: 'https://sepolia.basescan.org',
    testnet: true,
    defaultRpc: 'https://sepolia.base.org',
  },
  11155420: {
    chainId: 11155420,
    name: 'optimism-sepolia',
    currency: 'ETH',
    explorerUrl: 'https://sepolia-optimism.etherscan.io',
    testnet: true,
    defaultRpc: 'https://sepolia.optimism.io',
  },
};

/**
 * Get chain metadata by chain ID
 */
export function getChainMeta(chainId: number): ChainMeta | undefined {
  return CHAIN_REGISTRY[chainId];
}

/**
 * Get chain metadata by name (case-insensitive)
 */
export function getChainByName(name: string): ChainMeta | undefined {
  const lower = name.toLowerCase();
  return Object.values(CHAIN_REGISTRY).find(
    (c) => c.name.toLowerCase() === lower
  );
}

/**
 * Get all registered chain IDs
 */
export function getRegisteredChainIds(): number[] {
  return Object.keys(CHAIN_REGISTRY).map(Number);
}

/**
 * Get all mainnet chains
 */
export function getMainnets(): ChainMeta[] {
  return Object.values(CHAIN_REGISTRY).filter((c) => !c.testnet);
}

/**
 * Get all testnet chains
 */
export function getTestnets(): ChainMeta[] {
  return Object.values(CHAIN_REGISTRY).filter((c) => c.testnet);
}
