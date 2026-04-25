const ML_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001'

export const mlFetch = async (
  endpoint: string,
  body: object,
  timeoutMs = 8000
): Promise<any> => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(
      `${ML_BASE}/ml${endpoint}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      }
    )
    clearTimeout(timer)
    if (!res.ok) return null
    return await res.json()
  } catch {
    clearTimeout(timer)
    return null
  }
}

export const checkMlStatus = async (): Promise<boolean> => {
  try {
    const res = await fetch(`${ML_BASE}/health`)
    const data = await res.json()
    return data.status === 'ok'
  } catch {
    return false
  }
}

export const getPremiumPrediction = async (
  profile: any,
  cityTier: string,
  month: number,
  riskScores: {
    flood?: number,
    aqi?: number,
    heat?: number,
    rainfall?: number,
    traffic?: number,
    social?: number
  } = {}
) => {
  return await mlFetch('/premium/predict', {
    city_tier: cityTier,
    platform_type: profile?.platform_type || 'Delivery Partner',
    month_of_year: month,
    shield_score: profile?.shield_score || 75,
    daily_earnings: (profile?.weekly_earnings || 4000) / 7,
    weekly_earnings: profile?.weekly_earnings || 4000,
    is_monsoon: [6,7,8,9].includes(month) ? 1 : 0,
    is_heat_season: [4,5].includes(month) ? 1 : 0,
    is_holiday_period: 0,
    flood_risk_score: riskScores.flood ?? 0.3,
    aqi_risk_score: riskScores.aqi ?? 0.4,
    heat_risk_score: riskScores.heat ?? 0.3,
    rainfall_risk_score: riskScores.rainfall ?? 0.3,
    traffic_disruption_risk: riskScores.traffic ?? 0.2,
    social_disruption_risk: riskScores.social ?? 0.1,
  });
}
