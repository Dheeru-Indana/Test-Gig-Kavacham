import { TriggerEvent } from './triggerEngine';
import { computeFraudScore, type FraudResult } from '../../services/fraud/fraudEngine';
import { generateFraudSignals } from '../../services/fraud/fraudSignalGenerator';

export interface ClaimPolicyData {
  policyId: string;
  status: string;
  coverage: number; // Max coverage payout defined in plan
  weeklyCap: number; // Maximum limit
}

export interface ClaimOutput {
  status: 'APPROVED' | 'FLAGGED' | 'REJECTED';
  payoutAmount: number;
  fraudScore: number;
  fraudPassed: boolean;
  explanation: string;
  fraudResult?: FraudResult; // Full AI-assisted fraud breakdown
}

export function processZeroTouchClaim(
  trigger: TriggerEvent,
  policy: ClaimPolicyData,
  declaredDailyIncome: number,
  disruptionHours: number
): ClaimOutput {
  // 1. Validate Eligibility
  if (policy.status !== 'active') {
    return {
      status: 'REJECTED',
      payoutAmount: 0,
      fraudScore: 0,
      fraudPassed: false,
      explanation: "Policy was not active at the time of the event."
    };
  }

  // 2. AI-Assisted Fraud Check (via fraudEngine)
  // Generate signals based on the trigger context
  // For normal claims we use 'clean' profile; the admin simulation
  // can override this with 'suspicious' or 'fraudulent'
  const signals = generateFraudSignals('clean', trigger.zone || 'default', new Date().getMonth() + 1);
  const fraudResult = computeFraudScore(signals);

  const fraudPassed = fraudResult.decision === 'pass';
  const finalFraudScore = fraudResult.fraudScore / 100; // Normalize to 0-1 for backward compatibility

  if (fraudResult.decision === 'fail') {
    return {
      status: 'REJECTED',
      payoutAmount: 0,
      fraudScore: finalFraudScore,
      fraudPassed: false,
      explanation: fraudResult.explanation,
      fraudResult,
    };
  }

  if (fraudResult.decision === 'review') {
    return {
      status: 'FLAGGED',
      payoutAmount: 0,
      fraudScore: finalFraudScore,
      fraudPassed: false,
      explanation: fraudResult.explanation,
      fraudResult,
    };
  }

  // 3. Calculate Payout
  // payout = min(declared_daily_income * disruption_hours, weekly_cap)
  // To avoid exploiting, we ensure it doesn't exceed policy max coverage.
  let amount = declaredDailyIncome * disruptionHours;
  amount = Math.min(amount, policy.weeklyCap);
  amount = Math.min(amount, policy.coverage_amount || policy.coverageAmount || 0);

  return {
    status: 'APPROVED',
    payoutAmount: Math.round(amount),
    fraudScore: finalFraudScore,
    fraudPassed: true,
    explanation: `Zero-touch trigger approved via ${trigger.triggerType} oracle cascade. ${fraudResult.explanation} Directing ₹${Math.round(amount)} to worker UPI.`,
    fraudResult,
  };
}
