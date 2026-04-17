import pandas as pd
import numpy as np
import joblib
import os
import json
import warnings
warnings.filterwarnings('ignore')

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.metrics import mean_absolute_error, r2_score, accuracy_score
from prophet import Prophet
from datetime import datetime, timedelta

DATA_PATH = os.path.join(
    os.path.dirname(__file__), '..', 'data',
    'dcs_training.csv'
)
MODEL_DIR = os.path.join(os.path.dirname(__file__), '..', 'models')
os.makedirs(MODEL_DIR, exist_ok=True)

print("=" * 60)
print("GigKavacham — Random Forest DCS Forecasting Model")
print("=" * 60)

df = pd.read_csv(DATA_PATH)
print(f"Loaded {len(df)} rows")

le_tier = LabelEncoder()
df['tier_enc'] = le_tier.fit_transform(df['city_tier'])

SIGNAL_FEATURES = [
    'rainfall_score', 'aqi_score', 'heat_score',
    'order_drop_score', 'social_score',
]
CONTEXT_FEATURES = [
    'tier_enc', 'month_of_year', 'hour_of_day',
    'day_of_week', 'is_monsoon', 'is_heat_season',
    'prev_rainfall', 'prev_aqi', 'prev_heat',
    'current_dcs', 'prev_dcs', 'dcs_trend',
    'hist_avg_dcs',
]
ALL_FEATURES = SIGNAL_FEATURES + CONTEXT_FEATURES

scaler_x = StandardScaler()
X_all = scaler_x.fit_transform(df[ALL_FEATURES])
y_dcs = df['forecast_dcs'].values
# Convert prob to binary label for classifier if needed, or just use regressor
y_prob = df['disruption_probability'].values

X_train, X_test, y_dcs_train, y_dcs_test, y_prob_train, y_prob_test = train_test_split(
    X_all, y_dcs, y_prob, test_size=0.2, random_state=42
)

print("\nTraining Random Forest Regressor for DCS...")
rf_dcs = RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42)
rf_dcs.fit(X_train, y_dcs_train)

print("Training Random Forest Classifier for Disruption Probability...")
# We'll use a regressor for probability as well to get continuous values
rf_prob = RandomForestRegressor(n_estimators=100, max_depth=8, random_state=42)
rf_prob.fit(X_train, y_prob_train)

pred_dcs = rf_dcs.predict(X_test)
pred_prob = rf_prob.predict(X_test)

mae_dcs = mean_absolute_error(y_dcs_test, pred_dcs)
r2_dcs = r2_score(y_dcs_test, pred_dcs)
mae_prob = mean_absolute_error(y_prob_test, pred_prob)

print(f"\nRF DCS Forecast Results:")
print(f"  DCS MAE:  {mae_dcs:.2f}")
print(f"  DCS R2:   {r2_dcs:.4f}")
print(f"  Prob MAE: {mae_prob:.4f}")

print("\nTraining Prophet for 7-day weekly trend...")
prophet_df = pd.DataFrame({
    'ds': [
        datetime(2024, 1, 1) + timedelta(hours=i * 6)
        for i in range(len(df))
    ],
    'y': df['current_dcs'].values,
})

prophet_model = Prophet(
    seasonality_mode='multiplicative',
    yearly_seasonality=True,
    weekly_seasonality=True,
    daily_seasonality=True,
)
prophet_model.fit(prophet_df)

future = prophet_model.make_future_dataframe(periods=28, freq='6h')
forecast = prophet_model.predict(future)
trend_avg = float(forecast['trend'].tail(28).mean())
print(f"  Prophet 7-day trend: {trend_avg:.1f}")

# Save models
joblib.dump(rf_dcs,         os.path.join(MODEL_DIR, 'dcs_rf_model.pkl'))
joblib.dump(rf_prob,        os.path.join(MODEL_DIR, 'dcs_prob_model.pkl'))
joblib.dump(scaler_x,      os.path.join(MODEL_DIR, 'dcs_scaler_x.pkl'))
joblib.dump(le_tier,       os.path.join(MODEL_DIR, 'dcs_le_tier.pkl'))
joblib.dump(prophet_model, os.path.join(MODEL_DIR, 'dcs_prophet.pkl'))

metrics = {
    'model':           'RandomForest_DualHead_Fallback',
    'dcs_mae':         round(float(mae_dcs), 2),
    'dcs_r2':          round(float(r2_dcs), 4),
    'prob_mae':        round(float(mae_prob), 4),
    'features':        ALL_FEATURES,
    'prophet_trend':   round(trend_avg, 2),
}
with open(os.path.join(MODEL_DIR, 'dcs_metrics.json'), 'w') as f:
    json.dump(metrics, f, indent=2)

print(f"\nSaved: dcs_rf_model.pkl, dcs_prob_model.pkl")
print(f"Saved: dcs_scaler_x.pkl, dcs_le_tier.pkl, dcs_prophet.pkl")
print("DCS model training complete (Random Forest Fallback).")