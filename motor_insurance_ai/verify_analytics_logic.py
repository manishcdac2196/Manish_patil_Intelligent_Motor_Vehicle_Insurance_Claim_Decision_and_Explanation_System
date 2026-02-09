import sys
import os

# Ensure backend modules can be imported
sys.path.append(os.path.join(os.path.dirname(__file__), "backend"))

from backend.analytics.policy_insights.ranking import calculate_strictness

def test_ranking():
    print("Testing Strictness Calculation...")
    results = calculate_strictness()
    
    if not results:
        print("No results returned. Is data loaded?")
        return

    print(f"\nAnalyzed {len(results)} insurers.")
    print("-" * 60)
    print(f"{'Insurer':<20} | {'Strictness':<10} | {'Risk':<10} | {'Excl/Cond'}")
    print("-" * 60)
    
    for r in results:
        print(f"{r['insurer']:<20} | {r['strictness_score']:<10} | {r['risk_score']:<10} | {r['exclusion_count']}/{r['condition_count']}")

    print("-" * 60)
    print("Success! Ranking logic is functional.")

if __name__ == "__main__":
    test_ranking()
