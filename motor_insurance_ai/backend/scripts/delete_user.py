from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from db.models import User
import os

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    DATABASE_URL = "postgresql://postgres:abhishekc1@localhost:5432/motor_insurance_db"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def delete_user(email):
    db = SessionLocal()
    user = db.query(User).filter(User.email == email).first()
    if user:
        db.delete(user)
        db.commit()
        print(f"Deleted user {email}")
    else:
        print(f"User {email} not found")
    db.close()

if __name__ == "__main__":
    delete_user("debug_user@example.com")
