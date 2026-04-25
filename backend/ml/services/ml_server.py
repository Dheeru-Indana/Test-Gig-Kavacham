import os
import json
import joblib
import numpy as np
import warnings
warnings.filterwarnings('ignore')

os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ['TF_USE_LEGACY_KERAS'] = '1'

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import uvicorn
import traceback
from sentence_transformers import SentenceTransformer

app = FastAPI(
    title='GigKavacham ML Service',
    version='1.0.0',
    description='ML inference service for GigKavacham'
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_methods=['*'],
    allow_headers=['*'],
)

# ─── Model Directory ──────────────────────────────────────
MODEL_DIR = os.path.join(
    os.path.dirname(__file__), '..', 'models'
)

# ─── Global Model Store ───────────────────────────────────
models = {}

# ─── Startup: Load All Models ─────────────────────────────
# ─── Startup: Load All Models ─────────────────────────────
def load_safe(filename, loader=joblib.load, is_json=False):
    path = os.path.join(MODEL_DIR, filename)
    if not os.path.exists(path):
        print(f"  [WARNING] Model file missing: {filename} at {path}")
        return None
    try:
        if is_json:
            with open(path) as f:
                return json.load(f)
        return loader(path)
    except Exception as e:
        print(f"  [ERROR] Failed to load {filename}: {e}")
        return None

def load_models_sync():
    print('Loading GigKavacham ML models (Production Edition)...')
    
    # Pricing models
    models['pricing'] = load_safe('pricing_model.pkl')
    models['pricing_scaler'] = load_safe('pricing_scaler.pkl')
    models['pricing_le_tier'] = load_safe('le_city_tier.pkl')
    models['pricing_le_platform'] = load_safe('le_platform.pkl')
    models['pricing_xgb'] = load_safe('pricing_xgb_shap.pkl')
    models['pricing_shap'] = load_safe('pricing_shap_explainer.pkl')

    # DCS models
    models['dcs_rf'] = load_safe('dcs_rf_model.pkl')
    models['dcs_prob'] = load_safe('dcs_prob_model.pkl')
    models['dcs_scaler_x'] = load_safe('dcs_scaler_x.pkl')
    models['dcs_le_tier'] = load_safe('dcs_le_tier.pkl')
    models['dcs_prophet'] = load_safe('dcs_prophet.pkl')
    models['dcs_config'] = load_safe('dcs_metrics.json', is_json=True)

    # Fraud models
    models['fraud_iso'] = load_safe('fraud_isolation_forest.pkl')
    models['fraud_xgb'] = load_safe('fraud_xgb_classifier.pkl')
    models['fraud_scaler'] = load_safe('fraud_scaler.pkl')
    models['fraud_lime_config'] = load_safe('fraud_lime_config.json', is_json=True)

    # Chatbot models
    try:
        print('  Loading SBERT (all-MiniLM-L6-v2)...')
        models['sbert'] = SentenceTransformer('all-MiniLM-L6-v2')
        models['intent_embeddings'] = load_safe('intent_embeddings.pkl')
        models['intent_lr'] = load_safe('intent_lr_model.pkl')
        models['intent_le'] = load_safe('intent_label_encoder.pkl')
        models['intent_config'] = load_safe('intent_config.json', is_json=True)
    except Exception as e:
        print(f'  Chatbot pipeline failed: {e}')

    # Risk scorer
    models['risk_scorer'] = load_safe('risk_scorer_model.pkl')
    models['risk_scaler'] = load_safe('risk_scorer_scaler.pkl')
    models['risk_le_tier'] = load_safe('risk_scorer_le_tier.pkl')
    models['risk_le_platform'] = load_safe('risk_scorer_le_platform.pkl')
    models['risk_le_risk'] = load_safe('risk_scorer_le_risk.pkl')
    
    loaded_count = len([m for m in models.values() if m is not None])
    print(f"ML Startup Complete. Loaded {loaded_count} components.")

try:
    load_models_sync()
