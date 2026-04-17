import json
import joblib
import os
import numpy as np
import warnings
warnings.filterwarnings('ignore')

from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import cross_val_score
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report

DATA_PATH = os.path.join(
    os.path.dirname(__file__), '..', 'data',
    'chatbot_intents.json'
)
MODEL_DIR = os.path.join(
    os.path.dirname(__file__), '..', 'models'
)
os.makedirs(MODEL_DIR, exist_ok=True)

print("=" * 60)
print("GigKavacham — Sentence-BERT Intent Classifier")
print("=" * 60)

with open(DATA_PATH) as f:
    data = json.load(f)

intents = data['intents']
examples = []
labels = []

for intent_obj in intents:
    for example in intent_obj['examples']:
        examples.append(example)
        labels.append(intent_obj['intent'])

print(f"Loaded {len(examples)} examples across "
      f"{len(set(labels))} intents")

print("\nLoading Sentence-BERT (all-MiniLM-L6-v2)...")
print("(Downloads ~22MB on first run)")

sbert = SentenceTransformer('all-MiniLM-L6-v2')

print("Encoding all training examples...")
embeddings = sbert.encode(
    examples,
    show_progress_bar=True,
    batch_size=32,
)
print(f"Embedding shape: {embeddings.shape}")

intent_embeddings = {}
for intent_obj in intents:
    intent_examples = intent_obj['examples']
    intent_embs = sbert.encode(intent_examples, batch_size=32)
    intent_embeddings[intent_obj['intent']] = {
        'mean_embedding': intent_embs.mean(axis=0),
        'all_embeddings': intent_embs,
        'examples':       intent_examples,
    }

def classify_by_similarity(
    query: str,
    threshold: float = 0.35,
) -> dict:
    query_emb = sbert.encode([query])
    scores = {}
    for intent, idata in intent_embeddings.items():
        mean_sim = cosine_similarity(
            query_emb,
            idata['mean_embedding'].reshape(1, -1)
        )[0][0]
        all_sims = cosine_similarity(
            query_emb,
            idata['all_embeddings']
        )[0]
        top3_sim = np.sort(all_sims)[::-1][:3].mean()
        scores[intent] = 0.4 * mean_sim + 0.6 * top3_sim

    best_intent = max(scores, key=scores.get)
    best_score  = scores[best_intent]
    sorted_scores = sorted(
        scores.items(), key=lambda x: x[1], reverse=True
    )
    return {
        'intent': best_intent if best_score >= threshold
                  else 'fallback',
        'confidence': round(float(best_score), 4),
        'top3': [
            {'intent': i, 'score': round(float(s), 4)}
            for i, s in sorted_scores[:3]
        ],
    }

print("\nTraining Logistic Regression on SBERT embeddings...")

le = LabelEncoder()
y_encoded = le.fit_transform(labels)

lr = LogisticRegression(
    C=10.0,
    max_iter=1000,
    solver='lbfgs',
    random_state=42,
)
lr.fit(embeddings, y_encoded)

cv_scores = cross_val_score(
    lr, embeddings, y_encoded, cv=5, scoring='f1_weighted'
)
print(f"  LR on SBERT CV F1: "
      f"{cv_scores.mean():.4f} +/- {cv_scores.std():.4f}")

def classify_intent(query: str) -> dict:
    query_emb   = sbert.encode([query])
    sim_result  = classify_by_similarity(query)
    lr_pred     = lr.predict(query_emb)[0]
    lr_proba    = lr.predict_proba(query_emb)[0]
    lr_intent   = le.inverse_transform([lr_pred])[0]
    lr_conf     = lr_proba.max()

    if sim_result['intent'] == lr_intent:
        final_intent = sim_result['intent']
        final_conf   = max(sim_result['confidence'], lr_conf)
    else:
        if lr_conf > sim_result['confidence'] + 0.1:
            final_intent = lr_intent
            final_conf   = lr_conf
        else:
            final_intent = sim_result['intent']
            final_conf   = sim_result['confidence']

    if final_conf < 0.30:
        final_intent = 'fallback'

    return {
        'intent':     final_intent,
        'confidence': round(float(final_conf), 4),
        'method':     'sbert_hybrid',
    }

print("\nTesting classifier on natural language queries:")
test_queries = [
    "I lost wages because of the storm",
    "Why does it cost me this much per week",
    "My money did not arrive in my account",
    "The score on my dashboard is high",
    "I want better coverage",
    "Can you explain parametric insurance",
    "My GPS was showing wrong location",
    "I want to know what is not included",
]

for q in test_queries:
    result = classify_intent(q)
    print(f"  '{q}'")
    print(f"    -> {result['intent']} "
          f"(confidence: {result['confidence']:.3f})")

joblib.dump(
    intent_embeddings,
    os.path.join(MODEL_DIR, 'intent_embeddings.pkl')
)
joblib.dump(
    lr,
    os.path.join(MODEL_DIR, 'intent_lr_model.pkl')
)
joblib.dump(
    le,
    os.path.join(MODEL_DIR, 'intent_label_encoder.pkl')
)

config = {
    'sbert_model':        'all-MiniLM-L6-v2',
    'embedding_dim':      384,
    'num_intents':        len(intents),
    'total_examples':     len(examples),
    'similarity_threshold': 0.35,
    'fallback_threshold': 0.30,
    'method':             'SBERT cosine similarity + LR hybrid',
    'cv_f1':              round(float(cv_scores.mean()), 4),
}
with open(
    os.path.join(MODEL_DIR, 'intent_config.json'), 'w'
) as f:
    json.dump(config, f, indent=2)

print(f"\nSaved: intent_embeddings.pkl")
print(f"Saved: intent_lr_model.pkl")
print(f"Saved: intent_label_encoder.pkl")
print(f"Saved: intent_config.json")
print("Chatbot intent model training complete.")