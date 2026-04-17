/**
 * Dynamic Pricing Service
 * Calculates real-time premium adjustments based on environmental risk
 */

import { fetchLiveWeather } from '../weather/weatherService';

export interface PricingResult {
  basePremium: number;
  riskMultiplier: number;
  weatherAdjustment: number;
  finalPremium: number;
  explanation: string;
}

export async function calculateDynamicPremium(
  basePremium: number,
  city: string,
  riskScore: number // 0-100 from DCS
): Promise<PricingResult> {
  const weather = await fetchLiveWeather(city);
  
  let riskMultiplier = 1.0;
  let weatherAdjustment = 0;
  let explanation = "Standard rate applied.";

  // 1. DCS Risk Multiplier (0.8x to 1.5x)
  if (riskScore > 70) {
    riskMultiplier = 1.5;
    explanation = "Critical risk levels detected in your zone.";
  } else if (riskScore > 50) {
    riskMultiplier = 1.2;
    explanation = "Heightened disruption probability.";
  } else if (riskScore < 30) {
    riskMultiplier = 0.9;
    explanation = "Stable environment discount applied.";
  }

  // 2. Weather Specific Adjustments
  if (weather) {
    if (weather.rainfall24h > 20) {
      weatherAdjustment += 15;
      explanation += " + Heavy rainfall surcharge.";
    }
    if (weather.temp > 40) {
      weatherAdjustment += 10;
      explanation += " + Extreme heat surcharge.";
    }
  }

  const finalPremium = Math.round(basePremium * riskMultiplier + weatherAdjustment);

  return {
    basePremium,
    riskMultiplier,
    weatherAdjustment,
    finalPremium: Math.max(10, finalPremium), // Min 10 INR
    explanation
  };
}