except Exception:
    print("CRITICAL ERROR DURING ML STARTUP:")
    traceback.print_exc()
    # Don't exit here, let it fail gracefully so it can start for other models

@app.get('/')
def root():
    return {
        'message': 'GigKavacham ML Server Operational (v1.0.0)',
        'status': 'online',
        'health_check': '/health'
    }

# ─── Health Check ─────────────────────────────────────────
@app.get('/health')
def health():
    return {
        'status': 'ok',
        'models_loaded': list(models.keys()),
    }

# ──────────────────────────────────────────────────────────
# ENDPOINT 1 — PREMIUM PREDICTION
# ──────────────────────────────────────────────────────────

class PremiumInput(BaseModel):
    city_tier: str
    platform_type: str
    month_of_year: int
    shield_score: int
    daily_earnings: float
    weekly_earnings: float
    renewal_count: int = 0
    historical_payout_count: int = 0
    claim_frequency: float = 0.0
    flood_risk_score: float = 0.3
    aqi_risk_score: float = 0.4
    heat_risk_score: float = 0.3
    rainfall_risk_score: float = 0.3
    traffic_disruption_risk: float = 0.2
    social_disruption_risk: float = 0.1
    historical_disruption_freq: float = 0.1
    is_monsoon: int = 0
    is_heat_season: int = 0
    is_holiday_period: int = 0

@app.post('/ml/premium/predict')
def predict_premium(data: PremiumInput):
    if 'pricing' not in models:
        raise HTTPException(503, 'Pricing model not loaded')

    try:
        le_tier = models['pricing_le_tier']
        le_plat = models['pricing_le_platform']

        # Encode categoricals
        try:
            tier_enc = le_tier.transform([data.city_tier])[0]
        except ValueError:
            tier_enc = 0

        try:
            plat_enc = le_plat.transform([data.platform_type])[0]
        except ValueError:
            plat_enc = 0

        features = np.array([[
            tier_enc, plat_enc,
            data.month_of_year, data.shield_score,
            data.daily_earnings, data.weekly_earnings,
            data.renewal_count, data.historical_payout_count,
            data.claim_frequency, data.flood_risk_score,
            data.aqi_risk_score, data.heat_risk_score,
            data.rainfall_risk_score,
            data.traffic_disruption_risk,
            data.social_disruption_risk,
            data.historical_disruption_freq,
            data.is_monsoon, data.is_heat_season,
            data.is_holiday_period,
        ]])

        features_scaled = models['pricing_scaler'].transform(
            features
        )

        # Stacked ensemble prediction
        raw_premium = float(
            models['pricing'].predict(features_scaled)[0]
        )

        # Rule adjustments on top
        adjustments = []
        delta = 0

        zone_risk = (
            data.flood_risk_score * 0.30 +
            data.aqi_risk_score * 0.25 +
            data.heat_risk_score * 0.20 +
            data.traffic_disruption_risk * 0.15 +
            data.social_disruption_risk * 0.10
        )

        if zone_risk < 0.3:
            delta -= 2
            adjustments.append('Safe zone discount: -INR2')
        if data.is_monsoon:
            delta += 4
            adjustments.append('Monsoon season load: +INR4')
        if data.aqi_risk_score > 0.6:
            delta += 3
            adjustments.append('High AQI risk: +INR3')
        if data.shield_score < 60:
            delta += 2
            adjustments.append('Low Shield Score: +INR2')
        if data.historical_disruption_freq > 0.25:
            delta += 3
            adjustments.append('High disruption history: +INR3')

        final_premium = int(
            np.clip(round(raw_premium + delta), 49, 179)
        )

        # Risk band
        if final_premium >= 150:
            risk_band = 'high'
        elif final_premium >= 90:
            risk_band = 'medium'
        else:
            risk_band = 'low'

        # SHAP explanation
        try:
            import shap
            shap_vals = models['pricing_shap'].shap_values(
                features_scaled
            )
            feature_names = [
                'city_tier', 'platform_type', 'month',
                'shield_score', 'daily_earnings',
                'weekly_earnings', 'renewals', 'payouts',
                'claim_freq', 'flood_risk', 'aqi_risk',
                'heat_risk', 'rainfall_risk', 'traffic_risk',
                'social_risk', 'disruption_freq',
                'is_monsoon', 'is_heat', 'is_holiday',
            ]
            top_idx = np.argsort(
                np.abs(shap_vals[0])
            )[::-1][:3]
            top_factors = [feature_names[i] for i in top_idx]

            factor_labels = {
                'city_tier': 'city tier',
                'aqi_risk': 'AQI disruption risk',
                'flood_risk': 'flood risk',
                'heat_risk': 'heat stress risk',
                'is_monsoon': 'monsoon season',
                'shield_score': 'Shield Score',
                'weekly_earnings': 'weekly earnings',
                'platform_type': 'platform type',
                'rainfall_risk': 'rainfall risk',
                'disruption_freq': 'historical disruptions',
            }
            readable = [
                factor_labels.get(f, f)
                for f in top_factors
            ]
            explanation = (
                f'Your premium is INR{final_premium}/week '
                f'because {readable[0]}, {readable[1]}, '
                f'and {readable[2]} are the main factors. '
            )
        except Exception:
            explanation = (
                f'Your premium is INR{final_premium}/week based '
                f'on your zone risk, city tier, and earnings.'
            )

        if adjustments:
            explanation += (
                f'Rule adjustments applied: '
                f'{", ".join(adjustments)}.'
            )

        # Recommended plan
        if final_premium <= 60:
            recommended_plan = 'shield-lite'
        elif final_premium <= 120:
            recommended_plan = 'shield-plus'
        else:
            recommended_plan = 'shield-max'

        return {
            'ml_prediction':    round(raw_premium, 2),
            'rule_adjustments': delta,
            'final_premium':    final_premium,
            'risk_band':        risk_band,
            'recommended_plan': recommended_plan,
            'explanation':      explanation,
            'adjustments':      adjustments,
        }

    except Exception as e:
        raise HTTPException(500, f'Prediction failed: {str(e)}')

