import requests
import sys

BASE_URL = "http://127.0.0.1:8000"
EMAIL = "debug@example.com"
PASSWORD = "password"

def test_profile_update():
    print(f"1. Login as {EMAIL}...")
    try:
        res = requests.post(f"{BASE_URL}/auth/login", json={
            "email": EMAIL,
            "password": PASSWORD,
            "role": "user"
        })
    except Exception as e:
        print(f"CRITICAL: Failed to connect to server: {e}")
        return

    if res.status_code != 200:
        print(f"Login Failed: {res.text}")
        # Try to create user if login fails (first run)
        print("   Attempting signup...")
        res = requests.post(f"{BASE_URL}/auth/signup", json={
            "email": EMAIL,
            "password": PASSWORD,
            "name": "Debug User",
            "role": "user"
        })
        if res.status_code != 200:
             print(f"Signup Failed: {res.text}")
             return
    
    token = res.json()["access_token"]
    print(f"   Success. Token: {token[:10]}...")

    print("2. Update Profile Name...")
    headers = {"Authorization": f"Bearer {token}"}
    payload = {"name": "Updated Name"}
    
    res = requests.put(f"{BASE_URL}/auth/me", json=payload, headers=headers)
    
    print(f"   Status: {res.status_code}")
    print(f"   Response: {res.text}")

if __name__ == "__main__":
    test_profile_update()
