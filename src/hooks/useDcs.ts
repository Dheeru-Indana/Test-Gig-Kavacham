import { useState, useEffect, useCallback, useRef } from 'react'
import { computeDcs, DcsOutput, DcsInput } from '../services/dcs/dcsEngine'
import { generateLiveSignals } from '../services/dcs/dcsSignalSimulator'
import { createNotification } from '../services/notifications/notificationService'
import { mlFetch, checkMlStatus } from '../services/ml/mlApiService'
import { fetchLiveWeather } from '../services/weather/weatherService'

export const useDcs = (
  cityTier: string,
  userId?: string,
  intervalMs: number = 30000,
  city?: string
) => {
  const [dcsOutput, setDcsOutput] = useState<DcsOutput | null>(null)
  const [loading, setLoading] = useState(true)
  const [mlOnline, setMlOnline] = useState(false)
  const prevDcsRef = useRef<number>(0)

  const refresh = useCallback(async () => {
    const month = new Date().getMonth() + 1
    let signals: DcsInput;

    // 1. Fetch live weather if city is provided
    const weather = city ? await fetchLiveWeather(city) : null;

    if (weather) {
      signals = {
        rainfallScore: Math.min(1, weather.rainfall24h / 50), // 50mm = max risk
        aqiScore: 0.35, // Placeholder for OWM basic
        heatScore: Math.max(0, Math.min(1, (weather.temp - 25) / 20)), // 25C to 45C
        orderDropScore: (weather.rainfall24h > 10 ? 0.4 : 0.1) + (weather.temp > 40 ? 0.3 : 0),
        socialDisruptionScore: 0.1,
        monthOfYear: month,
        hourOfDay: new Date().getHours(),
        cityTier: cityTier || 'Tier 1'
      };
    } else {
      const simSignals = generateLiveSignals(cityTier, month);
      signals = simSignals;
    }
    
    // Check ML status occasionally
    const online = await checkMlStatus();
    setMlOnline(online);

    let output: DcsOutput;

    // Stricter guards
    const isValidInput = 
      signals.cityTier && signals.cityTier.trim() !== "" &&
      Number.isFinite(signals.rainfallScore) &&
      Number.isFinite(signals.aqiScore) &&
      Number.isFinite(signals.heatScore) &&
      Number.isFinite(signals.orderDropScore);

    if (online && isValidInput) {
      try {
        const mlRes = await mlFetch('/dcs/predict', {
          rainfall_score: signals.rainfallScore,
          aqi_score: signals.aqiScore,
          heat_score: signals.heatScore,
          order_drop_score: signals.orderDropScore,
          social_score: signals.socialDisruptionScore,
          city_tier: signals.cityTier,
          month_of_year: month,
          hour_of_day: signals.hourOfDay,
          day_of_week: new Date().getDay(),
          is_monsoon: [6,7,8,9].includes(month) ? 1 : 0,
          is_heat_season: [4,5].includes(month) ? 1 : 0,
          current_dcs: prevDcsRef.current || 35
        });

        if (mlRes) {
          output = {
            currentDcs: mlRes.forecast_dcs,
            forecastDcs: mlRes.forecast_dcs + 2, // Simple forecast
            disruptionProbability: mlRes.disruption_probability,
            riskLabel: mlRes.risk_label as any,
            riskColor: mlRes.risk_color as any,
            explanation: mlRes.explanation,
            signals: {
               rainfall: Math.round(signals.rainfallScore * 100),
               aqi: Math.round(signals.aqiScore * 100),
               heat: Math.round(signals.heatScore * 100),
               orderDrop: Math.round(signals.orderDropScore * 100),
               socialDisruption: Math.round(signals.socialDisruptionScore * 100),
            }
          };
        } else {
          output = computeDcs(signals);
        }
      } catch (err) {
        console.warn('[DCS] ML prediction failed, falling back to local engine', err);
        output = computeDcs(signals);
      }
    } else {
      output = computeDcs(signals);
    }
    
    setDcsOutput(output)

    if (userId && prevDcsRef.current < 70 && output.currentDcs >= 70) {
      createNotification(
        userId, 
        'dcs_alert', 
        'DCS Alert — Trigger Zone', 
        `Your zone DCS has crossed 70 (current: ${output.currentDcs}). A disruption event is being processed for your policy.`
      );
    }
    
    prevDcsRef.current = output.currentDcs;
    setLoading(false)
  }, [cityTier, userId, city])

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, intervalMs)
    return () => clearInterval(interval)
  }, [refresh, intervalMs])

  return { dcsOutput, loading, refresh }
};
