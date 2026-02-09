import json
import os
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import KMeans

# CONFIG
BASE_DIR = os.path.dirname(os.path.abspath(__file__)) # backend/rag
PROJECT_ROOT = os.path.dirname(os.path.dirname(BASE_DIR)) # motor_insurance_ai
DATA_DIR = os.path.join(PROJECT_ROOT, "data") # motor_insurance_ai/data
INPUT_FILE = os.path.join(DATA_DIR, "All_Polices_ENRICHED.json")
OUTPUT_FILE = os.path.join(DATA_DIR, "All_Polices_SEMANTIC.json")

def enrich_data():
    if not os.path.exists(INPUT_FILE):
        print(f"Error: Input file not found at {INPUT_FILE}")
        return

    print("Loading data...")
    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    df = pd.DataFrame(data)
    print(f"Loaded {len(df)} clauses.")

    # 1. Preprocess Text (Simple)
    # Use clause_text, fill n/a
    texts = df["clause_text"].fillna("").tolist()

    # 2. Vectorize
    print("Vectorizing text...")
    vectorizer = TfidfVectorizer(max_features=1000, stop_words="english")
    X = vectorizer.fit_transform(texts)

    # 3. Cluster (K=8 for diverse topics: Theft, Fire, Liability, TP, PA, etc.)
    print("Clustering...")
    k = 8
    kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
    clusters = kmeans.fit_predict(X)
    
    df["semantic_cluster_id"] = clusters

    # 4. (Optional) Auto-Label Clusters
    # We get top terms for each cluster to guess a name
    print("Generating topic labels...")
    terms = vectorizer.get_feature_names_out()
    ordered_centroids = kmeans.cluster_centers_.argsort()[:, ::-1]
    
    cluster_names = {}
    for i in range(k):
        top_terms = [terms[ind] for ind in ordered_centroids[i, :3]] # Top 3 words
        label = f"Topic: {' '.join(top_terms)}"
        cluster_names[i] = label
        print(f"Cluster {i}: {label}")
    
    df["semantic_topic"] = df["semantic_cluster_id"].map(cluster_names)

    # 5. Save
    print(f"Saving enriched data to {OUTPUT_FILE}...")
    records = df.to_dict(orient="records")
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(records, f, indent=2)
    
    print("Success! Data enriched with semantic tags.")

if __name__ == "__main__":
    enrich_data()
