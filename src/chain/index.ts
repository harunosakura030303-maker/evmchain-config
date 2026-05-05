/**
 * Chain module — chain registry and utilities
 */

export {
  CHAIN_REGISTRY,
  getChainMeta,
  getChainByName,
  getRegisteredChainIds,
  getMainnets,
  getTestnets,
} from './registry.js';

export type { ChainMeta } from './registry.js';
