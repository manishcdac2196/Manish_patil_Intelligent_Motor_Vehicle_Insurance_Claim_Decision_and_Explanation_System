from backend.rag.retrieve import retrieve_clauses

def test_rag():
    query = "theft of vehicle"
    company = "Acko"
    policy_type = "Two Wheeler"
    
    print(f"Querying: '{query}' for {company}...")
    results = retrieve_clauses(query, company, policy_type, top_k=3)
    
    if not results:
        print("No results found.")
        return

    print(f"Found {len(results)} clauses.")
    for i, r in enumerate(results):
        print(f"\n--- Result {i+1} ---")
        print(f"Text: {r['clause_text'][:100]}...")
        print(f"Topic: {r.get('semantic_topic', 'N/A')}")
        print(f"Cluster ID: {r.get('semantic_cluster_id', 'N/A')}")

if __name__ == "__main__":
    test_rag()
