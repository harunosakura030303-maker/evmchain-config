/**
 * Core type definitions for evmchain-config
 */

export interface ChainConfig {
  /** Chain ID (e.g., 1 for Ethereum mainnet) */
  chainId: number;
  /** Human-readable chain name */
  name: string;
  /** RPC endpoint URL */
  rpcUrl: string;
  /** Optional fallback RPC URLs */
  rpcUrls?: string[];
  /** Private keys or HD wallet mnemonics for signing */
  accounts?: AccountConfig[];
  /** Block explorer URL (e.g., https://etherscan.io) */
  explorerUrl?: string;
  /** Block explorer API key for verification */
  explorerApiKey?: string;
  /** Native currency symbol */
  currency?: string;
  /** Whether this is a testnet */
  testnet?: boolean;
}

export type AccountConfig =
  | { type: 'privateKey'; key: string }
  | { type: 'mnemonic'; phrase: string; path?: string; count?: number }
  | { type: 'keystore'; path: string; password?: string };

export interface EvmConfig {
  /** Default chain ID to use */
  defaultChain?: number;
  /** Chain-specific configurations */
  chains: Map<number, ChainConfig>;
  /** Global accounts (applied to all chains if chain has none) */
  accounts?: AccountConfig[];
  /** Solidity compiler version */
  solidity?: string;
  /** Project metadata */
  project?: {
    name?: string;
    type?: 'hardhat' | 'foundry' | 'hybrid' | 'unknown';
    root?: string;
  };
}

export interface LoadOptions {
  /** Environment to load (maps to .env.<env>) */
  env?: string;
  /** Root directory to search for config files */
  root?: string;
  /** Whether to auto-detect project type */
  autoDetect?: boolean;
  /** Custom .env file path */
  envPath?: string;
  /** Whether to validate config after loading */
  validate?: boolean;
  /** Enable telemetry (default: true) */
  telemetry?: boolean;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  chain?: number;
  field: string;
  message: string;
}

export interface ValidationWarning {
  chain?: number;
  field: string;
  message: string;
}

/** Hardhat-compatible network configuration */
export interface HardhatNetworkConfig {
  url: string;
  chainId?: number;
  accounts?: string[] | { mnemonic: string; path?: string; count?: number };
}

export interface HardhatExportConfig {
  solidity?: string;
  defaultNetwork?: string;
  networks: Record<string, HardhatNetworkConfig>;
  etherscan?: {
    apiKey: Record<string, string>;
  };
}

/** Detected project environment */
export interface ProjectEnvironment {
  type: 'hardhat' | 'foundry' | 'hybrid' | 'unknown';
  root: string;
  configFiles: string[];
  envFiles: string[];
}
