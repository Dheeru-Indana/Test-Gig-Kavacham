import os
import joblib
import json

MODEL_DIR = os.path.join(os.path.dirname(__file__), '..', 'models')
print(f"Checking models in: {MODEL_DIR}")

models = {}

# Pricing
try:
    models['pricing'] = joblib.load(os.path.join(MODEL_DIR, 'pricing_model.pkl'))
    print("Pricing loaded")
except Exception as e:
    print(f"Pricing failed: {e}")

# DCS
try:
    models['dcs_rf'] = joblib.load(os.path.join(MODEL_DIR, 'dcs_rf_model.pkl'))
    print("DCS RF loaded")
except Exception as e:
    print(f"DCS RF failed: {e}")

# Chatbot
try:
    from sentence_transformers import SentenceTransformer
    models['sbert'] = SentenceTransformer('all-MiniLM-L6-v2')
    print("SBERT loaded")
    models['intent_lr'] = joblib.load(os.path.join(MODEL_DIR, 'intent_lr_model.pkl'))
    print("Intent LR loaded")
except Exception as e:
    print(f"Chatbot failed: {e}")

print("Debug finished")
