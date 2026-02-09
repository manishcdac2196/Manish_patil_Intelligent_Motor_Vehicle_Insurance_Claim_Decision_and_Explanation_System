from typing import List, Dict, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from . import models
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["pbkdf2_sha256", "bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def get_user_by_id(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()


def create_user(db: Session, email: str, name: str, password: str, role: str, company: Optional[str] = None):
    hashed_password = get_password_hash(password)
    db_user = models.User(
        email=email,
        name=name,
        hashed_password=hashed_password,
        role=role,
        company=company
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def create_claim(db: Session, user_id: Optional[int], company: str, policy_type: str, description: str, final_decision: Optional[str], risk_level: Optional[str]):
    c = models.Claim(
        user_id=user_id,
        company=company,
        policy_type=policy_type,
        description=description,
        final_decision=final_decision,
        risk_level=risk_level,
        created_at=datetime.now(timezone.utc)
    )
    db.add(c)
    db.commit()
    db.refresh(c)
    return c


def save_survey_result(db: Session, claim_id: int, survey_payload: Dict, survey_prediction: Optional[str], survey_probability: Optional[float]):
    s = models.ClaimSurvey(
        claim_id=claim_id,
        survey_payload=survey_payload,
        survey_prediction=survey_prediction,
        survey_probability=survey_probability
    )
    db.add(s)
    db.commit()
    db.refresh(s)
    return s


def save_claim_images(db: Session, claim_id: int, image_results: List[Dict], filenames: List[str] = None):
    created = []
    # If filenames provided, zip them. Otherwise, use dummy or ensure we handle it (though DB requires it).
    
    if filenames and len(filenames) == len(image_results):
        for res, fname in zip(image_results, filenames):
            img = models.ClaimImage(claim_id=claim_id, image_result=res, filename=fname)
            db.add(img)
            created.append(img)
    else:
        # Fallback if no filenames matched (should not happen now)
        for i, res in enumerate(image_results):
            fname = f"image_{i}.jpg" # Fallback to prevent crash if backend logic fails
            img = models.ClaimImage(claim_id=claim_id, image_result=res, filename=fname)
            db.add(img)
            created.append(img)
            
    db.commit()
    for img in created:
        db.refresh(img)
    return created


def save_claim_explanation(db: Session, claim_id: int, extracted_keywords: Dict, clauses_used: List[Dict], explanation_text: str):
    ex = models.ClaimExplanation(
        claim_id=claim_id,
        extracted_keywords=extracted_keywords,
        clauses_used=clauses_used,
        explanation_text=explanation_text
    )
    db.add(ex)
    db.commit()
    db.refresh(ex)
    return ex


def get_claim(db: Session, claim_id: int):
    return db.query(models.Claim).filter(models.Claim.id == claim_id).first()


def list_claims(db: Session, company: Optional[str] = None, user_id: Optional[int] = None, limit: int = 100):
    q = db.query(models.Claim)
    if company:
        q = q.filter(models.Claim.company == company)
    if user_id:
        q = q.filter(models.Claim.user_id == user_id)
    return q.order_by(models.Claim.created_at.desc()).limit(limit).all()


def delete_claim(db: Session, claim_id: int):
    claim = db.query(models.Claim).filter(models.Claim.id == claim_id).first()
    if claim:
        db.delete(claim)
        db.commit()
        return True
    return False