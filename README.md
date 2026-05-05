# evmchain-config

> Universal EVM chain configuration manager for Hardhat, Foundry, viem, and ethers.

Stop copy-pasting RPC URLs and private keys across config files. Load once, use everywhere.

## Features

- **Auto-detection** — Detects Hardhat, Foundry, or hybrid projects automatically
- **Universal .env parsing** — Extracts chain configs from standard env var patterns
- **Framework adapters** — Export to Hardhat, viem, or ethers format with one call
- **Type-safe** — Full TypeScript support with autocomplete
- **Chain registry** — 18+ built-in chains with default RPCs, explorers, and metadata
- **Validation** — Checks RPC format, key format, chain consistency
- **Zero config** — Works out of the box with standard .env conventions

## Install

```bash
npm install evmchain-config
# or
pnpm add evmchain-config
# or
yarn add evmchain-config
```

## Quick Start

### 1. Set up your `.env`

```env
# RPC endpoints — chain name is auto-detected from the variable name
ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
ARBITRUM_RPC_URL=https://arb-mainnet.g.alchemy.com/v2/YOUR_KEY
BASE_RPC_URL=https://base-mainnet.g.alchemy.com/v2/YOUR_KEY
OPTIMISM_RPC_URL=https://opt-mainnet.g.alchemy.com/v2/YOUR_KEY

# Accounts
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
MNEMONIC=test test test test test test test test test test test junk

# Explorer keys
ETHERSCAN_API_KEY=YOUR_KEY
ARBISCAN_API_KEY=YOUR_KEY
```

### 2. Load and use

```typescript
import { loadConfig } from 'evmchain-config';

const config = await loadConfig();

// Access chain config
const mainnet = config.chains.get(1);
console.log(mainnet?.rpcUrl);     // https://eth-mainnet.g.alchemy.com/v2/...
console.log(mainnet?.accounts);   // [{ type: 'privateKey', key: '0xac...' }]

// List all configured chains
for (const [chainId, chain] of config.chains) {
  console.log(`${chain.name} (${chainId}): ${chain.rpcUrl}`);
}
```

## Framework Adapters

### Hardhat

```typescript
// hardhat.config.ts
import { loadConfig } from 'evmchain-config';
import { toHardhat } from 'evmchain-config/adapters/hardhat';

const config = await loadConfig();

export default {
  ...toHardhat(config),
  // Add any Hardhat-specific overrides here
};
```

### viem

```typescript
import { loadConfig } from 'evmchain-config';
import { toViem } from 'evmchain-config/adapters/viem';
import { createPublicClient, createWalletClient, http } from 'viem';

const config = await loadConfig();
const { chains, transports, accounts } = toViem(config);

// Create a public client
const publicClient = createPublicClient({
  chain: chains.find(c => c.id === 1)!,
  transport: http(transports[1].url),
});

// Create a wallet client
const walletClient = createWalletClient({
  chain: chains.find(c => c.id === 1)!,
  transport: http(transports[1].url),
  account: accounts[0] as `0x${string}`,
});
```

### ethers

```typescript
import { loadConfig } from 'evmchain-config';
import { toEthers } from 'evmchain-config/adapters/ethers';
import { JsonRpcProvider, Wallet } from 'ethers';

const config = await loadConfig();
const { providers, wallets } = toEthers(config);

// Create provider and wallet
const provider = new JsonRpcProvider(providers[1].url, providers[1].chainId);
const wallet = new Wallet(wallets[0].privateKey, provider);
```

## Foundry Support

If your project has a `foundry.toml`, evmchain-config will automatically parse it:

```toml
# foundry.toml
[profile.default]
solc_version = "0.8.24"

[rpc_endpoints]
mainnet = "https://eth-mainnet.g.alchemy.com/v2/KEY"
arbitrum = "https://arb-mainnet.g.alchemy.com/v2/KEY"

[etherscan]
mainnet = { key = "YOUR_KEY" }
arbitrum = { key = "YOUR_KEY" }
```

