/**
 * GigKavacham — Weekly Forecast (AI-Assisted Predictive Analytics)
 * 
 * Uses the same DCS formula logic to estimate next week's expected
 * claim volume and payout liability. Provides explainable risk factors
 * and actionable recommendations.
 */

export interface WeeklyForecast {
  expectedDisruptionDays: number      // 0-7 days likely disrupted next week
  expectedClaimCount: number          // estimated number of claims
  expectedPayoutLiability: number     // estimated total payout in Rs
  riskLevel: 'low' | 'medium' | 'high'
  confidenceScore: number             // 0-1
  keyRiskFactors: string[]
  recommendation: string
}

export const generateWeeklyForecast = (
  activePolicyCount: number,
  avgWeeklyPayoutCap: number,
  currentMonth: number,
  avgCurrentDcs: number,
): WeeklyForecast => {
  const isMonsoon = [6, 7, 8, 9].includes(currentMonth)
  const isHeatSeason = [4, 5, 6].includes(currentMonth)

  // Base disruption probability per day
  let baseDailyRisk = 0.10

  if (isMonsoon) baseDailyRisk += 0.25
  if (isHeatSeason) baseDailyRisk += 0.15
  if (avgCurrentDcs >= 70) baseDailyRisk += 0.30
  else if (avgCurrentDcs >= 50) baseDailyRisk += 0.15

  const expectedDisruptionDays = Math.min(
    Math.round(baseDailyRisk * 7), 7
  )

  // Estimated % of active workers who will be in affected zones
  const zoneHitRate = isMonsoon ? 0.35 : 0.15

  const expectedClaimCount = Math.round(
    activePolicyCount * zoneHitRate * expectedDisruptionDays / 7
  )

  const expectedPayoutLiability = Math.round(
    expectedClaimCount * avgWeeklyPayoutCap * 0.6
    // 0.6 factor: average claim is 60% of weekly cap
  )

  const riskLevel: WeeklyForecast['riskLevel'] =
    expectedDisruptionDays >= 4 ? 'high' :
    expectedDisruptionDays >= 2 ? 'medium' : 'low'

  const confidenceScore =
    isMonsoon ? 0.78 : isHeatSeason ? 0.65 : 0.55

  const keyRiskFactors: string[] = []
  if (isMonsoon) keyRiskFactors.push('Active monsoon season — elevated rainfall risk')
  if (isHeatSeason) keyRiskFactors.push('Peak heat season — heatwave risk elevated')
  if (avgCurrentDcs >= 50)
    keyRiskFactors.push(`Current DCS at ${Math.round(avgCurrentDcs)}/100 — zone already elevated`)
  if (activePolicyCount > 50)
    keyRiskFactors.push(`High active policy count (${activePolicyCount}) increases total liability`)
  if (keyRiskFactors.length === 0)
    keyRiskFactors.push('No significant risk factors identified for the current period')

  const recommendation =
    riskLevel === 'high'
      ? `Reserve at least ₹${expectedPayoutLiability.toLocaleString('en-IN')} for next week's expected claims.`
      : riskLevel === 'medium'
      ? `Monitor DCS daily. Expected claim exposure: ₹${expectedPayoutLiability.toLocaleString('en-IN')}.`
      : `Low disruption week expected. Maintain standard reserves.`

  return {
    expectedDisruptionDays,
    expectedClaimCount,
    expectedPayoutLiability,
    riskLevel,
    confidenceScore,
    keyRiskFactors,
    recommendation,
  }
}
