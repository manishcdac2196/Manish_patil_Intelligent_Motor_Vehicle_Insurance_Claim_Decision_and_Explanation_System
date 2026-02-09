import requests
import json
import uuid

BASE_URL = "http://localhost:8000"
EMAIL = "debug_user@example.com"
PASSWORD = "password123"

def verify_features():
    print("1. Registering/Logging in...")
    # Try login first
    session = requests.Session()
    res = session.post(f"{BASE_URL}/auth/login", json={"email": EMAIL, "password": PASSWORD, "role": "user"})
    
    token = ""
    if res.status_code == 200:
        token = res.json()["access_token"]
        print("Logged in.")
    else:
        # Register
        print("Registering...")
        res = session.post(f"{BASE_URL}/auth/signup", json={"email": EMAIL, "password": PASSWORD, "name": "Old Name", "role": "user"})
        if res.status_code == 200:
            token = res.json()["access_token"]
            print("Registered.")
        else:
            print(f"Failed to auth: {res.text}")
            return

    headers = {"Authorization": f"Bearer {token}"}

    # 2. Test Profile Update
    print("\n2. Testing Profile Update...")
    new_name = "Updated Name " + str(requests.get("https://api.ipify.org").status_code) # Random-ish
    res = session.put(f"{BASE_URL}/auth/me", json={"name": new_name}, headers=headers)
    if res.status_code == 200:
        print(f"SUCCESS: Profile updated. New name: {res.json()['user']['name']}")
    else:
        print(f"FAILURE: Profile update failed: {res.text}")

    # 3. Create a Dummy Claim
    print("\n3. Creating Dummy Claim...")
    claim_payload = {
        "company": "Test Co",
        "policy_type": "Comprehensive",
        "description": "To be deleted",
        "final_decision": "PENDING",
        "risk_level": "LOW"
    }
    res = session.post(f"{BASE_URL}/claims", json=claim_payload, headers=headers)
    if res.status_code == 200:
        claim_id = res.json()["id"]
        print(f"Created claim ID: {claim_id}")
        
        # 4. Delete the Claim
        print(f"\n4. Deleting Claim {claim_id}...")
        res = session.delete(f"{BASE_URL}/claims/{claim_id}", headers=headers)
        if res.status_code == 200:
            print("SUCCESS: Claim deleted.")
        else:
            print(f"FAILURE: Could not delete claim: {res.text}")

        # Verify deletion
        res = session.get(f"{BASE_URL}/claims/{claim_id}", headers=headers)
        if res.status_code == 404:
             print("SUCCESS: Claim correctly verified as gone (404).")
        else:
             print(f"WARNING: Claim might still exist. Status: {res.status_code}")

    else:
        print(f"FAILURE: Could not create claim: {res.text}")

if __name__ == "__main__":
    verify_features()
