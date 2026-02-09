import json
import os
import numpy as np

# Vector backends
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

# ================= PATHS (SAFE) =================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))      # backend/rag
INDEX_DIR = os.path.join(BASE_DIR, "rag_index")

META_PATH = os.path.join(INDEX_DIR, "metadata.json")
FAISS_PATH = os.path.join(INDEX_DIR, "faiss.index")
HNSW_PATH = os.path.join(INDEX_DIR, "hnsw.bin")
EMB_PATH = os.path.join(INDEX_DIR, "embeddings.npy")

# ================= CONFIG =================

SUPPORTED_COMPANIES = [
    "Acko", "Chola MS", "ICICI Lombard", "Kotak",
    "Magma HDI", "Navi", "Universal Sompo", "DHFL"
]

REJECTION_REASONS = {
    "ALCOHOL_INTOXICATION": ["alcohol", "intoxicat", "liquor", "drug"],
    "INVALID_LICENSE": ["invalid license", "no driving licence", "not licensed"],
    "FIR_NOT_SUBMITTED": ["fir", "delay in intimation", "police complaint"],
    "POLICY_EXPIRED": ["policy expired", "lapsed policy"],
    "ADDON_NOT_COVERED": ["addon not purchased", "add-on not covered"],
    "UNAUTHORIZED_USE": ["commercial use", "hire or reward"],
    "NON_DISCLOSURE": ["non disclosure", "material fact"],
    "MECHANICAL_FAILURE": ["wear and tear", "mechanical breakdown"]
}

SUPPORT_CONTEXT_KEYWORDS = [
    "driver", "licence", "license", "condition",
    "claim", "policy", "insured", "repudiat",
    "intimation", "accident"
]

# ================= LOAD METADATA & EMBEDDINGS =================

with open(META_PATH, "r", encoding="utf-8") as f:
    clauses = json.load(f)

embeddings = np.load(EMB_PATH)

# Lazy load variable
model = None

def load_model():
    global model
    if model is None:
        print("Loading SentenceTransformer model...")
        model = SentenceTransformer("all-MiniLM-L6-v2")
        print("Model loaded.")
    return model

# ================= LOAD INDEX =================

_index = None
_hnsw_index = None

if _HAS_FAISS and os.path.exists(FAISS_PATH):
    _index = faiss.read_index(FAISS_PATH)

elif _HAS_HNSW and os.path.exists(HNSW_PATH):
    _hnsw_index = hnswlib.Index(space="l2", dim=embeddings.shape[1])
    _hnsw_index.load_index(HNSW_PATH)

# ================= HELPERS (UNCHANGED LOGIC) =================

def format_clause(clause):
    return {
        "company": clause["company"],
        "policy_type": clause["policy_type"],
        "doc_name": clause.get("doc_name"),
        "clause_id": clause.get("clause_id"),
        "clause_type": clause.get("clause_type"),
        "clause_text": clause["clause_text"],
        "semantic_topic": clause.get("semantic_topic"),
        "semantic_cluster_id": clause.get("semantic_cluster_id")
    }

def detect_rejection_reasons(text):
    text = text.lower()
    return [
        reason for reason, kws in REJECTION_REASONS.items()
        if any(k in text for k in kws)
    ]

def prioritize_by_reason(results, detected_reasons, query=""):
    primary, secondary = [], []
    query_lower = query.lower()

    for r in results:
        text = r["clause_text"].lower()
        topic = (r.get("semantic_topic") or "").lower()
        
        # 1. Match Rejection Reasons (High Priority)
        reason_match = any(
            kw in text
            for reason in detected_reasons
            for kw in REJECTION_REASONS[reason]
        )
        
        # 2. Match Semantic Topic (Medium Priority)
        # Check if any words from the topic label appear in the query
        # Format "Topic: theft burglary..." -> ["theft", "burglary"]
        topic_words = [w for w in topic.replace("topic:", "").strip().split() if len(w) > 3]
        topic_match = any(w in query_lower for w in topic_words)

        if reason_match or topic_match:
            primary.append(r)
        else:
            secondary.append(r)

    return primary, secondary

def filter_supporting_context(secondary):
    return [
        r for r in secondary
        if any(k in r["clause_text"].lower() for k in SUPPORT_CONTEXT_KEYWORDS)
    ]

# ================= RETRIEVAL =================

def retrieve_clauses(query, company, policy_type, top_k=15):
    # 1. Exact Match
    valid_indices = [
        i for i, c in enumerate(clauses)
        if c["company"] == company and c["policy_type"] == policy_type
    ]

    # 2. Case-Insensitive Match
    if not valid_indices:
        valid_indices = [
            i for i, c in enumerate(clauses)
            if c["company"].lower() == company.lower() and c["policy_type"].lower() == policy_type.lower()
        ]

    # 3. Fallback to Default (Acko Two Wheeler) for Demo/Testing if generic is requested
    if not valid_indices and (company in ["General", "SafeGuard Insure"] or not company):
        print(f"RAG: No match for {company}/{policy_type}. Falling back to Acko/Two Wheeler.")
        valid_indices = [
            i for i, c in enumerate(clauses)
            if c["company"] == "Acko" and c["policy_type"] == "Two Wheeler"
        ]

    if not valid_indices:
        return []

    vectors = embeddings[valid_indices]
    if model is None:
        load_model()
    
    query_vec = model.encode([query]).astype("float32")

    if _index:
        sub = faiss.IndexFlatL2(vectors.shape[1])
        sub.add(vectors)
        _, idxs = sub.search(query_vec, min(top_k, len(valid_indices)))
        return [format_clause(clauses[valid_indices[i]]) for i in idxs[0]]

    dists = ((vectors - query_vec) ** 2).sum(axis=1)
    idxs = np.argsort(dists)[:top_k]
    return [format_clause(clauses[valid_indices[i]]) for i in idxs]

def get_reason_aware_clauses(query, company, policy_type):
    detected = detect_rejection_reasons(query)

    insurer_results = retrieve_clauses(query, company, policy_type)
    primary, secondary = prioritize_by_reason(insurer_results, detected, query)

    # Increase limits
    secondary = filter_supporting_context(secondary)[:5]
    return primary, secondary
