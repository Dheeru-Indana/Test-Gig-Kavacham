import { PLANS } from '../../constants/plans'
import { DcsOutput } from '../dcs/dcsEngine'

export interface PlanRecommendation {
  recommendedPlan: typeof PLANS[0]
  reason: string
  urgency: 'normal' | 'elevated' | 'urgent'
  dynamicPremium: number
  baseMultiplier: number
}

export const getRecommendedPlan = (
  dcsOutput: DcsOutput | null,
  cityTier: string,
  shieldScore: number
): PlanRecommendation => {

  let planIndex = 1  // Default: Shield Plus
  let urgency: 'normal' | 'elevated' | 'urgent' = 'normal'
  let reason = ''
  let baseMultiplier = 1.0

  const dcs = dcsOutput?.currentDcs || 0

  if (dcs >= 70) {
    // Trigger zone — recommend Shield Max
    planIndex = 2
    urgency = 'urgent'
    baseMultiplier = 1.15
    reason = `⚠️ Your zone DCS is ${dcs}/100 — TRIGGER ZONE. Shield Max is strongly recommended for maximum payout protection (₹5,000/week cap) during this high-risk period.`
  } else if (dcs >= 50) {
    // Elevated — recommend Shield Plus minimum
    planIndex = Math.max(planIndex, 1)
    urgency = 'elevated'
    baseMultiplier = 1.08
    reason = `Your zone DCS is ${dcs}/100 — Elevated Risk. Shield Plus or higher is recommended for adequate protection during this period.`
  } else {
    // Safe zone
    if (cityTier === 'Tier 3' || cityTier === 'Tier 4 / Rural') {
      planIndex = 0  // Shield Lite sufficient
      reason = `Your zone is currently safe (DCS: ${dcs}/100) and your city tier is ${cityTier}. Shield Lite provides sufficient coverage at the lowest cost.`
    } else {
      planIndex = 1  // Shield Plus for metro
      reason = `Your zone is safe (DCS: ${dcs}/100). Shield Plus is recommended for your city tier with a good balance of cost and coverage.`
    }
  }

  // Shield score discount
  const shieldDiscount = shieldScore > 80 ? 0.95 : 1.0
  const basePlan = PLANS[planIndex]
  const dynamicPremium = Math.round(
    basePlan.weeklyPremium * baseMultiplier * shieldDiscount
  )

  return {
    recommendedPlan: basePlan,
    reason,
    urgency,
    dynamicPremium,
    baseMultiplier,
  }
}