```typescript
const config = await loadConfig();
// foundry.toml chains are automatically loaded and merged with .env
```

## Multi-Environment

```typescript
// Load production config
const prod = await loadConfig({ env: 'production' }); // reads .env.production

// Load staging config
const staging = await loadConfig({ env: 'staging' }); // reads .env.staging

// Load with custom .env path
const custom = await loadConfig({ envPath: './config/.env.custom' });
```

## Config Validation

```typescript
import { loadConfig, validateConfig } from 'evmchain-config';

const config = await loadConfig();
const result = validateConfig(config);

if (!result.valid) {
  console.error('Config errors:', result.errors);
}

for (const warning of result.warnings) {
  console.warn(`⚠ ${warning.message}`);
}
```

Or validate on load:

```typescript
const config = await loadConfig({ validate: true }); // throws on validation error
```

## Chain Registry

Built-in support for 18+ chains:

| Chain | ID | Name |
|-------|-----|------|
| Ethereum | 1 | `ethereum` |
| Optimism | 10 | `optimism` |
| BSC | 56 | `bsc` |
| Gnosis | 100 | `gnosis` |
| Polygon | 137 | `polygon` |
| Fantom | 250 | `fantom` |
| zkSync Era | 324 | `zksync` |
| Base | 8453 | `base` |
| Arbitrum | 42161 | `arbitrum` |
| Avalanche | 43114 | `avalanche` |
| Linea | 59144 | `linea` |
| Scroll | 534352 | `scroll` |
| Blast | 81457 | `blast` |
| Sepolia | 11155111 | `sepolia` |
| Arbitrum Sepolia | 421614 | `arbitrum-sepolia` |
| Base Sepolia | 84532 | `base-sepolia` |
| OP Sepolia | 11155420 | `optimism-sepolia` |

```typescript
import { getChainMeta, getMainnets } from 'evmchain-config';

const eth = getChainMeta(1);
// { chainId: 1, name: 'ethereum', currency: 'ETH', explorerUrl: '...', ... }

const mainnets = getMainnets();
// All mainnet chain metadata
```

## Env Variable Patterns

evmchain-config recognizes these patterns automatically:

### RPC URLs
```
ETHEREUM_RPC_URL, ETH_RPC, MAINNET_URL, RPC_URL_ARBITRUM, ...
```

### Private Keys
```
PRIVATE_KEY, DEPLOYER_KEY, DEPLOYER_PRIVATE_KEY, SIGNER_KEY, ...
```

### Mnemonics
```
MNEMONIC, SEED_PHRASE, HD_WALLET_MNEMONIC, ...
```

### Explorer API Keys
```
ETHERSCAN_API_KEY, ARBISCAN_API_KEY, EXPLORER_API_KEY, ...
```

### Provider API Keys
```
ALCHEMY_API_KEY, INFURA_KEY, INFURA_PROJECT_ID, ...
```

## API

### `loadConfig(options?)`

Load configuration from all available sources.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `env` | `string` | - | Environment name (loads `.env.<env>`) |
| `root` | `string` | `process.cwd()` | Project root directory |
| `autoDetect` | `boolean` | `true` | Auto-detect project type |
| `envPath` | `string` | - | Custom .env file path |
| `validate` | `boolean` | `false` | Validate config on load |
| `telemetry` | `boolean` | `true` | Enable usage analytics |

### `validateConfig(config)`

Validate a loaded configuration. Returns `{ valid, errors, warnings }`.

### `detectProject(root?)`

Detect project type and find config files. Returns `{ type, root, configFiles, envFiles }`.

## Telemetry

evmchain-config collects anonymous usage data to help improve the package. This includes:

- Which frameworks are used (Hardhat/Foundry)
- Which chains are configured
- Which features are used
- Performance metrics

**No private keys, credentials, or sensitive data are collected.**

To opt out:

```bash
# .env
EVMCHAIN_TELEMETRY=false

# or use the standard DO_NOT_TRACK
DO_NOT_TRACK=1
```

## License

MIT
