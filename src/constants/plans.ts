/**
 * GIGKAVACHAM FINANCIAL MODEL V2
 * Normalized Tier-Based Multipliers & Dynamic Premium Engine
 */

export interface Plan {
  id: string;
  name: string;
  weeklyPremium: number;
  coverageAmount: number;
  weeklyPayoutCap: number;
  features: string[];
}

export const PLANS: Plan[] = [
  {
    id: 'shield-lite',
    name: 'Shield Lite',
    weeklyPremium: 49,
    coverageAmount: 5000,
    weeklyPayoutCap: 1200,
    features: ['AQI > 300 Protection', 'Basic Loss Coverage', 'UPI Payouts']
  },
  {
    id: 'shield-plus',
    name: 'Shield Plus',
    weeklyPremium: 99,
    coverageAmount: 12000,
    weeklyPayoutCap: 2500,
    features: ['AQI & Rainfall Protection', 'Health Cash Benefit', 'Priority Support', 'Daily Allowance']
  },
  {
    id: 'shield-max',
    name: 'Shield Max',
    weeklyPremium: 199,
    coverageAmount: 25000,
    weeklyPayoutCap: 5000,
    features: ['All Risks Coverage', 'Full Multi-Platform Support', 'Max Income Protection', 'Emergency Medical Cash']
  }
];

// Helper to get plan by ID
export const getPlanById = (id: string) => PLANS.find(p => p.id === id) || PLANS[0];

/**
 * Calculated Dynamic Premium based on Financial Model v2 logic
 */
export function getDynamicPremium(
  planId: string,
  shieldScore: number = 75,
  cityTier: string = 'Tier 3',
  seasonLabel: string = 'Standard'
): number {
  const plan = getPlanById(planId);
  const base = plan.weeklyPremium;

  // 1. Season Multiplier
  let seasonMult = 1.0;
  if (seasonLabel === 'Monsoon') seasonMult = 1.4;
  else if (seasonLabel === 'Winter (Smog)') seasonMult = 1.2;
  else if (seasonLabel === 'Peak') seasonMult = 1.15;

  // 2. Tier Multiplier
  let tierMult = 1.0;
  if (cityTier === 'Tier 1') tierMult = 1.25;
  else if (cityTier === 'Tier 2') tierMult = 1.1;
  else if (cityTier === 'Tier 3') tierMult = 1.0;
  else tierMult = 0.85; // Tier 4 / Rural

  // 3. Shield Score Discount (Behavioral)
  // 100 score = 10% discount, 50 score = 5% penalty
  const discountFactor = (shieldScore - 75) / 250; // -0.1 to +0.1
  const behavioralMult = 1 - discountFactor;

  const final = base * seasonMult * tierMult * behavioralMult;
  return Math.round(final);
}

/**
 * Payout Calculation Logic
 */
export function calculatePayout(
  cap: number,
  dcsScore: number,
  severity: 'low' | 'medium' | 'high' = 'medium'
): number {
  const factor = dcsScore / 100;
  const severityMult = severity === 'high' ? 1.2 : severity === 'low' ? 0.8 : 1.0;
  return Math.min(cap, Math.round(cap * factor * severityMult));
}
