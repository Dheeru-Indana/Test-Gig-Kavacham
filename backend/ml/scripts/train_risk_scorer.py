import pandas as pd
import numpy as np
import joblib
import os
import json
import warnings
warnings.filterwarnings('ignore')

from sklearn.naive_bayes import GaussianNB
from sklearn.neural_network import MLPClassifier
from sklearn.ensemble import VotingClassifier
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import classification_report, accuracy_score

DATA_PATH = os.path.join(
    os.path.dirname(__file__), '..', 'data',
    'pricing_training.csv'
)
MODEL_DIR = os.path.join(os.path.dirname(__file__), '..', 'models')
os.makedirs(MODEL_DIR, exist_ok=True)

print("=" * 60)
print("GigKavacham — Registration Risk Scorer")
print("GaussianNB + MLP Voting Ensemble")
print("=" * 60)

df = pd.read_csv(DATA_PATH)

# Create risk band labels from weekly premium
# (Premium is a proxy for risk level)
df['risk_band'] = pd.cut(
    df['weekly_premium'],
    bins=[0, 69, 119, 179],
    labels=['low', 'medium', 'high']
)

le_tier = LabelEncoder()
le_platform = LabelEncoder()
le_risk = LabelEncoder()

df['tier_enc'] = le_tier.fit_transform(df['city_tier'])
df['platform_enc'] = le_platform.fit_transform(
    df['platform_type']
)
df['risk_enc'] = le_risk.fit_transform(df['risk_band'])

FEATURES = [
    'tier_enc', 'platform_enc',
    'month_of_year', 'weekly_earnings',
    'flood_risk_score', 'aqi_risk_score',
    'heat_risk_score', 'is_monsoon',
    'is_heat_season', 'shield_score',
]

X = df[FEATURES].values
y = df['risk_enc'].values

scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

X_train, X_test, y_train, y_test = train_test_split(
    X_scaled, y, test_size=0.2,
    random_state=42, stratify=y
)

# ─── Gaussian Naive Bayes ────────────────────────────────
gnb = GaussianNB(var_smoothing=1e-8)

# ─── MLP Neural Network ──────────────────────────────────
mlp = MLPClassifier(
    hidden_layer_sizes=(64, 32),
    activation='relu',
    max_iter=500,
    random_state=42,
    early_stopping=True,
    validation_fraction=0.1,
)

# ─── Voting Ensemble ─────────────────────────────────────
voting = VotingClassifier(
    estimators=[('gnb', gnb), ('mlp', mlp)],
    voting='soft',
)

print("Training GaussianNB + MLP voting ensemble...")
voting.fit(X_train, y_train)

y_pred = voting.predict(X_test)
acc = accuracy_score(y_test, y_pred)
cv = cross_val_score(
    voting, X_scaled, y, cv=5, scoring='f1_weighted'
)

print(f"\nRisk Scorer Results:")
print(f"  Accuracy: {acc:.4f}")
print(f"  CV F1: {cv.mean():.4f} +/- {cv.std():.4f}")
print(f"\nClassification Report:")
print(classification_report(
    y_test, y_pred,
    target_names=le_risk.classes_
))

def predict_risk_at_registration(
    city_tier: str,
    platform_type: str,
    month: int,
    weekly_earnings: float,
    flood_risk: float,
    aqi_risk: float,
    heat_risk: float,
    shield_score: int = 75,
) -> dict:
    is_monsoon = 1 if month in [6, 7, 8, 9] else 0
    is_heat = 1 if month in [4, 5, 6] else 0

    try:
        tier_enc = le_tier.transform([city_tier])[0]
        platform_enc = le_platform.transform([platform_type])[0]
    except ValueError:
        tier_enc = 0
        platform_enc = 0

    features = np.array([[
        tier_enc, platform_enc, month,
        weekly_earnings, flood_risk, aqi_risk,
        heat_risk, is_monsoon, is_heat, shield_score,
    ]])
    features_scaled = scaler.transform(features)

    pred = voting.predict(features_scaled)[0]
    proba = voting.predict_proba(features_scaled)[0]

    risk_label = le_risk.inverse_transform([pred])[0]
    confidence = proba.max()

    plan_map = {
        'low': 'Shield Lite',
        'medium': 'Shield Plus',
        'high': 'Shield Max',
    }
    premium_map = {
        'low': 49, 'medium': 99, 'high': 179
    }

    return {
        'risk_band': risk_label,
        'confidence': round(float(confidence), 3),
        'recommended_plan': plan_map[risk_label],
        'estimated_premium': premium_map[risk_label],
        'explanation': (
            f"Based on your {city_tier} zone, "
            f"{platform_type} platform, and current "
            f"seasonal risk, {plan_map[risk_label]} "
            f"provides the right level of protection "
            f"at INR{premium_map[risk_label]}/week."
        ),
    }

# Test
test_result = predict_risk_at_registration(
    'Tier 3', 'Delivery Partner', 7,
    4200, 0.6, 0.7, 0.5
)
print(f"\nSample registration prediction:")
print(f"  Risk Band: {test_result['risk_band']}")
print(f"  Recommended: {test_result['recommended_plan']}")
print(f"  Explanation: {test_result['explanation']}")

# ─── Save Artifacts ──────────────────────────────────────
joblib.dump(
    voting,
    os.path.join(MODEL_DIR, 'risk_scorer_model.pkl')
)
joblib.dump(
    scaler,
    os.path.join(MODEL_DIR, 'risk_scorer_scaler.pkl')
)
joblib.dump(
    le_tier,
    os.path.join(MODEL_DIR, 'risk_scorer_le_tier.pkl')
)
joblib.dump(
    le_platform,
    os.path.join(MODEL_DIR, 'risk_scorer_le_platform.pkl')
)
joblib.dump(
    le_risk,
    os.path.join(MODEL_DIR, 'risk_scorer_le_risk.pkl')
)

metrics = {
    'model': 'VotingEnsemble_GaussianNB_MLP',
    'accuracy': round(float(acc), 4),
    'cv_f1': round(float(cv.mean()), 4),
    'features': FEATURES,
    'risk_bands': list(le_risk.classes_),
    'use_case': 'Registration-time risk classification',
}
with open(
    os.path.join(MODEL_DIR, 'risk_scorer_metrics.json'), 'w'
) as f:
    json.dump(metrics, f, indent=2)

print(f"\nSaved: risk_scorer_model.pkl")
print(f"Saved: risk_scorer_metrics.json")
print("Risk scorer training complete.")
