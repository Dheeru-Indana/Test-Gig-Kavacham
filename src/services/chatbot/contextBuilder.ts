import { supabase } from '../../app/lib/supabaseClient';

export const buildChatContext = async (userId: string) => {
  try {
    const [profileRes, policyRes, payoutRes] = await Promise.all([
      supabase.from('profiles').select('*')
        .eq('id', userId).single(),
      supabase.from('policies').select('*')
        .eq('user_id', userId).eq('status', 'ACTIVE')
        .order('created_at', { ascending: false })
        .limit(1).maybeSingle(),
      supabase.from('payouts').select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1).maybeSingle(),
    ])

    const profile = profileRes.data
    const policy = policyRes.data
    const lastPayout = payoutRes.data

    return {
      fullName: profile?.full_name,
      cityTier: profile?.city_tier,
      platformType: profile?.platform_type,
      shieldScore: profile?.shield_score,
      upiId: profile?.upi_id,
      city: profile?.city,
      planName: policy?.plan_name,
      weeklyPremium: policy?.premium, // Fixed to premium
      coverageAmount: policy?.coverage_amount || policy?.coverageAmount, // Standardized field
      lastPayoutAmount: lastPayout?.amount,
      lastPayoutReason: lastPayout?.reason,
      // DCS context will be injected from the DCS engine below
      currentDcs: null,
      riskLabel: null,
      disruptionProbability: null,
      forecastExplanation: null,
    }
  } catch {
    return {}
  }
};
