# ================================================================================
GIGKAVACHAM
Parametric Income Insurance for Gig Workers
When work stops, income should not.

Live Demo    : https://gig-kavacham.vercel.app
Admin Portal : https://gig-kavacham.vercel.app/admin/login
Demo Account : test@gig.com / 123456

-----

## THE PROBLEM

India has over 12 million gig workers — delivery partners, grocery riders,
factory workers, domestic workers, and last-mile logistics workers — who earn
per delivery and per shift. When a monsoon hits, an AQI alert fires, or a local
curfew is declared, these workers lose 20 to 30 percent of their monthly income
overnight with zero recourse.

Ravi, a Swiggy rider in Chennai, loses Rs 3,200 every Northeast Monsoon season.
He cannot afford annual insurance. He does not trust complex claim processes. He
just needs someone to notice when the city stops and pay him before he even asks.

Traditional insurance fails gig workers because:

- Claim submission requires documentation they do not have
- Manual review takes days to weeks
- Payout is uncertain and often disputed
- Premiums are not calibrated for short-term daily income risk
- No product addresses disruption-linked income loss

-----

## THE SOLUTION

GigKavacham is a full-stack parametric income insurance platform built
specifically for gig workers across India.

Instead of a claim process, GigKavacham uses a zero-touch automated pipeline:

```
Trigger  -->  Policy Check  -->  Fraud Verification  -->  UPI Payout
```

Workers pay a small weekly premium. When disruption signals in their registered
zone cross the threshold, a payout is released automatically in under 5 minutes
with no action required from the worker.

-----

## IMPLEMENTATION STATUS

## Feature                   Status         Implementation

DCS computation           Live           Weighted rule-based formula (TypeScript)
DCS forecast              Live           Signal-threshold delta calculation
Disruption probability    Live           Piecewise function of current DCS
Premium pricing           Live           Rule-based plan adjustments
Plan recommendation       Live           DCS-threshold if/else logic
Chatbot                   Live           Weighted intent classifier (TypeScript)
Fraud detection           Simulated      Threshold scores in demo seed data
ML pricing model          Phase 3        XGBoost architecture ready, not trained
ML DCS forecasting        Phase 3        Prophet + XGBoost architecture ready
ML fraud model            Phase 3        Isolation Forest architecture ready
RAG chatbot               Phase 3        LLM integration architecture designed

-----

## THE DISRUPTION COMPOSITE SCORE (DCS)

The Disruption Composite Score is the core operational risk value that drives
all payout decisions. It is computed every 30 seconds in the browser from five
simulated real-time signals. Exact formula from src/services/dcs/dcsEngine.ts:

```
DCS_base = R x 0.30 + A x 0.25 + H x 0.20 + O x 0.15 + S x 0.10
```

All inputs are normalised to [0, 1]:

```
R  =  Rainfall intensity score      Weight: 0.30
A  =  Air Quality Index score       Weight: 0.25
H  =  Extreme heat stress score     Weight: 0.20
O  =  Order volume drop score       Weight: 0.15
S  =  Social disruption score       Weight: 0.10
```

LIVE DCS WITH MULTIPLIERS

```
DCS_final = min( round( DCS_base x M_season x M_hour x M_tier x 100 ), 100 )
```

Seasonal multiplier:
M_season = 1.25   if month is June, July, August, or September (monsoon)
M_season = 1.00   otherwise

Peak hour multiplier:
M_hour = 1.10   if hour is 7, 8, 9, 17, 18, 19, or 20
M_hour = 1.00   otherwise

City tier multiplier:
M_tier = 1.05   Tier 1 (Metro)
M_tier = 1.10   Tier 2 (Large City)
M_tier = 1.15   Tier 3 (Mid City)
M_tier = 1.20   Tier 4 / Rural

DCS RISK LABELS

```
DCS < 50          -->  Safe Zone
50 <= DCS < 70    -->  Elevated Risk
DCS >= 70         -->  Payout Trigger Zone
```

