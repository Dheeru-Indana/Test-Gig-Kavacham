import pandas as pd
import numpy as np
import random
import json
import os

random.seed(42)
np.random.seed(42)

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')
os.makedirs(DATA_DIR, exist_ok=True)

# PRICING DATA
print('Generating pricing data...')
CITY_TIER_MAP = {
    'Mumbai':'Tier 1','Delhi':'Tier 1','Bangalore':'Tier 1',
    'Chennai':'Tier 1','Hyderabad':'Tier 1','Kolkata':'Tier 1',
    'Pune':'Tier 2','Ahmedabad':'Tier 2','Jaipur':'Tier 2',
    'Lucknow':'Tier 2','Surat':'Tier 2','Nagpur':'Tier 2',
    'Patna':'Tier 3','Indore':'Tier 3','Coimbatore':'Tier 3',
    'Bhopal':'Tier 3','Agra':'Tier 3',
    'Muzaffarpur':'Tier 4','Gorakhpur':'Tier 4','Bareilly':'Tier 4',
}
PLATFORMS = [
    'Delivery Partner','Grocery Rider',
    'Last-Mile Logistics','Gig Driver',
    'Domestic Worker','Construction Worker'
]
TIER_BASE = {'Tier 1':99,'Tier 2':79,'Tier 3':59,'Tier 4':49}
TIER_RISK = {
    'Tier 1':{'flood':0.3,'aqi':0.5,'heat':0.35},
    'Tier 2':{'flood':0.35,'aqi':0.45,'heat':0.40},
    'Tier 3':{'flood':0.50,'aqi':0.55,'heat':0.50},
    'Tier 4':{'flood':0.55,'aqi':0.30,'heat':0.55},
}
rows = []
for _ in range(2000):
    city = random.choice(list(CITY_TIER_MAP.keys()))
    tier = CITY_TIER_MAP[city]
    platform = random.choice(PLATFORMS)
    month = random.randint(1,12)
    shield = int(np.clip(np.random.normal(72,12),30,100))
    daily = round(np.random.uniform(400,1200),0)
    weekly = daily * 6
    renewal = random.randint(0,24)
    payouts = random.randint(0,8)
    freq = round(payouts/max(renewal,1),3)
    risk = TIER_RISK[tier]
    flood = round(np.clip(risk['flood']+np.random.uniform(-0.1,0.15),0,1),3)
    aqi = round(np.clip(risk['aqi']+np.random.uniform(-0.1,0.15),0,1),3)
    heat = round(np.clip(risk['heat']+np.random.uniform(-0.1,0.15),0,1),3)
    rain = round(flood*0.9+np.random.uniform(0,0.1),3)
    traffic = round(np.random.uniform(0.1,0.6),3)
    social = round(np.random.uniform(0.0,0.4),3)
    hist_freq = round(np.random.uniform(0.05,0.35),3)
    is_monsoon = 1 if month in [6,7,8,9] else 0
    is_heat = 1 if month in [4,5,6] else 0
    is_holiday = 1 if month in [10,11,12,1] else 0
    base = TIER_BASE[tier]
    zone_risk = flood*0.30+aqi*0.25+heat*0.20+traffic*0.15+social*0.10
    season = 1.25 if is_monsoon else (1.15 if is_heat else 1.0)
    shield_d = 0.92 if shield>85 else 0.96 if shield>75 else 1.02 if shield<60 else 1.0
    earn_f = np.clip(1.0+(weekly-3000)/20000,0.9,1.2)
    raw = base*zone_risk*2*season*shield_d*earn_f
    premium = int(np.clip(round(raw+np.random.normal(0,3)),49,179))
    rows.append({
        'city':city,'city_tier':tier,'platform_type':platform,
        'month_of_year':month,'shield_score':shield,'daily_earnings':daily,
        'weekly_earnings':weekly,'renewal_count':renewal,
        'historical_payout_count':payouts,'claim_frequency':freq,
        'flood_risk_score':flood,'aqi_risk_score':aqi,'heat_risk_score':heat,
        'rainfall_risk_score':rain,'traffic_disruption_risk':traffic,
        'social_disruption_risk':social,'historical_disruption_freq':hist_freq,
        'is_monsoon':is_monsoon,'is_heat_season':is_heat,
        'is_holiday_period':is_holiday,'weekly_premium':premium
    })
