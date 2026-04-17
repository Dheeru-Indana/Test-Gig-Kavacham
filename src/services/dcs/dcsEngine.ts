export interface DcsInput {
  rainfallScore: number      // 0–1
  aqiScore: number           // 0–1
  heatScore: number          // 0–1
  orderDropScore: number     // 0–1
  socialDisruptionScore: number  // 0–1
  monthOfYear: number        // 1–12
  hourOfDay: number          // 0–23
  cityTier: string           // 'Tier 1' | 'Tier 2' | 'Tier 3' | 'Tier 4 / Rural'
}

export interface DcsOutput {
  currentDcs: number         // 0–100
  forecastDcs: number        // 0–100 (next window estimate)
  disruptionProbability: number  // 0–1
  riskLabel: 'Safe' | 'Elevated Risk' | 'Payout Trigger Zone'
  riskColor: 'green' | 'amber' | 'red'
  explanation: string
  signals: {
    rainfall: number
    aqi: number
    heat: number
    orderDrop: number
    socialDisruption: number
  }
}

// Weights matching the product formula
const WEIGHTS = {
  rainfall: 0.30,
  aqi: 0.25,
  heat: 0.20,
  orderDrop: 0.15,
  socialDisruption: 0.10,
}

// Monsoon months (India)
const MONSOON_MONTHS = [6, 7, 8, 9]

// Peak disruption hours
const PEAK_HOURS = [7, 8, 9, 17, 18, 19, 20]

export const computeDcs = (input: DcsInput): DcsOutput => {
  // Base weighted score
  const baseScore =
    input.rainfallScore * WEIGHTS.rainfall +
    input.aqiScore * WEIGHTS.aqi +
    input.heatScore * WEIGHTS.heat +
    input.orderDropScore * WEIGHTS.orderDrop +
    input.socialDisruptionScore * WEIGHTS.socialDisruption

  // Seasonal multiplier
  const isMonsoon = MONSOON_MONTHS.includes(input.monthOfYear)
  const seasonMultiplier = isMonsoon ? 1.25 : 1.0

  // Peak hour multiplier
  const isPeakHour = PEAK_HOURS.includes(input.hourOfDay)
  const hourMultiplier = isPeakHour ? 1.10 : 1.0

  // Tier risk amplifier
  const tierAmplifier =
    input.cityTier === 'Tier 1' ? 1.05 :
    input.cityTier === 'Tier 2' ? 1.10 :
    input.cityTier === 'Tier 3' ? 1.15 : 1.20

  // Final current DCS (0–100 scale)
  const rawDcs = baseScore * seasonMultiplier *
    hourMultiplier * tierAmplifier
  const currentDcs = Math.min(Math.round(rawDcs * 100), 100)

  // Forecast DCS — simulate next window trend
  // If AQI or rainfall is rising, forecast higher
  const forecastDelta = (
    (input.aqiScore > 0.6 ? 5 : 0) +
    (input.rainfallScore > 0.5 ? 8 : 0) +
    (isMonsoon ? 3 : -2)
  )
  const forecastDcs = Math.min(
    Math.max(currentDcs + forecastDelta, 0), 100
  )

  // Disruption probability
  const disruptionProbability = currentDcs >= 70
    ? 0.90
    : currentDcs >= 50
    ? 0.50 + (currentDcs - 50) * 0.02
    : (currentDcs / 100) * 0.5

  // Risk label
  const riskLabel =
    currentDcs >= 70 ? 'Payout Trigger Zone' :
    currentDcs >= 50 ? 'Elevated Risk' : 'Safe'

  const riskColor =
    currentDcs >= 70 ? 'red' :
    currentDcs >= 50 ? 'amber' : 'green'

  // Explanation
  const topSignals: string[] = []
  if (input.rainfallScore > 0.5)
    topSignals.push('high rainfall intensity')
  if (input.aqiScore > 0.5)
    topSignals.push('elevated AQI levels')
  if (input.heatScore > 0.5)
    topSignals.push('extreme heat conditions')
  if (input.orderDropScore > 0.5)
    topSignals.push('significant order volume drop')
  if (input.socialDisruptionScore > 0.3)
    topSignals.push('social disruption signals')

  const explanation = topSignals.length > 0
    ? `DCS is ${currentDcs}/100 due to ${topSignals.join(', ')}.
       ${currentDcs >= 70
         ? 'Payout trigger threshold reached. Active policies will be processed.'
         : currentDcs >= 50
         ? 'Zone is in elevated risk. Monitor for further changes.'
         : 'Zone is currently safe. No disruption events expected.'}`
    : `DCS is ${currentDcs}/100. All signals are within normal range.
       Zone is currently safe.`

  return {
    currentDcs,
    forecastDcs,
    disruptionProbability,
    riskLabel,
    riskColor,
    explanation,
    signals: {
      rainfall: Math.round(input.rainfallScore * 100),
      aqi: Math.round(input.aqiScore * 100),
      heat: Math.round(input.heatScore * 100),
      orderDrop: Math.round(input.orderDropScore * 100),
      socialDisruption: Math.round(input.socialDisruptionScore * 100),
    },
  }
};