DCS FORECAST (NEXT WINDOW)

```
Delta_forecast = ( AQI > 0.6  ? +5 : 0 )
               + ( Rainfall > 0.5 ? +8 : 0 )
               + ( monsoon month ? +3 : -2 )

DCS_forecast = clamp( DCS_final + Delta_forecast, 0, 100 )
```

DISRUPTION PROBABILITY (12 HOUR WINDOW)

```
P = 0.90                              if DCS >= 70
P = 0.50 + (DCS - 50) x 0.02         if 50 <= DCS < 70
P = (DCS / 100) x 0.50               if DCS < 50
```

DCS SIGNAL SIMULATION

Since live weather APIs are not yet integrated, signals are generated per city
tier using a base profile with small random fluctuation applied every 30 seconds:

```
signal_live = clamp( base_tier + random(-0.04, +0.04), 0, 1 )
```

Monsoon months add +0.20 to the rainfall base signal.

-----

## PREMIUM PRICING

The current premium system is rule-based. An XGBoost ML model is architected
and training scripts are ready for Phase 3 but is not yet trained or integrated.

PLAN BASE PRICES
All prices are defined as the single source of truth in src/constants/plans.ts:

```
Plan           Weekly    Daily    Coverage      Weekly Payout Cap
-----------    -------   -----    ----------    -----------------
Shield Lite    Rs 49     Rs 7     Rs 50,000     Rs 1,500
Shield Plus    Rs 99     Rs 14    Rs 1,00,000   Rs 3,000   (Recommended)
Shield Max     Rs 179    Rs 26    Rs 2,00,000   Rs 5,000
```

RULE-BASED ADJUSTMENTS (applied on top of base plan premium at activation)

```
Safe zone discount          :  -Rs 2
Monsoon period load         :  +Rs 4
High AQI risk               :  +Rs 3
Low Shield Score (< 60)     :  +Rs 2
High disruption history     :  +Rs 3
```

DCS-AWARE PLAN RECOMMENDATION

When the plan modal opens, a recommended plan and dynamic premium are computed
based on live DCS from src/services/pricing/planRecommender.ts:

```
P_dynamic = round( P_plan x M_risk x D_shield )
```

Risk multiplier:
M_risk = 1.15   if DCS >= 70   (Shield Max recommended)
M_risk = 1.08   if 50 <= DCS < 70   (Shield Plus minimum)
M_risk = 1.00   if DCS < 50

Shield discount:
D_shield = 0.95   if Shield Score > 80   (5% discount)
D_shield = 1.00   otherwise

-----

## CITY TIER CLASSIFICATION

Every worker is automatically classified into a city tier based on the first
digit of their registered 6-digit Indian pincode. Exact logic from registration:

```
First digit 1, 4, 5, or 6   -->  Tier 1 (Metro)
First digit 2 or 3           -->  Tier 2 (Large City)
First digit 7                -->  Tier 3 (Mid City)
All others                   -->  Tier 4 / Rural
```

-----

## FRAUD DETECTION

Current fraud detection is simulated using hardcoded scores in demo seed data.
The Isolation Forest model is architected but not yet trained or integrated.

Fraud decisions use these threshold rules in the UI and admin fraud queue:

```
FraudScore < 30       -->  pass
30 <= FraudScore <= 60  -->  review
FraudScore > 60       -->  fail
```

Fraud signals that will feed the Phase 3 model:
- GPS zone mismatch with registered zone
- Device or network anomaly
- Abnormal payout frequency in short window
- Duplicate event claim attempts
- Unusual platform inactivity before claim
- Inconsistent worker activity patterns

-----

## CHATBOT INTELLIGENCE

The chatbot is rule-based with weighted intent classification. It is not powered
by an LLM or a trained ML model. It uses a custom TypeScript classifier in
src/services/chatbot/intentClassifier.ts.

