import json
import glob
import os
import numpy as np

# Prefer faiss for speed; fall back to hnswlib on systems where faiss
# is unavailable (e.g., many Windows installs). We try to import both
# and choose at runtime.
try:
    import faiss
    _HAS_FAISS = True
except Exception:
    _HAS_FAISS = False

try:
    import hnswlib
    _HAS_HNSW = True
except Exception:
    _HAS_HNSW = False

from sentence_transformers import SentenceTransformer

# -------- PATHS (SAFE & PORTABLE) --------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))          # backend/rag
PROJECT_ROOT = os.path.dirname(BASE_DIR)                       # backend

# Look for the dataset in several common locations to be robust
# Look for the dataset in several common locations to be robust
DATA_FILENAME = "All_Polices_SEMANTIC.json"
candidate_paths = [
    os.path.join(PROJECT_ROOT, "Data", DATA_FILENAME),
    os.path.join(PROJECT_ROOT, "data", DATA_FILENAME),
    os.path.join(os.path.dirname(PROJECT_ROOT), "Data", DATA_FILENAME),
    os.path.join(os.path.dirname(PROJECT_ROOT), "data", DATA_FILENAME),
    # Fallback to the old enriched file if semantic one missing
    os.path.join(PROJECT_ROOT, "data", "All_Polices_ENRICHED.json"),
]

DATA_PATH = None
for p in candidate_paths:
    if os.path.exists(p):
        DATA_PATH = p
        break

if DATA_PATH is None:
    raise FileNotFoundError(
        "Could not find dataset. Looked for: " + ";".join(candidate_paths)
    )

INDEX_DIR = os.path.join(BASE_DIR, "rag_index")

FAISS_PATH = os.path.join(INDEX_DIR, "faiss.index")
HNSW_PATH = os.path.join(INDEX_DIR, "hnsw.bin")
META_PATH = os.path.join(INDEX_DIR, "metadata.json")
EMB_PATH = os.path.join(INDEX_DIR, "embeddings.npy")


# -------- LOAD JSON FILES --------
all_clauses = []

with open(DATA_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
        all_clauses.extend(data)

print(f"[INFO] Total clauses loaded: {len(all_clauses)}")

# -------- EXTRACT TEXT --------
texts = [c["clause_text"] for c in all_clauses]

# -------- LOAD EMBEDDING MODEL --------
model = SentenceTransformer("all-MiniLM-L6-v2")

# -------- CREATE EMBEDDINGS --------
embeddings = model.encode(texts, convert_to_numpy=True)
embeddings = embeddings.astype("float32")

# Ensure index dir exists
os.makedirs(INDEX_DIR, exist_ok=True)

if _HAS_FAISS:
    # -------- BUILD FAISS INDEX --------
    dimension = embeddings.shape[1]
    index = faiss.IndexFlatL2(dimension)
    index.add(embeddings)
    faiss.write_index(index, FAISS_PATH)
    print("[SUCCESS] FAISS index created and saved.")

elif _HAS_HNSW:
    # -------- BUILD HNSW INDEX --------
    dim = embeddings.shape[1]
    p = hnswlib.Index(space='l2', dim=dim)
    p.init_index(max_elements=len(embeddings), ef_construction=200, M=16)
    p.add_items(embeddings, list(range(len(embeddings))))
    p.set_ef(50)
    p.save_index(HNSW_PATH)
    print("[SUCCESS] HNSW index created and saved.")

else:
    # Fallback: save raw embeddings for simple brute-force search
    np.save(EMB_PATH, embeddings)
    print("[WARN] Neither faiss nor hnswlib is available. Saved embeddings for brute-force retrieval.")

# -------- SAVE METADATA --------
with open(META_PATH, "w", encoding="utf-8") as f:
    json.dump(all_clauses, f, indent=2)

# Always save embeddings as well (useful for fallback retrieval)
np.save(EMB_PATH, embeddings)

print("[COMPLETE] Vector database build finished.")
