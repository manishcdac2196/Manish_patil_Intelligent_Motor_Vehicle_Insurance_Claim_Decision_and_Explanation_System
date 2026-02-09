from .data_loader import get_analytics_df
import pandas as pd

def get_clause_distribution():
    """
    Returns clause counts per insurer per cluster.
    Structure: { "InsurerA": { "Cluster1": 10, "Cluster2": 5 }, ... }
    """
    df = get_analytics_df()
    if df.empty:
        return {}
    
    # Group by doc_name (insurer) and cluster
    counts = df.groupby(["doc_name", "cluster"]).size().unstack(fill_value=0)
    return counts.to_dict(orient="index")

def get_category_heatmap():
    """
    Returns clause counts per insurer per section (Category).
    Structure: { "InsurerA": { "Tyre Damage": 1, "Engine Protection": 2 }, ... }
    """
    df = get_analytics_df()
    if df.empty:
        return {}

    # Group by doc_name and section
    counts = df.groupby(["doc_name", "section"]).size().unstack(fill_value=0)
    return counts.to_dict(orient="index")