# ──────────────────────────────────────────────────────────
# ENDPOINT 2 — DCS FORECAST
# ──────────────────────────────────────────────────────────

class DcsInput(BaseModel):
    rainfall_score: float
    aqi_score: float
    heat_score: float
    order_drop_score: float
    social_score: float
    city_tier: str
    month_of_year: int
    hour_of_day: int
    day_of_week: int
    is_monsoon: int
    is_heat_season: int
    prev_rainfall: float = 0.3
    prev_aqi: float = 0.4
    prev_heat: float = 0.3
    current_dcs: float = 35.0
    prev_dcs: float = 33.0
    dcs_trend: float = 2.0
    hist_avg_dcs: float = 38.0

@app.post('/ml/dcs/predict')
def predict_dcs(data: DcsInput):
    if 'dcs_rf' not in models:
        raise HTTPException(503, 'DCS model not loaded')

    try:
        le_tier = models['dcs_le_tier']
        try:
            tier_enc = le_tier.transform([data.city_tier])[0]
        except ValueError:
            tier_enc = 0

        feature_vec = np.array([[
            data.rainfall_score, data.aqi_score,
            data.heat_score, data.order_drop_score,
            data.social_score,
            tier_enc, data.month_of_year, data.hour_of_day,
            data.day_of_week, data.is_monsoon,
            data.is_heat_season,
            data.prev_rainfall, data.prev_aqi, data.prev_heat,
            data.current_dcs, data.prev_dcs, data.dcs_trend,
            data.hist_avg_dcs,
        ]])

        scaled = models['dcs_scaler_x'].transform(feature_vec)

        # Random Forest prediction
        forecast_dcs = float(models['dcs_rf'].predict(scaled)[0])
        forecast_dcs = int(np.clip(round(forecast_dcs), 0, 100))
        
        disruption_prob = float(models['dcs_prob'].predict(scaled)[0])
        disruption_prob = round(
            np.clip(disruption_prob, 0, 1), 3
        )

        # Risk label
        if forecast_dcs >= 70:
            risk_label = 'Payout Trigger Zone'
            risk_color = 'red'
        elif forecast_dcs >= 50:
            risk_label = 'Elevated Risk'
            risk_color = 'amber'
        else:
            risk_label = 'Safe Zone'
            risk_color = 'green'

        # Plain language explanation
        top_signals = []
        if data.aqi_score > 0.6:
            top_signals.append('elevated AQI levels')
        if data.rainfall_score > 0.5:
            top_signals.append('high rainfall intensity')
        if data.heat_score > 0.5:
            top_signals.append('extreme heat conditions')
        if data.order_drop_score > 0.5:
            top_signals.append('significant order volume drop')

        if top_signals:
            explanation = (
                f'DCS forecast is {forecast_dcs}/100 due to '
                f'{", ".join(top_signals)}. '
            )
        else:
            explanation = (
                f'DCS forecast is {forecast_dcs}/100. '
                f'Zone signals are within normal range. '
            )

        if forecast_dcs >= 70:
            explanation += (
                'Payout trigger threshold likely to be reached. '
                'Ensure your policy is ACTIVE.'
            )
        elif forecast_dcs >= 50:
            explanation += (
                'Zone is in elevated risk. Monitor for changes.'
            )
        else:
            explanation += 'No disruption events expected.'

        # Prophet trend
        prophet_trend = None
        try:
            prophet = models['dcs_prophet']
            import pandas as pd
            future = prophet.make_future_dataframe(
                periods=7, freq='D'
            )
            fc = prophet.predict(future)
            prophet_trend = round(
                float(fc['trend'].tail(7).mean()), 1
            )
        except Exception:
            pass

        return {
            'forecast_dcs':          forecast_dcs,
            'disruption_probability': disruption_prob,
            'risk_label':            risk_label,
            'risk_color':            risk_color,
            'explanation':           explanation,
            'prophet_7day_trend':    prophet_trend,
            'model':                 'BiLSTM_TwoHead',
        }

    except Exception as e:
        raise HTTPException(500, f'DCS prediction failed: {str(e)}')

