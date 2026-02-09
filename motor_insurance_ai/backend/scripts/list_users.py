from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from db.models import User
import os

DATABASE_URL = "postgresql://postgres:abhishekc1@localhost:5432/motor_insurance_db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def list_users():
    db = SessionLocal()
    users = db.query(User).all()
    for u in users:
        print(f"ID: {u.id}, Email: {u.email}, Role: {u.role}")
    db.close()

if __name__ == "__main__":
    list_users()
