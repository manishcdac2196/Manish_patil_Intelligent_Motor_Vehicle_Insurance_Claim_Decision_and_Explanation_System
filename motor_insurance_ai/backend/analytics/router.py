from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from .policy_insights.metrics import get_clause_distribution, get_category_heatmap
from .policy_insights.ranking import calculate_strictness
from .policy_insights.similarity import calculate_jaccard_similarity
from .policy_insights.insurers import get_unique_insurers

router = APIRouter(prefix="/analytics", tags=["Policy Analytics"])

@router.get("/insurers")
def api_insurers():
    """Returns list of unique insurer names."""
    return get_unique_insurers()

@router.get("/distribution")
def api_distribution():
    """Returns clause distribution by cluster and insurer."""
    return get_clause_distribution()

@router.get("/categories")
def api_categories():
    """Returns clause counts by category (section) and insurer."""
    return get_category_heatmap()

@router.get("/ranking")
def api_ranking():
    """Returns insurer ranking based on strictness index."""
    return calculate_strictness()

@router.get("/similarity")
def api_similarity():
    """Returns pairwise similarity scores between insurers."""
    return calculate_jaccard_similarity()

@router.get("/health")
def analytics_health():
    return {"status": "analytics_active", "engine": "policy_insights_v1"}
