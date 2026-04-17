import { supabase } from '@/app/lib/supabaseClient'

// If seed keeps failing run this in Supabase SQL Editor:
// alter table payouts enable row level security;
// drop policy if exists "Users can insert own payouts" on payouts;
// create policy "Users can insert own payouts"
//   on payouts for insert with check (auth.uid() = user_id);
// drop policy if exists "Users can insert own claims" on claims;
// create policy "Users can insert own claims"
//   on claims for insert with check (auth.uid() = user_id);
// drop policy if exists "Users can insert own notifications" on notifications;
// create policy "Users can insert own notifications"
//   on notifications for insert with check (auth.uid() = user_id);

export const DEMO_EMAIL = 'test@gig.com'

export const seedDemoAccount = async (
  userId: string,
  userEmail: string
) => {
  console.log('[Seed] Called for:', userEmail)

  if (userEmail !== DEMO_EMAIL) {
    console.log('[Seed] Not demo account. Skipping.')
    return
  }

  console.log('[Seed] Demo account confirmed. Checking existing data...')

  const { count, error: countError } = await supabase
    .from('payouts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (countError) {
    console.error('[Seed] Count check failed:', countError)
  }

  console.log('[Seed] Existing payout count:', count)

  if (count && count > 0) {
    console.log('[Seed] Already seeded. Skipping.')
    return
  }

  const now = Date.now()

  // INSERT PAYOUTS
  console.log('[Seed] Inserting payouts...')
  const { error: p1 } = await supabase.from('payouts').insert({
    user_id: userId,
    amount: 1500,
    status: 'credited',
    reason: 'Extreme Heat Trigger — Zone A (DCS: 82)',
    upi_id: 'demo@upi',
    payout_method: 'UPI',
    settlement_duration_minutes: 3,
    fraud_status: 'cleared',
    created_at: new Date(now - 3 * 86400000).toISOString(),
  })
  if (p1) console.error('[Seed] Payout 1 failed:', p1)
  else console.log('[Seed] Payout 1 inserted')

  const { error: p2 } = await supabase.from('payouts').insert({
    user_id: userId,
    amount: 1200,
    status: 'credited',
    reason: 'Rainfall Trigger — Zone A (DCS: 78)',
    upi_id: 'demo@upi',
    payout_method: 'UPI',
    settlement_duration_minutes: 4,
    fraud_status: 'cleared',
    created_at: new Date(now - 8 * 86400000).toISOString(),
  })
  if (p2) console.error('[Seed] Payout 2 failed:', p2)
  else console.log('[Seed] Payout 2 inserted')

  const { error: p3 } = await supabase.from('payouts').insert({
    user_id: userId,
    amount: 900,
    status: 'credited',
    reason: 'AQI Spike Trigger — Zone B (DCS: 74)',
    upi_id: 'demo@upi',
    payout_method: 'UPI',
    settlement_duration_minutes: 6,
    fraud_status: 'cleared',
    created_at: new Date(now - 15 * 86400000).toISOString(),
  })
  if (p3) console.error('[Seed] Payout 3 failed:', p3)
  else console.log('[Seed] Payout 3 inserted')

  const { error: p4 } = await supabase.from('payouts').insert({
    user_id: userId,
    amount: 600,
    status: 'pending',
    reason: 'Order Demand Anomaly — Zone C (DCS: 71)',
    upi_id: 'demo@upi',
    payout_method: 'UPI',
    settlement_duration_minutes: null,
    fraud_status: 'cleared',
    created_at: new Date(now - 86400000).toISOString(),
  })
  if (p4) console.error('[Seed] Payout 4 failed:', p4)
  else console.log('[Seed] Payout 4 inserted')

  const { error: p5 } = await supabase.from('payouts').insert({
    user_id: userId,
    amount: 800,
    status: 'failed',
    reason: 'Rainfall Trigger — Zone A (DCS: 73)',
    upi_id: 'demo@upi',
    payout_method: 'UPI',
    settlement_duration_minutes: null,
    fraud_status: 'cleared',
    created_at: new Date(now - 22 * 86400000).toISOString(),
  })
  if (p5) console.error('[Seed] Payout 5 failed:', p5)
  else console.log('[Seed] Payout 5 inserted')

  // INSERT CLAIMS
  console.log('[Seed] Inserting claims...')
  const { error: c1 } = await supabase.from('claims').insert({
    user_id: userId,
    status: 'paid',
    trigger_type: 'Extreme Heat',
    dcs_score: 82,
    amount: 1500,
    zone: 'Zone A',
    fraud_score: 5,
    fraud_decision: 'pass',
    created_at: new Date(now - 3 * 86400000).toISOString(),
  })
  if (c1) console.error('[Seed] Claim 1 failed:', c1)
  else console.log('[Seed] Claim 1 inserted')

  const { error: c2 } = await supabase.from('claims').insert({
    user_id: userId,
    status: 'paid',
    trigger_type: 'Rainfall Threshold',
    dcs_score: 78,
    amount: 1200,
    zone: 'Zone A',
    fraud_score: 12,
    fraud_decision: 'pass',
    created_at: new Date(now - 8 * 86400000).toISOString(),
  })
  if (c2) console.error('[Seed] Claim 2 failed:', c2)
  else console.log('[Seed] Claim 2 inserted')

  const { error: c3 } = await supabase.from('claims').insert({
    user_id: userId,
    status: 'paid',
    trigger_type: 'AQI Spike',
    dcs_score: 74,
    amount: 900,
    zone: 'Zone B',
    fraud_score: 8,
    fraud_decision: 'pass',
    created_at: new Date(now - 15 * 86400000).toISOString(),
  })
  if (c3) console.error('[Seed] Claim 3 failed:', c3)
  else console.log('[Seed] Claim 3 inserted')

  const { error: c4 } = await supabase.from('claims').insert({
    user_id: userId,
    status: 'processing',
    trigger_type: 'Order Demand Anomaly',
    dcs_score: 71,
    amount: 600,
    zone: 'Zone C',
    fraud_score: 22,
    fraud_decision: 'pass',
    created_at: new Date(now - 86400000).toISOString(),
  })
  if (c4) console.error('[Seed] Claim 4 failed:', c4)
  else console.log('[Seed] Claim 4 inserted')

  const { error: c5 } = await supabase.from('claims').insert({
    user_id: userId,
    status: 'failed',
    trigger_type: 'Rainfall Threshold',
    dcs_score: 73,
    amount: 800,
    zone: 'Zone A',
    fraud_score: 45,
    fraud_decision: 'review',
    created_at: new Date(now - 22 * 86400000).toISOString(),
  })
  if (c5) console.error('[Seed] Claim 5 failed:', c5)
  else console.log('[Seed] Claim 5 inserted')

  // INSERT NOTIFICATIONS
  console.log('[Seed] Inserting notifications...')
  await supabase.from('notifications').insert([
    {
      user_id: userId,
      type: 'payout_credited',
      title: '💰 Payout Credited',
      message: '₹1,500 credited for extreme heat event in Zone A. DCS: 82. Settlement: 3 minutes.',
      read: false,
      created_at: new Date(now - 3 * 86400000).toISOString(),
    },
    {
      user_id: userId,
      type: 'dcs_alert',
      title: '⚠️ DCS Alert — Trigger Zone',
      message: 'Zone A DCS crossed 82. Claim processed automatically in 3 minutes.',
      read: false,
      created_at: new Date(now - 3 * 86400000 - 300000).toISOString(),
    },
    {
      user_id: userId,
      type: 'payout_credited',
      title: '💰 Payout Credited',
      message: '₹1,200 credited for rainfall trigger in Zone A. DCS: 78. Settlement: 4 minutes.',
      read: true,
      created_at: new Date(now - 8 * 86400000).toISOString(),
    },
    {
      user_id: userId,
      type: 'payout_pending',
      title: '⏳ Payout Processing',
      message: '₹600 being processed for order demand anomaly in Zone C. Expected within 30 minutes.',
      read: false,
      created_at: new Date(now - 86400000).toISOString(),
    },
    {
      user_id: userId,
      type: 'policy_active',
      title: '🛡️ Shield Activated',
      message: 'Your GigKavacham shield is active. You are protected against disruption events.',
      read: true,
      created_at: new Date(now - 30 * 86400000).toISOString(),
    },
  ])
  console.log('[Seed] All demo data inserted successfully')
}
