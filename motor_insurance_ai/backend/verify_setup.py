import sys
import os

# Add backend to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

print("Verifying imports...")
try:
    from main import app
    print("✅ main.py imported successfully")
except ImportError as e:
    print(f"❌ Failed to import main.py: {e}")
    sys.exit(1)

try:
    from db.models import User
    print("✅ db/models.py imported successfully")
except ImportError as e:
    print(f"❌ Failed to import db/models.py: {e}")
    sys.exit(1)

try:
    from auth import create_access_token
    print("✅ auth.py imported successfully")
except ImportError as e:
    print(f"❌ Failed to import auth.py: {e}")
    sys.exit(1)

print("Verification complete! Backend structure is valid.")