# ──────────────────────────────────────────────────────────
# ENDPOINT 3 — FRAUD SCORING
# ──────────────────────────────────────────────────────────

class FraudInput(BaseModel):
    gps_zone_mismatch: int = 0
    gps_jump_detected: int = 0
    gps_accuracy_low: int = 0
    vpn_detected: int = 0
    weather_claim_consistency: float = 0.85
    historical_dcs_deviation: float = 0.1
    claim_timing_anomaly: int = 0
    payout_frequency_score: float = 1.0
    duplicate_event_attempt: int = 0
    platform_inactivity_hours: float = 0.5
    unusual_claim_amount: int = 0

@app.post('/ml/fraud/score')
def score_fraud(data: FraudInput):
    if 'fraud_iso' not in models:
        raise HTTPException(503, 'Fraud model not loaded')

    try:
        FRAUD_FEATURES = [
            'gps_zone_mismatch', 'gps_jump_detected',
            'gps_accuracy_low', 'vpn_detected',
            'weather_claim_consistency',
            'historical_dcs_deviation',
            'claim_timing_anomaly',
            'payout_frequency_score',
            'duplicate_event_attempt',
            'platform_inactivity_hours',
            'unusual_claim_amount',
        ]

        raw = np.array([[
            data.gps_zone_mismatch, data.gps_jump_detected,
            data.gps_accuracy_low, data.vpn_detected,
            data.weather_claim_consistency,
            data.historical_dcs_deviation,
            data.claim_timing_anomaly,
            data.payout_frequency_score,
            data.duplicate_event_attempt,
            data.platform_inactivity_hours,
            data.unusual_claim_amount,
        ]])

        scaled = models['fraud_scaler'].transform(raw)

        # Stage 1: Isolation Forest anomaly score
        anomaly = models['fraud_iso'].decision_function(scaled)
        iso_score = float(np.clip(
            100 * (0.5 - anomaly[0]), 0, 100
        ))

        # Stage 2: XGBoost with iso score as feature
        aug = np.hstack([scaled, [[iso_score]]])
        pred_class = int(
            models['fraud_xgb'].predict(aug)[0]
        )
        pred_proba = models['fraud_xgb'].predict_proba(aug)[0]
        confidence = float(pred_proba.max())

        label_map = {0: 'pass', 1: 'review', 2: 'fail'}
        decision = label_map[pred_class]

        # Fraud score (0-100)
        fraud_score = int(np.clip(
            pred_proba[1] * 60 + pred_proba[2] * 100, 0, 100
        ))

        risk_band = (
            'high'   if fraud_score >= 60 else
            'medium' if fraud_score >= 30 else 'low'
        )

        # Top signals
        top_signals = []
        if data.gps_zone_mismatch:
            top_signals.append(
                'GPS location outside registered zone'
            )
        if data.gps_jump_detected:
            top_signals.append(
                'GPS location changed at impossible speed'
            )
        if data.gps_accuracy_low:
            top_signals.append(
                'GPS accuracy low — possible mock location'
            )
        if 1 - data.weather_claim_consistency > 0.6:
            top_signals.append(
                'Claimed disruption does not match weather records'
            )
        if data.claim_timing_anomaly:
            top_signals.append(
                'Claim filed outside disruption event window'
            )
        if data.payout_frequency_score > 2.5:
            top_signals.append(
                f'Claiming {data.payout_frequency_score:.1f}x '
                f'more than zone peers'
            )
        if data.duplicate_event_attempt:
            top_signals.append(
                'Duplicate claim for same disruption event'
            )

        explanation = (
            f'Fraud score: {fraud_score}/100. '
            f'Decision: {decision.upper()}. '
        )
        if top_signals:
            explanation += (
                f'Top concerns: {top_signals[0]}.'
            )
        else:
            explanation += 'No anomalies detected.'

        return {
            'fraud_score':    fraud_score,
            'iso_score':      round(iso_score, 1),
            'risk_band':      risk_band,
            'decision':       decision,
            'confidence':     round(confidence, 3),
            'top_signals':    top_signals[:3],
            'explanation':    explanation,
        }

    except Exception as e:
        raise HTTPException(
            500, f'Fraud scoring failed: {str(e)}'
        )