df = pd.DataFrame(rows)
df.to_csv(os.path.join(DATA_DIR,'pricing_training.csv'),index=False)
print(f'Pricing: {len(df)} rows saved')

# DCS DATA
print('Generating DCS data...')
TPROFILES = {
    'Tier 1':{'rainfall':0.28,'aqi':0.48,'heat':0.32,'order_drop':0.18,'social':0.10},
    'Tier 2':{'rainfall':0.33,'aqi':0.42,'heat':0.38,'order_drop':0.22,'social':0.14},
    'Tier 3':{'rainfall':0.48,'aqi':0.52,'heat':0.48,'order_drop':0.28,'social':0.18},
    'Tier 4':{'rainfall':0.52,'aqi':0.28,'heat':0.52,'order_drop':0.35,'social':0.22},
}
def cdcs(s,month,hour,tier):
    base = (s['rainfall']*0.30+s['aqi']*0.25+
            s['heat']*0.20+s['order_drop']*0.15+s['social']*0.10)
    ms = 1.25 if month in [6,7,8,9] else 1.0
    mh = 1.10 if hour in [7,8,9,17,18,19,20] else 1.0
    mt = {'Tier 1':1.05,'Tier 2':1.10,'Tier 3':1.15,'Tier 4':1.20}[tier]
    return min(round(base*ms*mh*mt*100),100)
def fluct(b,sc=0.06):
    return float(np.clip(b+np.random.normal(0,sc),0,1))
from datetime import datetime,timedelta
base_date = datetime(2024,1,1)
rows = []
for i in range(3000):
    tier = random.choice(['Tier 1','Tier 2','Tier 3','Tier 4'])
    p = TPROFILES[tier]
    ts = base_date+timedelta(hours=random.randint(0,8760))
    month = ts.month
    hour = ts.hour
    is_m = month in [6,7,8,9]
    is_h = month in [4,5,6]
    mb = 0.20 if is_m else 0
    hb = 0.15 if is_h else 0
    signals = {
        'rainfall':fluct(min(p['rainfall']+mb,1)),
        'aqi':fluct(p['aqi']),
        'heat':fluct(min(p['heat']+hb,1)),
        'order_drop':fluct(p['order_drop']),
        'social':fluct(p['social'])
    }
    sp = {k:fluct(v,0.04) for k,v in signals.items()}
    sh = {k:p[k]*(1.15 if is_m else 1.0) for k in p}
    cur = cdcs(signals,month,hour,tier)
    prev = cdcs(sp,month,max(hour-6,0),tier)
    hist = cdcs(sh,month,14,tier)
    delta = (5 if signals['aqi']>0.6 else 0)+(8 if signals['rainfall']>0.5 else 0)+(3 if is_m else -2)
    fore = int(np.clip(cur+delta+np.random.normal(0,3),0,100))
    prob = 0.90 if cur>=70 else (0.50+(cur-50)*0.02 if cur>=50 else cur/100*0.50)
    prob = round(float(np.clip(prob+np.random.normal(0,0.03),0,1)),3)
    rows.append({
        'city_tier':tier,'month_of_year':month,'hour_of_day':hour,
        'day_of_week':ts.weekday(),'is_monsoon':int(is_m),'is_heat_season':int(is_h),
        'rainfall_score':round(signals['rainfall'],4),'aqi_score':round(signals['aqi'],4),
        'heat_score':round(signals['heat'],4),'order_drop_score':round(signals['order_drop'],4),
        'social_score':round(signals['social'],4),'prev_rainfall':round(sp['rainfall'],4),
        'prev_aqi':round(sp['aqi'],4),'prev_heat':round(sp['heat'],4),
        'hist_avg_rainfall':round(sh['rainfall'],4),'hist_avg_aqi':round(sh['aqi'],4),
        'current_dcs':cur,'prev_dcs':prev,'hist_avg_dcs':hist,'dcs_trend':cur-prev,
        'forecast_dcs':fore,'disruption_probability':prob
    })
df = pd.DataFrame(rows)
df.to_csv(os.path.join(DATA_DIR,'dcs_training.csv'),index=False)
print(f'DCS: {len(df)} rows saved')

