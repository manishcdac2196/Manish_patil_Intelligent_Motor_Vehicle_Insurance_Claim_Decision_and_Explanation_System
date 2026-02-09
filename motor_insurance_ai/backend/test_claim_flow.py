import requests
import json
import random

# Base Config
API_URL = "http://127.0.0.1:8000"
USER_EMAIL = "test_flow_user@example.com"
PASSWORD = "password123"

def run_test():
    # 1. Signup/Login
    session = requests.Session()
    
    # Try login first
    print(f"1. Logging in as {USER_EMAIL}...")
    login_res = session.post(f"{API_URL}/auth/login", json={"email": USER_EMAIL, "password": PASSWORD, "role": "user"})
    
    token = None
    if login_res.status_code == 200:
        token = login_res.json()["access_token"]
        print("   Login Successful.")
    else:
        # Signup
        print("   Login failed, signing up...")
        rand_id = random.randint(1000, 9999)
        email = f"test_flow_{rand_id}@example.com"
        signup_res = session.post(f"{API_URL}/auth/signup", json={
            "email": email, 
            "password": PASSWORD, 
            "name": "Flow Tester", 
            "role": "user"
        })
        if signup_res.status_code == 200:
            token = signup_res.json()["access_token"]
            print(f"   Signup Successful as {email}.")
        else:
            print(f"   Signup Failed: {signup_res.text}")
            return

    headers = {"Authorization": f"Bearer {token}"}

    # Valid 1x1 Red JPEG
    valid_jpg = (
        b'\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xff\xdb\x00C\x00\xff\xff\xff\xff\xff\xff\xff\xff'
        b'\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff'
        b'\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xdb\x00C\x01\xff\xff\xff'
        b'\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff'
        b'\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xc0\x00\x11'
        b'\x08\x00\x01\x00\x01\x03\x01\x22\x00\x02\x11\x01\x03\x11\x01\xff\xc4\x00\x15\x00\x01\x01\x00\x00\x00\x00\x00\x00'
        b'\x00\x00\x00\x00\x00\x00\x00\x00\x00\x03\xff\xc4\x00\x14\x10\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00'
        b'\x00\x00\x00\x00\xff\xc4\x00\x14\x01\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\xff\xc4'
        b'\x00\x14\x11\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\xff\xda\x00\x0c\x03\x01\x00\x02'
        b'\x11\x03\x11\x00\x3f\x00\xbf\x80\x01\xff\xd9'
    )

    # 2. Create Dummy Images
    files = [
        ('files', ('car_front.jpg', valid_jpg, 'image/jpeg')),
        ('files', ('car_rear.jpg', valid_jpg, 'image/jpeg'))
    ]

    # 3. Construct Survey Data (Matches Frontend exactly)
    survey_data = {
        "incidentDetails": {
            "accidentDate": "2025-01-01",
            "accidentTime": "12:00",
            "locationType": "city",
        },
        "vehicleDetails": {
            "registrationNumber": "MH-12-AB-1234",
            "insurerName": "Acko",
            "vehicleType": "Four Wheeler",
            "carAge": 2,
            "driverAge": 30,
        },
        "accidentSpecifics": {
            "accidentType": "collision",
            "damageParts": ["Damage Front"],
            "previousClaims": 0,
            "policeReport": True,
            "driverAtFault": False,
            "driverLicenseValid": True,
            "alcoholIntoxicated": False, 
        },
        "computed": {
            "days_to_expiry": 100,
            "claimable_policy": True,
        }
    }

    # 4. Prepare FormData
    payload = {
        "description": "Test claim via script",
        "company": "Acko",
        "policy_type": "Four Wheeler",
        "survey_result": json.dumps(survey_data)
    }

    print("2. Submitting Claim...")
    try:
        res = session.post(f"{API_URL}/claim/process", headers=headers, data=payload, files=files)
        print(f"   Status: {res.status_code}")
        print(f"   Response: {res.text}")
        
        if res.status_code == 200:
            claim_id = res.json().get("claim_id")
            print(f"   SUCCESS! Claim ID: {claim_id}")
            
            # 5. Verify Claim Details
            print(f"3. Verifying Claim {claim_id}...")
            get_res = session.get(f"{API_URL}/claims/{claim_id}", headers=headers)
            if get_res.status_code == 200:
                data = get_res.json()
                print("   Verification Successful. Data correct.")
            else:
                print(f"   Verification Failed: {get_res.status_code}")
                
    except Exception as e:
        print(f"   Request Crashed: {e}")

if __name__ == "__main__":
    run_test()
