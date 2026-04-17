/**
 * GigKavacham — Advanced Fraud Detection Engine (AI-Assisted)
 * 
 * Composite fraud scoring across three independent risk vectors:
 *   1. GPS Spoofing Detection      (0–40 points)
 *   2. Fake Weather Claim Detection (0–35 points)
 *   3. Behavioral Anomaly Scoring   (0–25 points)
 * 
 * Total Fraud Score: 0–100
 * All outputs include explainable plain-language signals.
 */

// ─── Interfaces ────────────────────────────────────────────

export interface FraudSignals {
  // GPS Spoofing Detection
  gpsZoneMismatch: boolean        // worker GPS outside registered zone
  gpsJumpDetected: boolean        // location changed impossibly fast
  gpsAccuracyLow: boolean         // GPS accuracy radius > 500m (spoofing indicator)
  vpnOrProxyDetected: boolean     // IP inconsistency

  // Fake Weather Claim Detection
  weatherClaimConsistency: number // 0-1: does claimed disruption match historical weather data for that zone/date
  historicalDcsDeviation: number  // how far current DCS deviates from historical average for this month/zone
  claimTimingAnomaly: boolean     // claim filed outside the disruption window

  // Behavioral Anomalies
  payoutFrequencyScore: number    // claims per week vs zone average
  duplicateEventAttempt: boolean  // same event claimed twice
  platformInactivityGap: number   // hours of inactivity before claim
  unusualClaimAmount: boolean     // amount far outside historical range
}

export interface FraudResult {
  fraudScore: number              // 0-100
  riskBand: 'low' | 'medium' | 'high'
  decision: 'pass' | 'review' | 'fail'
  confidence: number              // 0-1
  topSignals: string[]            // plain language explanation of top flags
  explanation: string             // single sentence summary
  detailedBreakdown: {
    gpsRiskScore: number          // 0-40
    weatherRiskScore: number      // 0-35
    behavioralRiskScore: number   // 0-25
  }
}

// ─── GPS Spoofing Detection (0–40 pts) ─────────────────────

const computeGpsRiskScore = (signals: FraudSignals): number => {
  let score = 0

  if (signals.gpsZoneMismatch) {
    score += 20
    // Worker's GPS coordinates at time of claim are outside
    // their registered delivery zone by more than 5km
  }

  if (signals.gpsJumpDetected) {
    score += 12
    // Location changed more than 50km in under 10 minutes
    // Physically impossible — strong spoofing indicator
  }

  if (signals.gpsAccuracyLow) {
    score += 5
    // GPS accuracy radius > 500m is common in GPS spoofing apps
    // which inject mock locations with low precision
  }

  if (signals.vpnOrProxyDetected) {
    score += 3
    // IP address inconsistent with registered city
  }

  return Math.min(score, 40)
}

// ─── Fake Weather Claim Detection (0–35 pts) ───────────────

const computeWeatherRiskScore = (signals: FraudSignals): number => {
  let score = 0

  // weatherClaimConsistency: 1.0 = perfectly consistent with
  // historical data, 0.0 = no weather event on record for this zone
  const weatherMismatch = 1 - signals.weatherClaimConsistency
  score += Math.round(weatherMismatch * 20)
  // If claiming rainfall trigger but historical data shows
  // no significant rainfall in that zone that day: high risk

  // historicalDcsDeviation: how much the DCS at time of claim
  // deviates from historical average DCS for this zone and month
  // Deviation > 0.5 means the DCS was unusually high for this
  // zone at this time of year — possible signal injection
  if (signals.historicalDcsDeviation > 0.5) {
    score += 10
  } else if (signals.historicalDcsDeviation > 0.3) {
    score += 5
  }

  if (signals.claimTimingAnomaly) {
    score += 5
    // Claim was filed more than 2 hours after disruption window
    // closed — retroactive claims are high risk
  }

  return Math.min(score, 35)
}

