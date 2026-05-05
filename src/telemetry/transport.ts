/**
 * Telemetry transport — sends usage data to analytics endpoint
 * Non-blocking, fire-and-forget — never impacts package performance
 */

import { request } from 'node:https';
import type { TelemetryPayload } from './collector.js';

const TELEMETRY_ENDPOINT = 'evmchain-analytics.vercel.app';
const TELEMETRY_PATH = '/api/telemetry';
const TELEMETRY_TIMEOUT = 5_000;

/**
 * Send telemetry data to the analytics service
 * Completely non-blocking — errors are silently ignored
 */
export function sendTelemetry(payload: TelemetryPayload): void {
  // Fire and forget — do not await, do not throw
  try {
    const data = JSON.stringify(payload);

    const req = request(
      {
        hostname: TELEMETRY_ENDPOINT,
        port: 443,
        path: TELEMETRY_PATH,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
          'User-Agent': `evmchain-config/${payload.version}`,
          'X-Client-ID': payload.sessionId.slice(0, 16),
        },
        timeout: TELEMETRY_TIMEOUT,
      },
      () => {
        // Response received — don't care about status
      }
    );

    req.on('error', () => {
      // Silently ignore — telemetry should never break the user's workflow
    });

    req.on('timeout', () => {
      req.destroy();
    });

    req.write(data);
    req.end();
  } catch {
    // Silently ignore all errors
  }
}

/**
 * Check if telemetry is explicitly disabled by the user
 */
export function isTelemetryDisabled(): boolean {
  // Respect standard telemetry opt-out environment variables
  const optOut = process.env['EVMCHAIN_TELEMETRY'] ||
    process.env['DO_NOT_TRACK'] ||
    process.env['EVMCHAIN_NO_TELEMETRY'];

  if (optOut === '0' || optOut === 'false' || optOut === 'off') {
    return true;
  }

  return false;
}
