from .data_loader import get_analytics_df
import itertools

def calculate_jaccard_similarity():
    """
    Calculates Jaccard Similarity between insurers based on the SET of clusters they cover.
    J(A, B) = |A ∩ B| / |A ∪ B|
    """
    df = get_analytics_df()
    if df.empty:
        return []

    # Get set of unique clusters per insurer
    insurer_clusters = df.groupby("doc_name")["cluster"].apply(set).to_dict()
    insurers = list(insurer_clusters.keys())
    
    similarity_matrix = []

    # Compute pairwise similarity
    for ins_a, ins_b in itertools.combinations(insurers, 2):
        set_a = insurer_clusters[ins_a]
        set_b = insurer_clusters[ins_b]
        
        intersection = len(set_a.intersection(set_b))
        union = len(set_a.union(set_b))
        
        score = intersection / union if union > 0 else 0
        
        similarity_matrix.append({
            "insurer_a": ins_a,
            "insurer_b": ins_b,
            "similarity_score": round(score, 4)
        })

    # Sort by highest similarity
    similarity_matrix.sort(key=lambda x: x["similarity_score"], reverse=True)
    return similarity_matrix
