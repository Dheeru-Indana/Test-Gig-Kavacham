export const INTENT_KNOWLEDGE = [
  {
    intent: 'policy_coverage',
    tags: ['cover', 'coverage', 'covered', 'protect', 'policy',
           'what does', 'include', 'benefit', 'insure', 'shield',
           'what is included', 'protection', 'my plan'],
    response: (ctx: any) =>
      `Your ${ctx.planName || 'GigKavacham'} policy provides
       parametric income protection — meaning you receive an
       automatic payout when disruption signals in your zone
       cross the threshold, with no claim form required.

       What is covered:
       • Income loss from rainfall disruptions (DCS trigger)
       • Air quality index (AQI) spike events
       • Extreme heat work-stoppage events
       • Significant order volume drops on your platform
       • Social disruption events like curfews or strikes

       Your weekly payout cap is
       ₹${ctx.weeklyPayoutCap || '3,000'} and your total
       coverage is ₹${ctx.coverageAmount || '1,00,000'}.

       Payouts go directly to your UPI:
       ${ctx.upiId || 'your registered UPI ID'}.`,
  },
  {
    intent: 'policy_exclusions',
    tags: ['exclude', 'exclusion', 'not covered', 'not include',
           'outside', 'wont pay', 'denied', 'rejected', 'no cover',
           'what is not', 'exception'],
    response: () =>
      `GigKavacham does NOT cover the following situations:

       • Vehicle repairs or fuel costs
       • Health claims or medical expenses
       • Platform algorithm changes (e.g. fewer orders assigned)
       • Income loss outside your registered zone
       • Events that occurred before your policy activation date
       • Late manual claims submitted after an event window closes
       • Losses due to your own platform deactivation or rating drop

       All payouts are parametric — they are based on measurable
       disruption signals, not on your personal claim submissions.
       If a trigger event fires in your zone and you have an
       active policy, the payout happens automatically.`,
  },
  {
    intent: 'policy_cancel',
    tags: ['cancel', 'stop policy', 'end policy', 'deactivate',
           'remove plan', 'quit', 'discontinue', 'pause',
           'terminate', 'no longer want'],
    response: (ctx: any) =>
      `To cancel your ${ctx.planName || 'current'} policy:

       1. Go to Policy Management in your dashboard
       2. Click "Cancel Policy"
       3. A confirmation modal will appear — read it carefully
       4. Confirm cancellation

       Important things to know before cancelling:
       • Cancellation takes effect immediately
       • No refund is issued for the current week's premium
       • You will lose protection against all disruption events
       • If a DCS trigger fires after cancellation, you will NOT
         receive a payout
       • You can reactivate a new policy at any time

       If you want to reduce costs instead, consider switching to
       Shield Lite at ₹49/week rather than cancelling entirely.`,
  },
  {
    intent: 'policy_switch',
    tags: ['switch', 'change plan', 'upgrade', 'downgrade',
           'different plan', 'move to', 'shield lite', 'shield plus',
           'shield max', 'better plan', 'new plan', 'modify plan'],
    response: (ctx: any) =>
      `You can switch your plan at any time from Policy Management.

       Available plans:

       Shield Lite — ₹49/week
       • Coverage: ₹50,000 | Weekly payout cap: ₹1,500
       • Best for: Grocery riders, domestic workers, Tier 3/4
       • Covers: Rainfall, AQI, weekly income protection

       Shield Plus — ₹99/week (Recommended)
       • Coverage: ₹1,00,000 | Weekly payout cap: ₹3,000
       • Best for: Delivery partners, gig drivers, Tier 1/2
       • Covers: All Lite features + heat stress + order anomaly

       Shield Max — ₹179/week
       • Coverage: ₹2,00,000 | Weekly payout cap: ₹5,000
       • Best for: Construction workers, high-risk platforms
       • Covers: All Plus features + social disruption + legal aid

       You are currently on: ${ctx.planName || 'no active plan'}.
       Switching cancels your current plan and activates the new
       one immediately.`,
  },
  {
    intent: 'premium_why',
    tags: ['why premium', 'why price', 'premium high', 'premium low',
           'how much', 'cost', 'charge', 'pricing', 'expensive',
           'calculated', 'determine', 'my rate', 'weekly cost'],
    response: (ctx: any) =>
      `Your weekly premium of ₹${ctx.weeklyPremium || '--'} is
       calculated using GigKavacham's dynamic pricing engine
       which considers multiple risk and profile factors:

       Your Profile Factors:
       • City Tier: ${ctx.cityTier || 'Tier 1'}
         (higher tiers = higher coverage potential = higher premium)
       • Platform Type: ${ctx.platformType || 'Delivery Partner'}
       • Shield Score: ${ctx.shieldScore || 75}/100
         (higher score = small discount applied)
       • Declared Weekly Earnings: ₹${ctx.weeklyEarnings || '--'}

       Zone Risk Factors:
       • AQI Risk, Flood Risk, Heat Risk in your registered zone
       • Historical disruption frequency in your area

       Seasonal Factors:
       • Monsoon months (June–September) carry a +₹4 seasonal load
       • Peak disruption hours increase real-time DCS but not premium

       The formula: Base Rate × Zone Risk × Season ×
       Shield Discount × Tier Factor

       To reduce your premium: maintain Shield Score above 80,
       switch to Shield Lite, or re-register in a lower-risk zone.`,
  },
  {
    intent: 'premium_reduce',
    tags: ['reduce premium', 'lower cost', 'cheaper', 'discount',
           'save money', 'less premium', 'affordable', 'too expensive',
           'reduce my', 'cut cost'],
    response: () =>
      `There are several ways to reduce your weekly premium:

       1. Improve your Shield Score (currently affects pricing)
          — Maintain consistent platform activity
          — Avoid anomalous claim patterns
          — Score above 80 unlocks a small discount

       2. Switch to Shield Lite at ₹49/week
          — Lower coverage but still covers major disruption events
          — Best if you are in a Tier 3 or Tier 4 zone

       3. Seasonal timing
          — Premiums are lower outside monsoon months
          — Consider the July–September surge when budgeting

       4. Zone registration
          — Workers in lower flood/AQI risk zones pay less
          — If you have moved, update your city and pincode in Settings

       Note: GigKavacham does not offer arbitrary discounts.
       All pricing adjustments are based on real risk data.`,
  },
  {
    intent: 'payout_why',
    tags: ['why paid', 'why payout', 'received payment', 'got money',
           'credited', 'payment reason', 'transfer', 'got paid',
           'money received', 'what triggered'],
    response: (ctx: any) =>
      `You received a payout because a disruption trigger event
       fired in your registered zone while your policy was ACTIVE.

       Here is how it happened step by step:
       1. GigKavacham monitored 5 disruption signals in your zone
       2. The Disruption Composite Score (DCS) crossed 70/100
       3. Your active ${ctx.planName || 'policy'} was verified
       4. A fraud check was run — your claim passed automatically
       5. ₹${ctx.lastPayoutAmount || '--'} was sent to
          ${ctx.upiId || 'your UPI'}

       Reason: ${ctx.lastPayoutReason ||
         'A disruption event was detected in your zone.'}

       This is the zero-touch parametric insurance pipeline.
       You did not need to submit any claim form.`,
  },
  {
    intent: 'payout_when',
    tags: ['when paid', 'how long', 'payout time', 'wait',
           'pending', 'processing', 'settlement', 'receive money',
           'how soon', 'how fast', 'upi transfer'],
    response: () =>
      `GigKavacham targets payout within 5 minutes of the
       trigger event being confirmed. Here is the timeline:

       Minute 0 — DCS crosses 70 in your zone
       Minute 1 — Policy eligibility verified
       Minute 1–2 — Fraud check runs automatically
       Minute 2–5 — UPI payout initiated
       Minute 5 — Payment credited to your UPI

       Exceptions:
       • If fraud check flags your claim: up to 30 minutes
       • If UPI is incorrect or network fails: up to 3 auto-retries
       • During very high disruption events (many workers affected):
         pipeline may take up to 15 minutes

       You will receive a notification at each stage.
       Check your Notifications panel for live status updates.`,
  },
  {
    intent: 'payout_failed',
    tags: ['failed payout', 'not received', 'payment failed',
           'upi failed', 'retry', 'missing payment',
           'where is money', 'not credited', 'payout error'],
    response: (ctx: any) =>
      `If your payout failed, here are the most common reasons
       and what you can do:

       1. Incorrect UPI ID
          Your current UPI: ${ctx.upiId || 'not set'}
          → Go to Settings → Financial → Update your UPI ID
          → Failed payouts with wrong UPI are NOT auto-retried
            to a different UPI — update first, then contact support

       2. UPI Network Issue
          → GigKavacham retries automatically 3 times
          → If all retries fail, the amount is held for 48 hours
          → Update your UPI in Settings to trigger a manual retry

       3. Bank downtime
          → Some banks have maintenance windows (typically 1–3am)
          → Payouts retry after the window closes

       If your payout has been pending for more than 2 hours,
       contact support with your claim ID from the Claims History.`,
  },
  {
    intent: 'dcs_what',
    tags: ['dcs', 'disruption score', 'composite score',
           'what is dcs', 'score mean', 'disruption composite',
           'risk score', 'explain dcs', 'how dcs works'],
    response: (ctx: any) =>
      `The Disruption Composite Score (DCS) is GigKavacham's
       core risk intelligence metric. It combines 5 real-time
       signals to measure how disrupted your work zone is.

       DCS Formula:
       DCS = Rainfall(30%) + AQI(25%) + Heat(20%) +
             Order Drop(15%) + Social Disruption(10%)

       What the score means:
       • 0–49: Safe Zone — no disruption expected
       • 50–69: Elevated Risk — conditions worsening
       • 70–100: Payout Trigger Zone — automatic payout fires

       Your current DCS: ${ctx.currentDcs || '--'}/100
       Risk Status: ${ctx.riskLabel || 'Loading...'}
       12h Forecast: ${
         ctx.disruptionProbability
           ? Math.round(ctx.disruptionProbability * 100) + '% disruption probability'
           : 'Calculating...'
       }

       ${ctx.forecastExplanation || ''}

       The DCS updates every 30 seconds on your dashboard.
       When it crosses 70, all active policyholders in your
       zone receive an automatic payout within 5 minutes.`,
  },
  {
    intent: 'dcs_high_risk',
    tags: ['high risk', 'zone risk', 'dangerous zone', 'risky',
           'alert', 'warning', 'elevated', 'trigger zone',
           'my zone', 'zone status'],
    response: (ctx: any) =>
      `Your zone is currently showing:
       Status: ${ctx.riskLabel || 'Elevated Risk'}
       DCS: ${ctx.currentDcs || '--'}/100
       Disruption Probability (12h): ${
         ctx.disruptionProbability
           ? Math.round(ctx.disruptionProbability * 100) + '%'
           : '--'
       }

       ${ctx.forecastExplanation || ''}

       What this means for you:
       ${(ctx.currentDcs || 0) >= 70
         ? '⚠️ Your zone is in TRIGGER ZONE. If you have an ACTIVE policy, a payout is being processed.'
         : (ctx.currentDcs || 0) >= 50
         ? '⚡ Your zone is ELEVATED. Conditions are worsening. Stay alert.'
         : '✅ Your zone is SAFE. No disruption events expected currently.'
       }

       Make sure your policy is ACTIVE and your UPI ID is
       correct to receive automatic payouts when DCS crosses 70.`,
  },
  {
    intent: 'shield_score',
    tags: ['shield score', 'trust score', 'my score', 'what is shield',
           'score 75', 'reputation', 'loyalty', 'improve score',
           'how to increase'],
    response: (ctx: any) =>
      `Your Shield Score is ${ctx.shieldScore || 75}/100.

       What it is:
       The Shield Score is GigKavacham's worker trust and
       consistency metric. It starts at 75 for all new workers.

       What it affects:
       • Premium pricing — higher score = small premium discount
       • Fraud clearance speed — score above 80 = priority clearance
       • Future plan eligibility — high score unlocks premium tiers

       How to improve it:
       • Maintain consistent platform activity (log deliveries regularly)
       • Do not have anomalous claim patterns (multiple claims in
         short windows from mismatched locations)
       • Keep your profile complete and UPI verified
       • Renew policies on time without gaps

       How it decreases:
       • Flagged fraud attempts
       • Inconsistent GPS zone data during claim events
       • Long inactivity gaps on your delivery platform`,
  },
  {
    intent: 'city_tier',
    tags: ['city tier', 'tier 1', 'tier 2', 'tier 3', 'tier 4',
           'what tier', 'my tier', 'zone classification', 'rural',
           'metro', 'classification'],
    response: (ctx: any) =>
      `You are classified as ${ctx.cityTier || 'Tier 1'}.

       GigKavacham uses a 4-tier city classification system
       based on your registered pincode:

       Tier 1 (Metro) — Mumbai, Delhi, Bangalore, Chennai
       • Highest coverage caps
       • Higher base premium due to higher risk density
       • Fastest payout processing

       Tier 2 (Large Cities) — Pune, Jaipur, Lucknow, Surat
       • Moderate coverage caps
       • Medium premium

       Tier 3 (Mid Cities) — Patna, Indore, Coimbatore, Agra
       • Standard coverage
       • Lower premium, higher zone risk amplifier

       Tier 4 / Rural — All other pincodes
       • Basic coverage
       • Lowest premium but highest weather-related risk

       Your tier affects: base premium, payout cap,
       and how zone risk is amplified in the DCS formula.
       To update your tier, update your pincode in Settings.`,
  },
  {
    intent: 'fraud_flagged',
    tags: ['flagged', 'fraud', 'suspicious', 'blocked', 'held',
           'under review', 'rejected claim', 'why review',
           'fraud check', 'how fraud works', 'anomaly'],
    response: () =>
      `GigKavacham uses an automated fraud detection engine
       that runs on every claim before payout is released.

       What the fraud engine checks:
       1. GPS Zone Consistency — Was your device in your
          registered zone when the disruption occurred?
       2. Platform Activity Alignment — Were you actually
          active on your delivery platform at that time?
       3. Payout Frequency — Are you claiming unusually often
          compared to zone-wide patterns?
       4. Duplicate Event Claims — Did you claim for the same
          event more than once?
       5. Network/Device Anomalies — Suspicious IP or device
          switching patterns

       Fraud Score Thresholds:
       • Below 30 — Auto-pass, payout released immediately
       • 30–60 — Manual review, payout within 30 minutes
       • Above 60 — Claim rejected, explanation provided

       If your claim is flagged:
       → You will receive a notification with the reason
       → Reviews complete within 30 minutes
       → If rejected unfairly, contact support with your claim ID
       → Your Shield Score may be affected by repeated flags`,
  },
  {
    intent: 'platform_how',
    tags: ['how does it work', 'explain', 'gigkavacham', 'platform',
           'how this works', 'what is this', 'tell me about',
           'parametric', 'how insurance works'],
    response: () =>
      `GigKavacham is a parametric income insurance platform
       built specifically for gig workers in India.

       Traditional insurance: You file a claim → wait days/weeks
       → manual review → uncertain payout.

       GigKavacham: Trigger fires → Policy checked → Fraud verified
       → UPI payout in under 5 minutes. Zero action from you.

       How it works:
       1. You register and choose a weekly plan (₹49–₹179/week)
       2. GigKavacham monitors 5 disruption signals in your zone
          every 30 minutes (rainfall, AQI, heat, orders, social)
       3. These signals are combined into the DCS (0–100)
       4. When DCS crosses 70 in your zone:
          — Your active policy is verified
          — Fraud check runs automatically
          — UPI payout is released within 5 minutes
       5. You receive a notification at every step

       No claim forms. No waiting. No manual review for most cases.
       This is zero-touch parametric insurance.`,
  },
  {
    intent: 'platform_trigger',
    tags: ['trigger', 'what triggers', 'activate payout',
           'when do i get paid', 'automatic', 'zero touch',
           'how payout works', 'payout trigger', 'event fires'],
    response: () =>
      `A payout is triggered automatically through this pipeline:

       Step 1 — Signal Monitoring
       GigKavacham monitors your zone every 30 minutes:
       Rainfall intensity, AQI levels, heat stress,
       order volume drop, social disruption signals

       Step 2 — DCS Computation
       All 5 signals are combined into the Disruption
       Composite Score using weighted formula:
       DCS = R(30%) + AQI(25%) + H(20%) + O(15%) + S(10%)

       Step 3 — Threshold Check
       If DCS ≥ 70 → Trigger fires for your zone

       Step 4 — Policy Verification
       Your policy must be: ACTIVE, not PAUSED or CANCELLED
       Your zone must match the disruption zone

       Step 5 — Fraud Check (Automated)
       GPS check, activity check, frequency check
       Most claims pass in under 60 seconds

       Step 6 — UPI Payout
       Amount up to your weekly payout cap is credited
       directly to your registered UPI ID

       Total time: Under 5 minutes for most claims.`,
  },
];
