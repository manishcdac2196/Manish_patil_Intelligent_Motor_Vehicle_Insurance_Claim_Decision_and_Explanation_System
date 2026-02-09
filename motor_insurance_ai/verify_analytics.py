import sys
import os
# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from backend.analytics.policy_insights.metrics import get_clause_distribution, get_category_heatmap
from backend.analytics.policy_insights.ranking import calculate_strictness
from backend.analytics.policy_insights.similarity import calculate_jaccard_similarity
from backend.analytics.policy_insights.data_loader import loader

print("Loading Data...")
df = loader.load_data()
print(f"Data Loaded: {df.shape}")

print("\n--- Testing Distribution ---")
dist = get_clause_distribution()
print(f"Distribution Keys: {list(dist.keys())[:2]}")

print("\n--- Testing Categories ---")
cats = get_category_heatmap()
print(f"Category Keys: {list(cats.keys())[:2]}")

print("\n--- Testing Ranking ---")
rank = calculate_strictness()
if rank:
    print(f"Top 1 Strictness: {rank[0]}")

print("\n--- Testing Similarity ---")
sim = calculate_jaccard_similarity()
if sim:
    print(f"Top 1 Similarity: {sim[0]}")

print("\nVerification Complete.")