HOW THE CLASSIFIER WORKS:
1. User input is normalised (lowercase, punctuation removed)
2. Each word is expanded using a synonym map
e.g. “bill” maps to “premium”, “cancel” maps to “stop / end / terminate”
3. Each of the 17 intents is scored against the expanded input
4. Question-type detection (why / how / when / what / can) boosts intents
5. The highest-scoring intent above threshold 2 is selected
6. The response function is called with live user context from Supabase

SUPPORTED INTENTS (17 total):
Policy    :  policy_coverage, policy_exclusions, policy_cancel, policy_switch
Premium   :  premium_why, premium_reduce, premium_calculate
Payout    :  payout_why, payout_when, payout_failed
DCS/Risk  :  dcs_what, dcs_high_risk, dcs_probability
Fraud     :  fraud_flagged
Platform  :  platform_how, platform_trigger, shield_score, city_tier

LEARNING LAYER:
Every query is logged to Supabase chatbot_query_log and stored locally in
localStorage for personalised chip suggestions. This data will be used to
train the Phase 3 intent model.

-----

## SHIELD SCORE

Every worker starts with a Shield Score of 75 out of 100 stored in profiles.

```
Score > 80     :  5% premium discount (D_shield = 0.95), priority clearance
Score 60 - 80  :  Standard pricing (D_shield = 1.00)
Score < 60     :  +Rs 2 premium risk load applied in rule adjustments
```

-----

## PROFILE COMPLETION

The settings page computes completion across 12 tracked fields:

```
Completion = round( filled_fields / 12 x 100 ) %
```

The 12 fields: full name, email, phone, platform type, city, pincode, zone,
weekly earnings, UPI ID, date of birth, emergency contact name, emergency
contact phone.

-----

## TECH STACK

FRONTEND
React 18 with TypeScript and Vite
Tailwind CSS for all styling
Framer Motion for scroll-triggered animations
Recharts for analytics and data visualization
Google Maps JavaScript API for disruption-live map background
React Router DOM for client-side routing
Plus Jakarta Sans for primary UI typography
JetBrains Mono for all financial numbers, DCS values, and metrics

AUTHENTICATION AND DATABASE
Supabase Auth with email and password, session persistence
Supabase PostgreSQL for all persistent data
Row Level Security on all tables
Real-time subscriptions for notification bell updates

MAPS AND LOCATION
Google Maps JavaScript API with custom dark styling on disruption-live page
Google Maps Geocoding API for reverse geocoding on registration
OpenStreetMap Nominatim as free fallback geocoder (no API key required)
Browser Geolocation API for auto-detect on registration form

INTELLIGENCE LAYER (CURRENT - RULE-BASED)
Custom TypeScript DCS Engine with weighted formula, updated every 30 seconds
Custom TypeScript Intent Classifier with synonym expansion and context boosting
Rule-based Plan Recommender using DCS threshold logic
localStorage plus Supabase for chatbot query logging

ML ARCHITECTURE (PHASE 3 - NOT YET TRAINED)
Python FastAPI microservice scaffolded
XGBoost Regressor for premium prediction (training scripts written)
Isolation Forest for fraud anomaly scoring (training scripts written)
Facebook Prophet for DCS time-series forecasting (training scripts written)
TF-IDF plus Logistic Regression for intent classification (scripts written)

INFRASTRUCTURE
Vercel for frontend deployment
Render.com for backend and planned ML microservice
Supabase Cloud for database, auth, and real-time

-----

## DATABASE SCHEMA

profiles
id uuid PRIMARY KEY REFERENCES auth.users
full_name, email, phone, platform_type
city, pincode, zone, weekly_earnings, upi_id
city_tier, shield_score (DEFAULT 75)
date_of_birth, emergency_contact_name, emergency_contact_phone
role (DEFAULT ‘user’), created_at

policies
id uuid PRIMARY KEY
user_id uuid REFERENCES auth.users
plan_id, plan_name
weekly_premium, coverage_amount, weekly_payout_cap
status  –>  ACTIVE | PAUSED | CANCELLED | PENDING CHANGE
start_date

