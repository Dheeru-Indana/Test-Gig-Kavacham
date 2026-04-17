import pandas as pd
import numpy as np
import joblib
import os
import json
import warnings
warnings.filterwarnings('ignore')

from sklearn.ensemble import IsolationForest
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    classification_report, accuracy_score, f1_score
)
from xgboost import XGBClassifier
import lime
import lime.lime_tabular

DATA_PATH = os.path.join(
    os.path.dirname(__file__), '..', 'data',
    'fraud_training.csv'
)
MODEL_DIR = os.path.join(
    os.path.dirname(__file__), '..', 'models'
)
os.makedirs(MODEL_DIR, exist_ok=True)

print("=" * 60)
print("GigKavacham — Two-Stage Fraud Detection Model")
print("=" * 60)

df = pd.read_csv(DATA_PATH)
print(f"Loaded {len(df)} rows")
print("Class distribution:")
print(df['decision'].value_counts())

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

X = df[FRAUD_FEATURES].values
y_decision = df['decision'].map(
    {'pass': 0, 'review': 1, 'fail': 2}
).values

scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

X_train, X_test, y_train, y_test = train_test_split(
    X_scaled, y_decision, test_size=0.2,
    random_state=42, stratify=y_decision
)

# ─── Stage 1: Isolation Forest ───────────────────────────
print("\nStage 1: Training Isolation Forest...")

clean_mask = df['decision'] == 'pass'
X_clean = scaler.transform(
    df.loc[clean_mask, FRAUD_FEATURES].values
)

iso_forest = IsolationForest(
    n_estimators=200,
    contamination=0.30,
    max_samples='auto',
    random_state=42,
    n_jobs=-1,
)
iso_forest.fit(X_clean)

anomaly_scores = iso_forest.decision_function(X_scaled)
iso_scores = 100 * (1 - (
    (anomaly_scores - anomaly_scores.min()) /
    (anomaly_scores.max() - anomaly_scores.min())
))

print(f"  Trained on {X_clean.shape[0]} clean claims")
print(f"  Mean score (clean): "
      f"{iso_scores[clean_mask.values].mean():.1f}")
print(f"  Mean score (fraud): "
      f"{iso_scores[~clean_mask.values].mean():.1f}")

iso_train_scores = iso_scores[:int(len(X_scaled) * 0.8)]
iso_test_scores  = iso_scores[int(len(X_scaled) * 0.8):]

X_train_aug = np.hstack([
    X_train,
    iso_train_scores[:len(X_train)].reshape(-1, 1)
])
X_test_aug = np.hstack([
    X_test,
    iso_test_scores[:len(X_test)].reshape(-1, 1)
])

# ─── Stage 2: XGBoost Classifier ────────────────────────
print("\nStage 2: Training XGBoost Classifier...")

xgb_fraud = XGBClassifier(
    n_estimators=300,
    max_depth=5,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    eval_metric='mlogloss',
    scale_pos_weight=2,
    random_state=42,
    verbosity=0,
)
xgb_fraud.fit(
    X_train_aug, y_train,
    eval_set=[(X_test_aug, y_test)],
    verbose=False,
)

y_pred = xgb_fraud.predict(X_test_aug)
acc = accuracy_score(y_test, y_pred)
f1  = f1_score(y_test, y_pred, average='weighted')

print(f"\nTwo-Stage Fraud Model Results:")
print(f"  Accuracy: {acc:.4f}")
print(f"  F1 Score: {f1:.4f}")
print(f"\nClassification Report:")
print(classification_report(
    y_test, y_pred,
    target_names=['pass', 'review', 'fail']
))

cv_scores = cross_val_score(
    xgb_fraud, X_train_aug, y_train,
    cv=5, scoring='f1_weighted'
)
print(f"  CV F1: {cv_scores.mean():.4f} "
      f"+/- {cv_scores.std():.4f}")

# ─── LIME — Test Only, Do Not Pickle ─────────────────────
print("\nSetting up LIME explainer (test only)...")

augmented_features = FRAUD_FEATURES + ['isolation_forest_score']

lime_explainer = lime.lime_tabular.LimeTabularExplainer(
    X_train_aug,
    feature_names=augmented_features,
    class_names=['pass', 'review', 'fail'],
    mode='classification',
    discretize_continuous=True,
    random_state=42,
)

def explain_fraud_decision(
    claim_features: np.ndarray,
    iso_score: float,
) -> dict:
    claim_aug  = np.append(claim_features, iso_score)
    exp        = lime_explainer.explain_instance(
        claim_aug,
        xgb_fraud.predict_proba,
        num_features=5,
        top_labels=1,
    )
    pred_class = xgb_fraud.predict([claim_aug])[0]
    pred_label = ['pass', 'review', 'fail'][pred_class]
    pred_proba = xgb_fraud.predict_proba([claim_aug])[0]

    top_signals = []
    for feat_desc, weight in exp.as_list(label=pred_class)[:3]:
        direction = 'increases' if weight > 0 else 'reduces'
        top_signals.append(f"{feat_desc} {direction} fraud risk")

    return {
        'decision':   pred_label,
        'confidence': round(float(pred_proba.max()), 3),
        'iso_score':  round(float(iso_score), 1),
        'top_signals': top_signals,
    }

test_example = X_test[0]
test_iso     = iso_test_scores[0]
example      = explain_fraud_decision(test_example, test_iso)
print(f"\nExample LIME explanation:")
print(f"  Decision:    {example['decision']}")
print(f"  Confidence:  {example['confidence']}")
print(f"  Top signals: {example['top_signals']}")

# ─── Save Artifacts ──────────────────────────────────────
joblib.dump(
    iso_forest,
    os.path.join(MODEL_DIR, 'fraud_isolation_forest.pkl')
)
joblib.dump(
    xgb_fraud,
    os.path.join(MODEL_DIR, 'fraud_xgb_classifier.pkl')
)
joblib.dump(
    scaler,
    os.path.join(MODEL_DIR, 'fraud_scaler.pkl')
)

# LIME cannot be pickled due to lambda functions
# Save config so it can be recreated at inference time
lime_config = {
    'feature_names': augmented_features,
    'class_names':   ['pass', 'review', 'fail'],
    'mode':          'classification',
    'note':          'Recreate LimeTabularExplainer at inference using X_train_aug shape and these feature names',
}
with open(
    os.path.join(MODEL_DIR, 'fraud_lime_config.json'), 'w'
) as f:
    json.dump(lime_config, f, indent=2)

metrics = {
    'model':         'TwoStage_IsolationForest_XGBoost_LIME',
    'accuracy':      round(float(acc), 4),
    'f1_weighted':   round(float(f1), 4),
    'cv_f1_mean':    round(float(cv_scores.mean()), 4),
    'cv_f1_std':     round(float(cv_scores.std()), 4),
    'features':      FRAUD_FEATURES,
    'stage1':        'IsolationForest (unsupervised anomaly)',
    'stage2':        'XGBoost Classifier (supervised decision)',
    'explainability':'LIME per-claim (recreated at inference)',
    'thresholds': {
        'pass':   'score < 30',
        'review': '30 <= score <= 60',
        'fail':   'score > 60',
    },
}
with open(
    os.path.join(MODEL_DIR, 'fraud_metrics.json'), 'w'
) as f:
    json.dump(metrics, f, indent=2)

print(f"\nSaved: fraud_isolation_forest.pkl")
print(f"Saved: fraud_xgb_classifier.pkl")
print(f"Saved: fraud_scaler.pkl")
print(f"Saved: fraud_lime_config.json")
print(f"Saved: fraud_metrics.json")
print("Fraud model training complete.")