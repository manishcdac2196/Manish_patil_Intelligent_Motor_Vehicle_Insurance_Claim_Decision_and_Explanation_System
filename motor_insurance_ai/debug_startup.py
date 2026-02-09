import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), "backend"))

# MOCK ENV VAR
os.environ["DATABASE_URL"] = "postgresql://postgres:abhishekc1@localhost:5432/motor_insurance_db"

print("Attempting to import main app...")
try:
    from backend.main import app
    print("SUCCESS: backend.main imported successfully.")
except Exception as e:
    import traceback
    print("FAILURE: Crash on import.")
    traceback.print_exc()
