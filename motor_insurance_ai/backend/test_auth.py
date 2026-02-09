import urllib.request
import json
import urllib.error

API_URL = "http://127.0.0.1:8000"

def test_signup():
    print("Testing Signup...")
    import random
    rand_id = random.randint(1000, 9999)
    payload = {
        "email": f"test_debug_{rand_id}@example.com",
        "password": "password123",
        "name": f"Debug User {rand_id}",
        "role": "user"
    }
    
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(f"{API_URL}/auth/signup", data=data, headers={'Content-Type': 'application/json'})
    
    try:
        with urllib.request.urlopen(req) as res:
            print(f"Status: {res.status}")
            print(f"Response: {res.read().decode()}")
    except urllib.error.HTTPError as e:
        print(f"Request failed: {e.code}")
        print(f"Error Response: {e.read().decode()}")
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    test_signup()