payouts
id uuid PRIMARY KEY
user_id uuid REFERENCES auth.users
amount, status, reason, upi_id
payout_method (DEFAULT ‘UPI’)
settlement_duration_minutes, fraud_status
created_at

claims
id uuid PRIMARY KEY
user_id uuid REFERENCES auth.users
status, trigger_type, dcs_score
amount, zone, fraud_score, fraud_decision
created_at

disruption_events
id uuid PRIMARY KEY
zone, city, trigger_type, dcs_score
status  –>  active | resolved | simulated
created_at

notifications
id uuid PRIMARY KEY
user_id uuid REFERENCES auth.users
type, title, message
read (DEFAULT false), created_at

AI Logging Tables (ready for Phase 3 data collection)
chatbot_query_log       query, detected_intent, confidence, response
premium_prediction_log  input snapshot, prediction, rule adjustments
dcs_forecast_log        zone, current DCS, forecast, probability
fraud_score_log         claim ID, fraud score, risk band, decision

-----

## ML FOLDER STRUCTURE (PHASE 3 - ARCHITECTURE READY)

backend/
ml/
data/
pricing_training.csv       synthetic seed data generated
dcs_training.csv           synthetic seed data generated
chatbot_intents.json       17 intent classes defined
faq_knowledge.json
models/
(empty - models not yet trained)
scripts/
train_pricing.py           XGBoost training script written
train_dcs.py               Prophet + XGBoost script written
train_chatbot_intent.py    TF-IDF + LR script written
train_fraud.py             IsolationForest script written
evaluate_models.py
generate_seed_data.py      500+ synthetic rows per model
services/
pricing_predictor.py
dcs_predictor.py
chatbot_engine.py
fraud_predictor.py
ml_server.py               FastAPI scaffolded

-----

## ENVIRONMENT VARIABLES

VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ…
VITE_GOOGLE_MAPS_API_KEY=AIza…

Note: Enable both Maps JavaScript API and Geocoding API in Google Cloud Console.
Set HTTP referrer restrictions to your localhost and Vercel domain.

-----

## LOCAL SETUP

Install and start frontend:
npm install
npm run dev

Run ML microservice (Phase 3 - models must be trained first):
pip install -r requirements.txt
cd backend/ml/scripts
python generate_seed_data.py
python train_pricing.py
python train_dcs.py
python train_chatbot_intent.py
python train_fraud.py
python ../services/ml_server.py

-----

## DEMO ACCOUNTS

Role             Email                        Password         Notes

-----

Worker (Demo)    test@gig.com                 123456           Pre-seeded with 5 payouts,
5 claims, 6 notifications
Admin            admin@gigkavacham.com        GigAdmin@2025    Full admin portal access

The worker login shows a “Use Demo Account” button that auto-fills credentials.
Demo data is seeded only for test@gig.com. Real new users see their own data.

-----

## DEMO FLOW (HACKATHON PRESENTATION)

1. Open landing page and scroll through storytelling sections
1. Click “Get Protected” CTA
1. Register a new worker
- Click “Detect My Location”
- Nominatim fills city, pincode, zone automatically
- City tier badge appears instantly from pincode first digit
1. Post-registration plan modal appears
- DCS-aware plan recommendation shown (rule-based)
- Dynamic premium shown with risk multiplier if DCS is elevated
- Select plan, activate, policy banner updates immediately
1. Open worker dashboard
- Live DCS ring updates every 30 seconds
- Forecast DCS and disruption probability shown
- Notification bell shows unread count
1. Switch to admin portal at /admin/login
- Log in as admin@gigkavacham.com / GigAdmin@2025
- Open Trigger Simulation panel
- Set trigger type, zone, and DCS slider value
- Click “Simulate Disruption Event”
1. Return to worker dashboard
- DCS alert notification appears in real time
- Pipeline: Trigger Fired > Policy Checked > Fraud Verified > Payout Released
1. Open Ask AI chatbot
- Type “Why did I get paid?”
- Type “What is my DCS score?”
- Type “How do I reduce my premium?”
- Observe personalised context-aware responses (rule-based classifier)

