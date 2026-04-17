import pandas as pd
import numpy as np
import joblib
import os
import json
import shap
import warnings
warnings.filterwarnings('ignore')

from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.ensemble import RandomForestRegressor, StackingRegressor
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from xgboost import XGBRegressor
from lightgbm import LGBMRegressor

DATA_PATH = os.path.join(
    os.path.dirname(__file__), '..', 'data',
    'pricing_training.csv'
)
MODEL_DIR = os.path.join(os.path.dirname(__file__), '..', 'models')
os.makedirs(MODEL_DIR, exist_ok=True)

print("=" * 60)
print("GigKavacham — Stacked Ensemble Pricing Model")
print("=" * 60)

# ─── Load Data ───────────────────────────────────────────
df = pd.read_csv(DATA_PATH)
print(f"Loaded {len(df)} rows")

# ─── Encode Categoricals ─────────────────────────────────
le_city_tier = LabelEncoder()
le_platform = LabelEncoder()

df['city_tier_enc'] = le_city_tier.fit_transform(df['city_tier'])
df['platform_enc'] = le_platform.fit_transform(df['platform_type'])

FEATURES = [
    'city_tier_enc', 'platform_enc',
    'month_of_year', 'shield_score',
    'daily_earnings', 'weekly_earnings',
    'renewal_count', 'historical_payout_count',
    'claim_frequency', 'flood_risk_score',
    'aqi_risk_score', 'heat_risk_score',
    'rainfall_risk_score', 'traffic_disruption_risk',
    'social_disruption_risk', 'historical_disruption_freq',
    'is_monsoon', 'is_heat_season', 'is_holiday_period',
]
TARGET = 'weekly_premium'

X = df[FEATURES]
y = df[TARGET]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# ─── Base Models ─────────────────────────────────────────
xgb = XGBRegressor(
    n_estimators=300,
    max_depth=6,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    min_child_weight=3,
    reg_alpha=0.1,
    reg_lambda=1.0,
    random_state=42,
    verbosity=0,
)

lgbm = LGBMRegressor(
    n_estimators=300,
    max_depth=6,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    min_child_samples=20,
    reg_alpha=0.1,
    reg_lambda=1.0,
    random_state=42,
    verbose=-1,
)

rf = RandomForestRegressor(
    n_estimators=200,
    max_depth=8,
    min_samples_leaf=5,
    random_state=42,
    n_jobs=-1,
)

# ─── Stacked Ensemble ────────────────────────────────────
estimators = [
    ('xgb', xgb),
    ('lgbm', lgbm),
    ('rf', rf),
]

stack = StackingRegressor(
    estimators=estimators,
    final_estimator=Ridge(alpha=1.0),
    cv=5,
    n_jobs=-1,
)

print("\nTraining stacked ensemble (XGBoost + LightGBM + RF + Ridge)...")
stack.fit(X_train_scaled, y_train)

# ─── Evaluate ────────────────────────────────────────────
y_pred = stack.predict(X_test_scaled)

mae = mean_absolute_error(y_test, y_pred)
rmse = np.sqrt(mean_squared_error(y_test, y_pred))
r2 = r2_score(y_test, y_pred)

print(f"\nStacked Ensemble Results:")
print(f"  MAE:  INR{mae:.2f}")
print(f"  RMSE: INR{rmse:.2f}")
print(f"  R²:   {r2:.4f}")

# Individual model scores for comparison
for name, model in estimators:
    model.fit(X_train_scaled, y_train)
    pred = model.predict(X_test_scaled)
    ind_mae = mean_absolute_error(y_test, pred)
    print(f"  {name.upper()} alone MAE: INR{ind_mae:.2f}")

# ─── SHAP Explainability ─────────────────────────────────
print("\nComputing SHAP values for explainability...")

# Use XGBoost for SHAP (most compatible)
xgb_alone = XGBRegressor(
    n_estimators=300, max_depth=6,
    learning_rate=0.05, random_state=42, verbosity=0
)
xgb_alone.fit(X_train_scaled, y_train)

explainer = shap.TreeExplainer(xgb_alone)
shap_values = explainer.shap_values(X_test_scaled[:100])

mean_shap = np.abs(shap_values).mean(axis=0)
feature_importance = dict(zip(FEATURES, mean_shap.tolist()))
feature_importance_sorted = dict(
    sorted(feature_importance.items(),
           key=lambda x: x[1], reverse=True)
)

print("\nTop 5 features by SHAP importance:")
for i, (feat, val) in enumerate(
    list(feature_importance_sorted.items())[:5]
):
    print(f"  {i+1}. {feat}: {val:.4f}")

# ─── Premium Explanation Generator ──────────────────────
def generate_premium_explanation(
    row: dict,
    predicted_premium: float,
    shap_vals: np.ndarray,
    feature_names: list,
) -> str:
    top_indices = np.argsort(np.abs(shap_vals))[::-1][:3]
    top_features = [feature_names[i] for i in top_indices]
    top_shap = [shap_vals[i] for i in top_indices]

    reasons = []
    feature_labels = {
        'city_tier_enc': 'city tier',
        'aqi_risk_score': 'AQI disruption risk',
        'flood_risk_score': 'flood risk',
        'heat_risk_score': 'heat stress risk',
        'is_monsoon': 'monsoon season load',
        'shield_score': 'Shield Score',
        'weekly_earnings': 'weekly earnings band',
        'platform_enc': 'platform type',
        'rainfall_risk_score': 'rainfall risk',
        'historical_disruption_freq': 'historical disruption frequency',
        'claim_frequency': 'claim history',
    }

    for feat, val in zip(top_features, top_shap):
        label = feature_labels.get(feat, feat)
        direction = 'increases' if val > 0 else 'reduces'
        reasons.append(f"{label} {direction} your premium")

    return (
        f"Your premium is INR{int(predicted_premium)}/week because "
        f"{reasons[0]}, {reasons[1]}, and {reasons[2]}."
    )

# ─── Save Artifacts ──────────────────────────────────────
joblib.dump(stack, os.path.join(MODEL_DIR, 'pricing_model.pkl'))
joblib.dump(scaler, os.path.join(MODEL_DIR, 'pricing_scaler.pkl'))
joblib.dump(le_city_tier, os.path.join(MODEL_DIR, 'le_city_tier.pkl'))
joblib.dump(le_platform, os.path.join(MODEL_DIR, 'le_platform.pkl'))
joblib.dump(xgb_alone, os.path.join(MODEL_DIR, 'pricing_xgb_shap.pkl'))
joblib.dump(explainer, os.path.join(MODEL_DIR, 'pricing_shap_explainer.pkl'))

metrics = {
    'model': 'StackedEnsemble_XGB_LGBM_RF_Ridge',
    'mae': round(mae, 2),
    'rmse': round(rmse, 2),
    'r2': round(r2, 4),
    'feature_importance': feature_importance_sorted,
    'features': FEATURES,
    'train_size': len(X_train),
    'test_size': len(X_test),
}
with open(
    os.path.join(MODEL_DIR, 'pricing_metrics.json'), 'w'
) as f:
    json.dump(metrics, f, indent=2)

print(f"\nSaved: pricing_model.pkl, pricing_scaler.pkl")
print(f"Saved: pricing_metrics.json")
print("Pricing model training complete.")