// ─── Behavioral Anomaly Scoring (0–25 pts) ─────────────────

const computeBehavioralRiskScore = (signals: FraudSignals): number => {
  let score = 0

  // payoutFrequencyScore: ratio of this worker's claim rate
  // to the zone average. Score of 1.0 = same as average.
  // Score of 3.0 = claiming 3x more than zone peers.
  if (signals.payoutFrequencyScore > 3.0) {
    score += 10
  } else if (signals.payoutFrequencyScore > 2.0) {
    score += 5
  }

  if (signals.duplicateEventAttempt) {
    score += 8
    // Same disruption event claimed more than once by this worker
  }

  // Platform inactivity: if worker was inactive on their
  // delivery platform for more than 4 hours before the
  // disruption event, they were unlikely to be affected
  if (signals.platformInactivityGap > 4) {
    score += 5
  } else if (signals.platformInactivityGap > 2) {
    score += 2
  }

  if (signals.unusualClaimAmount) {
    score += 2
    // Claimed amount is more than 2 standard deviations
    // outside this worker's historical claim amounts
  }

  return Math.min(score, 25)
}

// ─── Composite Fraud Score ─────────────────────────────────

export const computeFraudScore = (signals: FraudSignals): FraudResult => {
  const gpsRiskScore = computeGpsRiskScore(signals)
  const weatherRiskScore = computeWeatherRiskScore(signals)
  const behavioralRiskScore = computeBehavioralRiskScore(signals)

  const fraudScore = gpsRiskScore + weatherRiskScore + behavioralRiskScore

  const riskBand: FraudResult['riskBand'] =
    fraudScore >= 60 ? 'high' :
    fraudScore >= 30 ? 'medium' : 'low'

  const decision: FraudResult['decision'] =
    fraudScore >= 60 ? 'fail' :
    fraudScore >= 30 ? 'review' : 'pass'

  const confidence = Math.min(0.5 + (fraudScore / 200), 0.99)

  // Build top signals explanation
  const topSignals: string[] = []

  if (signals.gpsZoneMismatch)
    topSignals.push('Worker GPS location was outside registered delivery zone')
  if (signals.gpsJumpDetected)
    topSignals.push('GPS location changed at physically impossible speed — spoofing likely')
  if (signals.gpsAccuracyLow)
    topSignals.push('GPS accuracy was unusually low, consistent with mock location injection')
  if (1 - signals.weatherClaimConsistency > 0.6)
    topSignals.push('Claimed disruption type does not match historical weather records for this zone')
  if (signals.historicalDcsDeviation > 0.5)
    topSignals.push('DCS spike was anomalously high compared to historical zone averages for this month')
  if (signals.claimTimingAnomaly)
    topSignals.push('Claim was filed outside the valid disruption event window')
  if (signals.payoutFrequencyScore > 2)
    topSignals.push(`Worker is claiming ${signals.payoutFrequencyScore.toFixed(1)}x more than zone peers`)
  if (signals.duplicateEventAttempt)
    topSignals.push('Duplicate claim detected — same disruption event already processed')
  if (signals.platformInactivityGap > 4)
    topSignals.push(`Worker was inactive on platform for ${signals.platformInactivityGap.toFixed(0)} hours before claim`)

  const explanation =
    decision === 'pass'
      ? `Claim passed all fraud checks with a risk score of ${fraudScore}/100.`
      : decision === 'review'
      ? `Claim flagged for manual review. Risk score ${fraudScore}/100. Top concern: ${topSignals[0] || 'moderate anomaly detected'}.`
      : `Claim rejected. Risk score ${fraudScore}/100. Critical flags: ${topSignals.slice(0, 2).join('; ')}.`

  return {
    fraudScore,
    riskBand,
    decision,
    confidence,
    topSignals: topSignals.slice(0, 3),
    explanation,
    detailedBreakdown: {
      gpsRiskScore,
      weatherRiskScore,
      behavioralRiskScore,
    },
  }
}
