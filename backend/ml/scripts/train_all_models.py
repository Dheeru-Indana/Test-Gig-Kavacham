import subprocess
import sys
import os
import json
import time

scripts_dir = os.path.dirname(__file__)
model_dir = os.path.join(scripts_dir, '..', 'models')

scripts = [
    ('train_pricing.py',        'Stacked Ensemble Pricing'),
    ('train_dcs.py',            'Bidirectional LSTM DCS'),
    ('train_fraud.py',          'Two-Stage Fraud Detection'),
    ('train_chatbot_intent.py', 'Sentence-BERT Intent'),
    ('train_risk_scorer.py',    'GaussianNB + MLP Risk Scorer'),
]

print("=" * 60)
print("GigKavacham — Training All ML Models")
print("=" * 60)

results = {}
total_start = time.time()

for script_name, description in scripts:
    path = os.path.join(scripts_dir, script_name)
    print(f"\nTraining: {description}")
    print("-" * 40)
    start = time.time()

    result = subprocess.run(
        [sys.executable, path],
        capture_output=False,
        text=True,
    )

    duration = time.time() - start
    success = result.returncode == 0
    results[description] = {
        'success': success,
        'duration_seconds': round(duration, 1),
    }

    if success:
        print(f"COMPLETE in {duration:.1f}s")
    else:
        print(f"FAILED after {duration:.1f}s")

total_duration = time.time() - total_start
print("\n" + "=" * 60)
print("Training Summary")
print("=" * 60)

for desc, res in results.items():
    status = "PASS" if res['success'] else "FAIL"
    print(f"  [{status}] {desc} — {res['duration_seconds']}s")

# Load and summarise all metrics
print("\nModel Performance Summary:")
metrics_files = [
    ('pricing_metrics.json',     'Pricing'),
    ('dcs_metrics.json',         'DCS Forecast'),
    ('fraud_metrics.json',       'Fraud Detection'),
    ('intent_config.json',       'Chatbot Intent'),
    ('risk_scorer_metrics.json', 'Risk Scorer'),
]

for fname, label in metrics_files:
    fpath = os.path.join(model_dir, fname)
    if os.path.exists(fpath):
        with open(fpath) as f:
            m = json.load(f)
        if 'mae' in m:
            print(f"  {label}: MAE={m['mae']}, R2={m['r2']}")
        elif 'accuracy' in m:
            print(f"  {label}: Acc={m['accuracy']}, F1={m.get('f1_weighted', m.get('cv_f1', '?'))}")
        elif 'cv_f1' in m:
            print(f"  {label}: CV F1={m['cv_f1']}")

print(f"\nTotal training time: {total_duration:.1f}s")
print(f"Models saved to: {os.path.abspath(model_dir)}")
print("=" * 60)
print("Next: integrate models into ml_server.py")