# FRAUD DATA
print('Generating fraud data...')
types = ['clean']*1050+['suspicious']*300+['fraudulent']*150
random.shuffle(types)
rows = []
for ct in types:
    month = random.randint(1,12)
    is_m = month in [6,7,8,9]
    dcs = random.randint(65,95) if is_m else random.randint(55,85)
    if ct=='clean':
        gzm=0; gjd=0
        gal=int(random.random()<0.05); vpn=int(random.random()<0.03)
        wc=round(np.clip(np.random.normal(0.85,0.08),0.6,1.0),3)
        hdd=round(np.clip(np.random.normal(0.10,0.05),0,0.3),3)
        cta=int(random.random()<0.03)
        pfs=round(np.clip(np.random.normal(0.9,0.2),0.3,1.8),3)
        da=0
        pih=round(np.clip(np.random.normal(0.5,0.3),0,1.5),2)
        ua=int(random.random()<0.04)
    elif ct=='suspicious':
        gzm=int(random.random()<0.50); gjd=int(random.random()<0.15)
        gal=int(random.random()<0.45); vpn=int(random.random()<0.35)
        wc=round(np.clip(np.random.normal(0.55,0.15),0.2,0.8),3)
        hdd=round(np.clip(np.random.normal(0.38,0.10),0.2,0.6),3)
        cta=int(random.random()<0.50)
        pfs=round(np.clip(np.random.normal(2.3,0.5),1.5,3.5),3)
        da=int(random.random()<0.10)
        pih=round(np.clip(np.random.normal(3.0,1.0),1.5,5.0),2)
        ua=int(random.random()<0.40)
    else:
        gzm=int(random.random()<0.90); gjd=int(random.random()<0.65)
        gal=int(random.random()<0.80); vpn=int(random.random()<0.70)
        wc=round(np.clip(np.random.normal(0.20,0.10),0.0,0.4),3)
        hdd=round(np.clip(np.random.normal(0.70,0.15),0.5,1.0),3)
        cta=int(random.random()<0.85)
        pfs=round(np.clip(np.random.normal(4.2,0.8),3.0,6.0),3)
        da=int(random.random()<0.55)
        pih=round(np.clip(np.random.normal(6.5,1.5),4.0,10.0),2)
        ua=int(random.random()<0.80)
    gr = min(gzm*20+gjd*12+gal*5+vpn*3,40)
    wr = min(round((1-wc)*20)+(10 if hdd>0.5 else 5 if hdd>0.3 else 0)+(5 if cta else 0),35)
    br = min((10 if pfs>3.0 else 5 if pfs>2.0 else 0)+(8 if da else 0)+(5 if pih>4 else 2 if pih>2 else 0)+(2 if ua else 0),25)
    fs = min(gr+wr+br,100)
    dec = 'fail' if fs>=60 else 'review' if fs>=30 else 'pass'
    rb = 'high' if fs>=60 else 'medium' if fs>=30 else 'low'
    rows.append({
        'claim_type':ct,'month_of_year':month,'dcs_at_claim':dcs,
        'gps_zone_mismatch':gzm,'gps_jump_detected':gjd,'gps_accuracy_low':gal,
        'vpn_detected':vpn,'weather_claim_consistency':wc,'historical_dcs_deviation':hdd,
        'claim_timing_anomaly':cta,'payout_frequency_score':pfs,'duplicate_event_attempt':da,
        'platform_inactivity_hours':pih,'unusual_claim_amount':ua,
        'gps_risk_score':gr,'weather_risk_score':wr,'behavioral_risk_score':br,
        'fraud_score':fs,'risk_band':rb,'decision':dec
    })
df = pd.DataFrame(rows)
df.to_csv(os.path.join(DATA_DIR,'fraud_training.csv'),index=False)
print(f'Fraud: {len(df)} rows saved')

