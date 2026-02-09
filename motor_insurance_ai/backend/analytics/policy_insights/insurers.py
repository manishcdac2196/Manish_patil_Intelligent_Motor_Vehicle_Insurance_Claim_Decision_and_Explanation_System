from .data_loader import get_analytics_df

def get_unique_insurers():
    """Returns a list of unique insurer names available in the dataset."""
    df = get_analytics_df()
    if df.empty:
        return []
    return sorted(df["doc_name"].dropna().unique().tolist())