# ──────────────────────────────────────────────────────────
# ENDPOINT 4 — CHATBOT INTENT CLASSIFICATION
# ──────────────────────────────────────────────────────────

class ChatInput(BaseModel):
    query: str
    threshold: float = 0.30

@app.post('/ml/chat/classify')
def classify_chat(data: ChatInput):
    if 'sbert' not in models:
        raise HTTPException(503, 'Chatbot model not loaded')

    try:
        from sklearn.metrics.pairwise import cosine_similarity

        sbert = models['sbert']
        intent_embeddings = models['intent_embeddings']
        lr = models['intent_lr']
        le = models['intent_le']

        query_emb = sbert.encode([data.query])

        # Method 1: Cosine similarity
        scores = {}
        for intent, idata in intent_embeddings.items():
            mean_sim = float(cosine_similarity(
                query_emb,
                idata['mean_embedding'].reshape(1, -1)
            )[0][0])
            all_sims = cosine_similarity(
                query_emb,
                idata['all_embeddings']
            )[0]
            top3 = float(np.sort(all_sims)[::-1][:3].mean())
            scores[intent] = 0.4 * mean_sim + 0.6 * top3

        best_intent_sim = max(scores, key=scores.get)
        best_score_sim  = scores[best_intent_sim]

        # Method 2: LR classifier
        lr_pred    = lr.predict(query_emb)[0]
        lr_proba   = lr.predict_proba(query_emb)[0]
        lr_intent  = le.inverse_transform([lr_pred])[0]
        lr_conf    = float(lr_proba.max())

        # Blend
        if best_intent_sim == lr_intent:
            final_intent = best_intent_sim
            final_conf   = max(best_score_sim, lr_conf)
        else:
            if lr_conf > best_score_sim + 0.1:
                final_intent = lr_intent
                final_conf   = lr_conf
            else:
                final_intent = best_intent_sim
                final_conf   = best_score_sim

        if final_conf < data.threshold:
            final_intent = 'fallback'

        sorted_scores = sorted(
            scores.items(), key=lambda x: x[1], reverse=True
        )

        return {
            'intent':     final_intent,
            'confidence': round(final_conf, 4),
            'method':     'sbert_hybrid',
            'top3': [
                {'intent': i, 'score': round(s, 4)}
                for i, s in sorted_scores[:3]
            ],
        }

    except Exception as e:
        raise HTTPException(
            500, f'Classification failed: {str(e)}'
        )

