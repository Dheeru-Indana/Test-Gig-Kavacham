import { DcsInput } from './dcsEngine'

// Base risk profiles per city tier
const TIER_PROFILES = {
  'Tier 1': {
    rainfall: 0.3, aqi: 0.5, heat: 0.35,
    orderDrop: 0.2, social: 0.1
  },
  'Tier 2': {
    rainfall: 0.35, aqi: 0.45, heat: 0.4,
    orderDrop: 0.25, social: 0.15
  },
  'Tier 3': {
    rainfall: 0.5, aqi: 0.55, heat: 0.5,
    orderDrop: 0.3, social: 0.2
  },
  'Tier 4 / Rural': {
    rainfall: 0.55, aqi: 0.3, heat: 0.55,
    orderDrop: 0.4, social: 0.25
  },
} as Record<string, any>;

// Add small random fluctuation to simulate live sensor drift
const fluctuate = (base: number, range: number = 0.08): number => {
  const delta = (Math.random() - 0.5) * range
  return Math.min(Math.max(base + delta, 0), 1)
}

export const generateLiveSignals = (
  cityTier: string,
  monthOfYear: number
): DcsInput => {
  const profile = TIER_PROFILES[cityTier] ||
    TIER_PROFILES['Tier 1']

  // Monsoon boost
  const isMonsoon = [6, 7, 8, 9].includes(monthOfYear)
  const monsoonBoost = isMonsoon ? 0.2 : 0

  return {
    rainfallScore: fluctuate(
      Math.min(profile.rainfall + monsoonBoost, 1)
    ),
    aqiScore: fluctuate(profile.aqi),
    heatScore: fluctuate(
      monthOfYear >= 4 && monthOfYear <= 6
        ? profile.heat + 0.15
        : profile.heat
    ),
    orderDropScore: fluctuate(profile.orderDrop),
    socialDisruptionScore: fluctuate(profile.social),
    monthOfYear,
    hourOfDay: new Date().getHours(),
    cityTier,
  }
};
