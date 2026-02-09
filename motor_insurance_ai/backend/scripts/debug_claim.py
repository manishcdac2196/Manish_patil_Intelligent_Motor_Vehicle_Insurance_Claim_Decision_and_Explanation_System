import sys
import os
import json
import logging

# Add backend directory to sys.path
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

# Set DB URL based on test_db.py findings
if "DATABASE_URL" not in os.environ:
    # Try probable credentials
    os.environ["DATABASE_URL"] = "postgresql://postgres:abhishekc1@localhost:5432/motor_insurance_db"
    print(f"Set env DATABASE_URL = {os.environ['DATABASE_URL']}")

from claim_processor import process_claim
from db.database import init_db

# Setup basic logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def run_debug():
    print("Initializing DB...")
    init_db()

    print("Running process_claim debug...")

    # Dummy data
    description = "Test claim description for debugging purposes."
    company = "Acko"
    policy_type = "Four Wheeler"
    
    survey_result = {
        "incidentDetails": {
            "accidentDate": "2026-01-01",
            "accidentTime": "12:00",
            "locationType": "City"
        },
        "vehicleDetails": {
            "registrationNumber": "MH02CB1234",
            "insurerName": "Acko",
            "vehicleType": "Four Wheeler",
            "carAge": 2,
            "driverAge": 30
        },
        "accidentSpecifics": {
            "accidentType": "Collision",
            "damageParts": ["Front Bumper"],
            "previousClaims": 0,
            "policeReport": True,
            "driverAtFault": False,
            "driverLicenseValid": True,
            "alcoholIntoxicated": False
        },
        "computed": {
            "days_to_expiry": 120,
            "claimable_policy": True
        }
    }
    
    uploaded_image_paths = [] 
    
    try:
        result = process_claim(
            description=description,
            company=company,
            policy_type=policy_type,
            survey_result=survey_result,
            uploaded_image_paths=uploaded_image_paths,
            user_id=None, # System run
            claim_id=None # Creates new claim
        )
        print("\nSUCCESS: process_claim completed.")
        print(json.dumps(result, indent=2))
        
    except Exception as e:
        print("\nFAILURE: process_claim crashed.")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    run_debug()
