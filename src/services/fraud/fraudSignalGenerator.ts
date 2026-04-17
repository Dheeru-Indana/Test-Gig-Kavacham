/**
 * GigKavacham — Fraud Signal Generator
 * 
 * Generates realistic fraud signal profiles for demo claims.
 * Since we do not have real GPS or weather APIs yet, this module
 * produces deterministic + random signal combinations that exercise
 * the full fraudEngine scoring pipeline.
 * 
 * Three profiles:
 *   'clean'      → legitimate claim, all signals normal
 *   'suspicious' → mixed signals, triggers manual review
 *   'fraudulent' → strong GPS spoofing + fake weather + behavioral flags
 */

import type { FraudSignals } from './fraudEngine'

export const generateFraudSignals = (
  claimType: 'clean' | 'suspicious' | 'fraudulent',
  zone: string,
  monthOfYear: number
): FraudSignals => {
  const isMonsoon = [6, 7, 8, 9].includes(monthOfYear)

  if (claimType === 'clean') {
    return {
      gpsZoneMismatch: false,
      gpsJumpDetected: false,
      gpsAccuracyLow: false,
      vpnOrProxyDetected: false,
      weatherClaimConsistency: 0.85 + Math.random() * 0.15,
      historicalDcsDeviation: Math.random() * 0.2,
      claimTimingAnomaly: false,
      payoutFrequencyScore: 0.8 + Math.random() * 0.6,
      duplicateEventAttempt: false,
      platformInactivityGap: Math.random() * 1.5,
      unusualClaimAmount: false,
    }
  }

  if (claimType === 'suspicious') {
    return {
      gpsZoneMismatch: Math.random() > 0.5,
      gpsJumpDetected: false,
      gpsAccuracyLow: Math.random() > 0.4,
      vpnOrProxyDetected: Math.random() > 0.6,
      weatherClaimConsistency: 0.4 + Math.random() * 0.3,
      historicalDcsDeviation: 0.3 + Math.random() * 0.3,
      claimTimingAnomaly: Math.random() > 0.5,
      payoutFrequencyScore: 2.0 + Math.random() * 1.0,
      duplicateEventAttempt: false,
      platformInactivityGap: 2 + Math.random() * 3,
      unusualClaimAmount: Math.random() > 0.6,
    }
  }

  // fraudulent — strong indicators across all vectors
  return {
    gpsZoneMismatch: true,
    gpsJumpDetected: Math.random() > 0.4,
    gpsAccuracyLow: true,
    vpnOrProxyDetected: true,
    weatherClaimConsistency: Math.random() * 0.3,
    historicalDcsDeviation: 0.6 + Math.random() * 0.4,
    claimTimingAnomaly: true,
    payoutFrequencyScore: 3.5 + Math.random() * 1.5,
    duplicateEventAttempt: Math.random() > 0.5,
    platformInactivityGap: 5 + Math.random() * 3,
    unusualClaimAmount: true,
  }
}

/**
 * Generate a batch of mixed fraud signals for demo analytics.
 * Returns an array of { type, signals, result } for populating
 * the admin fraud analytics widget.
 */
export const generateDemoBatch = (count: number = 20) => {
  const { computeFraudScore } = require('./fraudEngine') as typeof import('./fraudEngine')
  const month = new Date().getMonth() + 1
  const results: Array<{
    type: 'clean' | 'suspicious' | 'fraudulent'
    signals: FraudSignals
    result: ReturnType<typeof computeFraudScore>
  }> = []

  for (let i = 0; i < count; i++) {
    // Distribution: ~65% clean, ~25% suspicious, ~10% fraudulent
    const roll = Math.random()
    const type: 'clean' | 'suspicious' | 'fraudulent' =
      roll < 0.65 ? 'clean' :
      roll < 0.90 ? 'suspicious' : 'fraudulent'

    const signals = generateFraudSignals(type, 'demo-zone', month)
    const result = computeFraudScore(signals)
    results.push({ type, signals, result })
  }

  return results
}
