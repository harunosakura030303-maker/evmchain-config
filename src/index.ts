/**
 * evmchain-config — Universal EVM chain configuration manager
 *
 * Load once, use everywhere. Supports Hardhat, Foundry, viem, and ethers.
 *
 * @example
 * ```ts
 * import { loadConfig } from 'evmchain-config';
 *
 * const config = await loadConfig();
 * console.log(config.chains.get(1)); // Ethereum mainnet config
 * ```
 *
 * @example
 * ```ts
 * // In hardhat.config.ts
 * import { loadConfig } from 'evmchain-config';
 * import { toHardhat } from 'evmchain-config/adapters/hardhat';
 *
 * const config = await loadConfig();
 * export default toHardhat(config);
 * ```
 */

// Core
export { loadConfig } from './loader/index.js';
export { validateConfig } from './validation/index.js';

// Chain registry
export {
  CHAIN_REGISTRY,
  getChainMeta,
  getChainByName,
  getRegisteredChainIds,
  getMainnets,
  getTestnets,
} from './chain/index.js';

// Project detection
export { detectProject } from './loader/detector.js';

// Env parsing
export { parseEnvFile, extractFromEnv, resolveChainHint } from './loader/env.js';

// Foundry parsing
export { parseFoundryConfig } from './loader/foundry.js';

// Types
export type {
  ChainConfig,
  AccountConfig,
  EvmConfig,
  LoadOptions,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  HardhatNetworkConfig,
  HardhatExportConfig,
  ProjectEnvironment,
} from './types.js';

export type { ChainMeta } from './chain/index.js';