# ──────────────────────────────────────────────────────────
# ENDPOINT 5 — REGISTRATION RISK SCORER
# ──────────────────────────────────────────────────────────

class RiskInput(BaseModel):
    city_tier: str
    platform_type: str
    month_of_year: int
    weekly_earnings: float
    flood_risk_score: float = 0.3
    aqi_risk_score: float = 0.4
    heat_risk_score: float = 0.3
    shield_score: int = 75

@app.post('/ml/risk/score')
def score_risk(data: RiskInput):
    if 'risk_scorer' not in models:
        raise HTTPException(503, 'Risk scorer not loaded')

    try:
        le_tier  = models['risk_le_tier']
        le_plat  = models['risk_le_platform']
        le_risk  = models['risk_le_risk']

        try:
            tier_enc = le_tier.transform([data.city_tier])[0]
        except ValueError:
            tier_enc = 0

        try:
            plat_enc = le_plat.transform(
                [data.platform_type]
            )[0]
        except ValueError:
            plat_enc = 0

        is_monsoon = 1 if data.month_of_year in [
            6, 7, 8, 9
        ] else 0
        is_heat = 1 if data.month_of_year in [
            4, 5, 6
        ] else 0

        features = np.array([[
            tier_enc, plat_enc, data.month_of_year,
            data.weekly_earnings,
            data.flood_risk_score, data.aqi_risk_score,
            data.heat_risk_score,
            is_monsoon, is_heat, data.shield_score,
        ]])

        scaled = models['risk_scaler'].transform(features)
        pred   = models['risk_scorer'].predict(scaled)[0]
        proba  = models['risk_scorer'].predict_proba(scaled)[0]

        risk_label = le_risk.inverse_transform([pred])[0]
        confidence = float(proba.max())

        plan_map = {
            'low':    'shield-lite',
            'medium': 'shield-plus',
            'high':   'shield-max',
        }
        premium_map = {
            'low': 49, 'medium': 99, 'high': 179
        }
        name_map = {
            'low':    'Shield Lite',
            'medium': 'Shield Plus',
            'high':   'Shield Max',
        }

        explanation = (
            f'Based on your {data.city_tier} zone, '
            f'{data.platform_type} platform, and current '
            f'seasonal risk, {name_map[risk_label]} '
            f'provides the right level of protection '
            f'at INR{premium_map[risk_label]}/week.'
        )

        return {
            'risk_band':        risk_label,
            'confidence':       round(confidence, 3),
            'recommended_plan': plan_map[risk_label],
            'plan_name':        name_map[risk_label],
            'estimated_premium': premium_map[risk_label],
            'explanation':      explanation,
        }

    except Exception as e:
        raise HTTPException(
            500, f'Risk scoring failed: {str(e)}'
        )

# ──────────────────────────────────────────────────────────
# RUN SERVER
# ──────────────────────────────────────────────────────────
if __name__ == '__main__':
    port = int(os.getenv('PORT', 5001))
    print(f"Starting ML Server on 0.0.0.0:{port}")
    uvicorn.run(
        app,
        host='0.0.0.0',
        port=port,
        reload=False,
    )
