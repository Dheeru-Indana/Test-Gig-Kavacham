import urllib.request
import json

URL_BASE = 'http://127.0.0.1:5001'

ENDPOINTS = [
    (
        "1. Premium Pricing Model", 
        "/ml/premium/predict", 
        {"city_tier": "Tier 1", "platform_type": "Zomato", "month_of_year": 7, "shield_score": 85, "daily_earnings": 1200, "weekly_earnings": 8000}
    ),
    (
        "2. Disruption Coverage Score (DCS) Engine",
        "/ml/dcs/predict", 
        {"rainfall_score": 0.8, "aqi_score": 0.4, "heat_score": 0.2, "order_drop_score": 0.7, "social_score": 0.1, "city_tier": "Tier 1", "month_of_year": 7, "hour_of_day": 14, "day_of_week": 3, "is_monsoon": 1, "is_heat_season": 0}
    ),
    (
        "3. Fraud Detection Engine",
        "/ml/fraud/score", 
        {"gps_zone_mismatch": 1, "gps_accuracy_low": 1, "weather_claim_consistency": 0.4, "claim_timing_anomaly": 1, "payout_frequency_score": 3.0}
    ),
    (
        "4. NLP Chatbot Intent",
        "/ml/chat/classify", 
        {"query": "How do I claim my monsoon payout if GPS was off?"}
    ),
    (
        "5. Risk Assessment Scorer",
        "/ml/risk/score", 
        {"city_tier": "Tier 1", "platform_type": "Swiggy", "month_of_year": 7, "weekly_earnings": 8000, "flood_risk_score": 0.8}
    )
]

print("==============================================")
print("   GIG KAVACHAM - ML MODEL VERIFICATION       ")
print("==============================================\n")

for name, path, payload in ENDPOINTS:
    print(f"Testing {name}...")
    print(f"POST {URL_BASE}{path}")
    
    req = urllib.request.Request(
        URL_BASE + path, 
        data=json.dumps(payload).encode('utf-8'), 
        headers={'Content-Type': 'application/json'}
    )
    
    try:
        res = urllib.request.urlopen(req)
        # Parse and pretty-print JSON response securely avoiding charmap encoding errors
        response_json = json.loads(res.read().decode('utf-8'))
        print("\n[SUCCESS] Response:")
        print(json.dumps(response_json, indent=4))
    except Exception as e:
        print("\n[ERROR] Failed to fetch data:", e)
    
    print("\n----------------------------------------------\n")
