import os
import ml.services.ml_server
print('ML server OK')
models = [
    'pricing_model.pkl',
    'dcs_lstm_model.keras',
    'fraud_isolation_forest.pkl',
    'fraud_xgb_classifier.pkl',
    'intent_embeddings.pkl',
    'risk_scorer_model.pkl',
]
model_dir = 'ml/models'
for m in models:
    path = os.path.join(model_dir, m)
    status = 'EXISTS' if os.path.exists(path) else 'MISSING'
    print(f'{status}: {m}')