-----

## PROJECT STRUCTURE

GigKavacham/
frontend/
src/
app/
context/AppContext.tsx
lib/supabaseClient.ts
constants/
plans.ts                    single source of truth for all plan data
hooks/
useDcs.ts                   30-second DCS refresh hook
services/
dcs/
dcsEngine.ts              exact DCS formula implementation
dcsSignalSimulator.ts     tier-based signal simulation
chatbot/
intentKnowledge.ts        17 intents with detailed responses
intentClassifier.ts       synonym expansion + context boosting
contextBuilder.ts         live Supabase context per user
chatbotLearning.ts        localStorage + Supabase query logging
pricing/
planRecommender.ts        DCS-aware rule-based recommendation
notifications/
notificationService.ts
demo/
seedDemoData.ts           demo-only seeder gated on email
pages/
landing/
auth/
worker/
admin/
backend/
ml/                             Phase 3 architecture (not yet active)
data/
models/
scripts/
services/

-----

## PROBLEMS WE SOLVED

Problem                                  Solution

-----

Google Maps API failing on Vercel        Nominatim fallback geocoder, no key needed
Infinite loading screen on auth          5 second safety timeout + finally block
Hooks order violation in AppContext      All useState before all useEffect, no
conditional hooks
Policy showing CANCELLED after           order by created_at desc limit 1 on every
activation                               policy fetch
Plan modal reappearing after cancel      sessionStorage dismissed flag
Chatbot not understanding natural        Synonym map + question-type detection +
language                                 context boosting
Demo data not seeding                    Email-gated seeder called on login success
Registration fields missing in settings  useEffect dependency set to [profile]
Coverage amount inconsistent             All values from activePolicy.coverage_amount
Notifications not real time              supabase.channel postgres_changes INSERT

-----

## WHAT WE LEARNED

- Parametric insurance threshold design is actuarial not technical. DCS too low
  bleeds the loss ratio. DCS too high destroys worker trust.
- Fraud in parametric insurance is behavioural. GPS zone consistency and activity
  alignment matter more than document verification.
- Clean auth architecture must be designed upfront. React hook ordering, Supabase
  session management, and protected route logic are deeply interconnected.
- Free tools like Nominatim and OpenStreetMap are often more reliable for
  deployed demos than paid APIs with key restrictions and quota limits.
- Presenting a rule-based system with a clear and honest path to ML is more
  credible than claiming ML without a trained model.

-----

## ROADMAP

PHASE 3 - REAL ML INTEGRATION (ARCHITECTURE AND SCRIPTS READY)

Training scripts, seed data generation, and FastAPI scaffolding are all in place.
Phase 3 trains and integrates the actual models:

XGBoost Pricing Model
Train on 500+ synthetic worker records
Integrate into plan modal replacing rule adjustments
Add SHAP explainability for premium breakdown

Prophet + XGBoost DCS Forecasting
Train on time-windowed signal sequences
Replace the current delta-based forecast with real predictions

Isolation Forest Fraud Model
Train on synthetic claim behavioral data
Calibrated thresholds at 30 and 60
Integrate into claims pipeline replacing simulated scores

TF-IDF Intent Classifier
Train on 17-intent curated dataset
Replace current TypeScript classifier with Python-served model

PHASE 4 - PRODUCTION GRADE

Razorpay live mode            real UPI payouts replacing simulation
KYC layer                     Aadhaar-based identity verification
Twilio WhatsApp bot           policy status, payout alerts, renewal reminders
Multilingual support          Hindi, Tamil, Telugu
Real weather and AQI APIs     OpenWeatherMap + AQICN replacing simulated signals
LLM-backed chatbot            RAG architecture replacing rule-based classifier
Actuarial calibration         real loss ratio modelling from live payout data

================================================================================
Built for India’s 12 million gig workers

# GigKavacham - When work stops, income should not.