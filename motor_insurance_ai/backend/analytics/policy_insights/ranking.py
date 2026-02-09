from .data_loader import get_analytics_df
import pandas as pd
import numpy as np

# Keywords indicating strict exclusion if section/cluster is ambiguous
STRICT_KEYWORDS = ["not cover", "excluded", "exclusion", "void", "liability shall not", "does not cover"]

def calculate_strictness():
    """
    Calculates strictness score per insurer.
    Rule:
    1. Identify 'Exclusion' clauses via Section name OR Keywords.
    2. Score = Count(Exclusion Clauses) / Total Clauses. (Normalized)
    3. Scale to 0-100 or 0-1.
    """
    df = get_analytics_df()
    if df.empty:
        return []

    results = []
    insurers = df["doc_name"].unique()

    for insurer in insurers:
        insurer_df = df[df["doc_name"] == insurer]
        total_clauses = len(insurer_df)
        
        if total_clauses == 0:
            continue

        # 1. Exclusions (Weight 1.0)
        exclusion_mask = insurer_df["section"].astype(str).str.contains("Exclusion|Exception|Not Covered", case=False, na=False)
        exclusion_kw_mask = insurer_df["nlp_text"].astype(str).str.contains("|".join(STRICT_KEYWORDS), case=False, na=False)
        strict_count = insurer_df[exclusion_mask | exclusion_kw_mask].shape[0]

        # 2. Conditions (Weight 0.5) - New Logic
        condition_mask = insurer_df["section"].astype(str).str.contains("Condition|Warranty|Provided", case=False, na=False)
        condition_kw_mask = insurer_df["nlp_text"].astype(str).str.contains("subject to|provided that|warranted that", case=False, na=False)
        # Ensure we don't double count if it's already marked as exclusion
        condition_final_mask = (condition_mask | condition_kw_mask) & ~(exclusion_mask | exclusion_kw_mask)
        condition_count = insurer_df[condition_final_mask].shape[0]

        # Weighted Score
        weighted_strictness = strict_count * 1.0 + condition_count * 0.5
        strictness_score = weighted_strictness / total_clauses
        
        # Risk Score (derived directly from strictness for now)
        risk_exposure = min(strictness_score * 120, 100) # Slightly boosted scaling

        results.append({
            "insurer": insurer,
            "total_clauses": int(total_clauses),
            "exclusion_count": int(strict_count),
            "condition_count": int(condition_count),
            "strictness_score": round(strictness_score, 4),
            "risk_score": round(risk_exposure, 2)
        })

    # Rank by strictness (descending)
    results.sort(key=lambda x: x["strictness_score"], reverse=True)
    return results
