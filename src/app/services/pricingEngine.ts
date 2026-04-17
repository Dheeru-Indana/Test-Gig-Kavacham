export interface PricingInput {
  basePrice: number;
  riskScore: number; // 0.0 to 1.0 (from riskEngine)
  floodRiskScore: number;
  aqiAvg: number;
  disruptionHistory: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface PricingOutput {
  premium: number;
  breakdown: {
    basePrice: number;
    factors: {
      rule: string;
      amount: number;
      type: 'increase' | 'discount';
    }[];
  };
  explanation: string;
}

export function calculatePremium(input: PricingInput): PricingOutput {
  const MINIMUM_PREMIUM = 30;

  // BASE FORMULA: premium = base_price * (1 + risk_score * 0.5)
  const riskAdjustmentRatio = input.riskScore * 0.5;
  let riskAdjustmentValue = input.basePrice * riskAdjustmentRatio;
  
  let intermediatePremium = input.basePrice + riskAdjustmentValue;

  const factors: { rule: string; amount: number; type: 'increase' | 'discount' }[] = [];
  let totalDiscounts = 0;

  // Add precise positive triggers (increase)
  if (riskAdjustmentValue > 0) {
    // If rainfall > 20, blame rain risk, else traffic
    if (input.riskScore > 0.6) {
      factors.push({ rule: 'Rain risk', amount: Math.round(riskAdjustmentValue), type: 'increase' });
    } else {
      factors.push({ rule: 'High traffic density', amount: Math.round(riskAdjustmentValue), type: 'increase' });
    }
  }

  // HYPER-LOCAL DISCOUNTS
  if (input.floodRiskScore < 0.2) {
    factors.push({ rule: 'Safe operating zone', amount: 2, type: 'discount' });
    totalDiscounts += 2;
  }

  if (input.aqiAvg < 100) {
    factors.push({ rule: 'Clean Air Index', amount: 1, type: 'discount' });
    totalDiscounts += 1;
  }

  if (input.disruptionHistory === 'LOW') {
    factors.push({ rule: 'Good delivery history', amount: 2, type: 'discount' });
    totalDiscounts += 2;
  }

  // Calculate final premium ensuring threshold
  let finalPremium = intermediatePremium - totalDiscounts;
  if (finalPremium < MINIMUM_PREMIUM) {
    finalPremium = MINIMUM_PREMIUM;
  }

  // Generate an explanation string
  const activeDiscounts = factors.filter(f => f.type === 'discount').map(d => d.rule.toLowerCase());
  let explanation = '';
  
  if (activeDiscounts.length > 0) {
    if (activeDiscounts.length === 1) {
      explanation = `Your premium is lower due to ${activeDiscounts[0]}.`;
    } else {
      const last = activeDiscounts.pop();
      explanation = `Your premium is lower due to ${activeDiscounts.join(', ')} and ${last}.`;
    }
  } else {
    explanation = "Your premium reflects standard base pricing adjusted real-time for current zone risk.";
  }

  return {
    premium: Math.round(finalPremium),
    breakdown: {
      basePrice: input.basePrice,
      factors,
    },
    explanation,
  };
}
