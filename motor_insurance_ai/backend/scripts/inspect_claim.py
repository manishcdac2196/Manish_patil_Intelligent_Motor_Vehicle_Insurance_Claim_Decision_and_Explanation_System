import sys
import os
import json


# Add backend to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

if "DATABASE_URL" not in os.environ:
    os.environ["DATABASE_URL"] = "postgresql://postgres:abhishekc1@localhost:5432/motor_insurance_db"

from db.database import SessionLocal, init_db
from db import models

def inspect_latest_claim():
    init_db()
    db = SessionLocal()
    try:
        # Get latest claim
        claim = db.query(models.Claim).order_by(models.Claim.id.desc()).first()
        if not claim:
            print("No claims found.")
            return

        print(f"=== CLAIM ID: {claim.id} ===")
        print(f"User ID: {claim.user_id}")
        print(f"Status: {claim.final_decision}")
        
        # 1. Check Images
        print(f"\n--- IMAGES ({len(claim.images)}) ---")
        for img in claim.images:
            print(f"ID: {img.id}")
            print(f"Result JSON: {img.image_result}")
        
        if not claim.images:
            print("WARNING: No images linked to this claim!")

        # 2. Check Surveys
        print(f"\n--- SURVEYS ({len(claim.surveys)}) ---")
        for s in claim.surveys:
            print(f"ID: {s.id}")
            print(f"Prediction: {s.survey_prediction}")
            print(f"Probability: {s.survey_probability}")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    inspect_latest_claim()