# CHATBOT INTENTS
print('Generating chatbot intents...')
intents = {'intents':[
    {'intent':'policy_coverage','examples':['What does my policy cover','What am I covered for','Tell me what my insurance includes','What does Shield Plus protect me from','What events trigger a payout','Am I covered for rainfall','Does my policy cover AQI','What is in my protection plan','Tell me about my coverage','What am I protected against']},
    {'intent':'policy_exclusions','examples':['What is not covered','What does my policy exclude','What wont GigKavacham pay for','Are vehicle repairs covered','What are the exclusions','Tell me what is excluded','What claims will be rejected','Is fuel covered','Does it cover medical expenses','What losses are not eligible']},
    {'intent':'policy_cancel','examples':['How do I cancel my policy','I want to stop my insurance','Cancel my plan','How to deactivate my shield','I want to end my coverage','How do I remove my policy','Stop my weekly premium','I do not want insurance anymore','How to quit GigKavacham','Cancel my subscription']},
    {'intent':'policy_switch','examples':['How do I switch plans','I want to upgrade my plan','Can I change to Shield Max','How to downgrade my policy','I want a different plan','Switch me to Shield Plus','Can I move to a better plan','How to upgrade my coverage','I want more coverage','Change my plan']},
    {'intent':'premium_why','examples':['Why is my premium this amount','Why am I paying 99 rupees','How is my weekly cost calculated','Why is my price so high','What determines my premium','Why does my plan cost this much','Explain my weekly charge','What factors affect my premium','Why is it 49 per week','I do not understand my pricing']},
    {'intent':'premium_reduce','examples':['How can I reduce my premium','Can I get a cheaper plan','How to lower my weekly cost','Is there a discount','How to save money on my policy','Can I pay less','How to get a cheaper rate','What can I do to lower my price','How to reduce my weekly charge','I want to pay less']},
    {'intent':'payout_why','examples':['Why did I get paid','Why was money sent to my UPI','What caused my payout','Why did I receive money','Explain my last payment','Why was a payout triggered','What event paid me','I received money why','What disruption caused my payout','Why was a claim processed']},
    {'intent':'payout_when','examples':['When will I get paid','How long does payout take','When will money reach my UPI','How fast is the payout','When will the transfer happen','How soon will I receive money','What is the payout timeline','How quickly does GigKavacham pay','When can I expect payment','How many minutes for payout']},
    {'intent':'payout_failed','examples':['My payout failed','I did not receive my money','Payment did not come through','My UPI transfer failed','Where is my money','Payment not received','My claim was approved but no money','UPI credit did not happen','Why did my payment fail','Money not credited to my account']},
    {'intent':'dcs_what','examples':['What is DCS','What is the disruption composite score','Explain DCS to me','What does the DCS number mean','What is my zone score','What is the risk score','Tell me about DCS','How is DCS calculated','What does DCS stand for','Explain the disruption score']},
    {'intent':'dcs_high_risk','examples':['Why is my zone high risk','My DCS is high what does that mean','Why is my score elevated','What does elevated risk mean','Why is my zone in danger','DCS is showing red what happens','My area shows high disruption','Why is my zone flagged','What does payout trigger zone mean','My zone is at risk what do I do']},
    {'intent':'fraud_flagged','examples':['Why was my claim flagged','My claim is under review','Why is there a fraud check on my claim','My payout is held for review','Why was I flagged for fraud','What does claim under review mean','Why is my payout delayed for verification','My claim was blocked','Why is my payment held','Fraud review what happens']},
    {'intent':'platform_how','examples':['How does GigKavacham work','Explain how this platform works','What is GigKavacham','Tell me about parametric insurance','How does the platform operate','Explain the insurance model','How does automatic payout work','What is zero touch claims','How does GigKavacham protect me','Explain the whole system']},
    {'intent':'shield_score','examples':['What is my shield score','What does the shield score mean','Explain shield score','How is shield score calculated','What is the score out of 100 on my profile','How do I improve my shield score','What affects my shield score','Why is my shield score 75','How does shield score affect my premium','What is a good shield score']},
    {'intent':'city_tier','examples':['What is my city tier','What does Tier 1 mean','Explain city tier classification','What is Tier 3','How is my city classified','What tier is my city','Why am I in Tier 2','How does city tier affect my plan','What is the difference between tiers','Tier 1 vs Tier 3 what changes']},
]}
with open(os.path.join(DATA_DIR,'chatbot_intents.json'),'w') as f:
    json.dump(intents,f,indent=2)
print(f'Chatbot: {len(intents["intents"])} intents saved')
print('All data generated successfully.')