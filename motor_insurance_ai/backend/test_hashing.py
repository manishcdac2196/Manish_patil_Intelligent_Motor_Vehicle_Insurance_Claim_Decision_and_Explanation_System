from passlib.context import CryptContext
import traceback

print("Testing hashing...")
try:
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    h = pwd_context.hash("password123")
    print(f"Hash success: {h}")
    v = pwd_context.verify("password123", h)
    print(f"Verify success: {v}")
except Exception:
    traceback.print_exc()
