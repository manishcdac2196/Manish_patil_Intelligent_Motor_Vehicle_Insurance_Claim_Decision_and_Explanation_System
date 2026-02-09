from fastapi import FastAPI, UploadFile, File, HTTPException, Form, Depends, status
from contextlib import asynccontextmanager
from datetime import timedelta
from fastapi.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any, List
import os
import uuid
import json

from decision_engine import final_decision
# Import DB early so missing/invalid DATABASE_URL causes immediate fail-fast behavior on import
from db.database import init_db, SessionLocal
from ml.Claim_model.predict import predict_survey, get_model_metadata
from ml.Claim_model.predict import predict_survey, get_model_metadata
from ml.image_model import run_image_inference
import logging

# Setup Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)



BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")

import shutil

def save_upload_file(file: UploadFile, destination: str):
    with open(destination, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

from rag.explain import generate_explanation
from rag.pipeline import run_rag_pipeline
from rag import retrieve
from claim_processor import process_claim
from db import crud
from db.deps import get_db, get_current_user
from sqlalchemy.orm import Session
from auth import create_access_token, UserAuth, Token, SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
from db.crud import verify_password
from db.models import User
from schemas import map_claim_to_frontend
from analytics.router import router as analytics_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Load ML models
    try:
        retrieve.load_model()
    except Exception as e:
        print(f"Warning: Model loading failed: {e}")
        # Proceeding without model (will retry on first request)
    yield
    # Shutdown (optional cleanup)

app = FastAPI(title="Motor Insurance AI Backend", lifespan=lifespan)

# Mount uploads directory for static access
from fastapi.staticfiles import StaticFiles
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Allow requests from the frontend dev server(s)
_origins = os.environ.get("VITE_DEV_ORIGINS")
if _origins:
    ORIGINS = [o.strip() for o in _origins.split(",") if o.strip()]
else:
    ORIGINS = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:3002",
        "http://127.0.0.1:3002",
    ]

app.add_middleware(
    CORSMiddleware,
    # allow_origins=ORIGINS, # Replaced by regex below for flexibility
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analytics_router)

# Optional dev model warm-up: set DEV_WARM_MODELS=0 to disable
import threading

def _warm_models_background():
    """Call model loaders in background to reduce first-request latency."""
    try:
        # Claim survey model
        from ml.Claim_model.predict import _load_pipeline
        _load_pipeline()
    except Exception:
        pass



@app.on_event("startup")
def startup_event():
    # Initialize DB tables (idempotent). Fail-fast if database configuration is missing or invalid.
    init_db()

    # Optional dev model warm-up: set DEV_WARM_MODELS=0 to disable
    if os.environ.get("DEV_WARM_MODELS", "1") != "0":
        t = threading.Thread(target=_warm_models_background, daemon=True)
        t.start()


@app.post("/db/init")
def db_init():
    init_db()
    return {"status": "db initialized"}

# ------------------------
# Health Check
# ------------------------
@app.get("/")
def health_check():
    return {"status": "Backend running successfully"}

# ------------------------
# Survey ML (placeholder)
# ------------------------

@app.post("/survey")
def survey_predict(payload: dict):
    return predict_survey(payload)


# ------------------------
# Model metadata
# ------------------------
@app.get("/model/metadata")
def model_metadata():
    return get_model_metadata()

# ------------------------
# Image ML (analyze)
# ------------------------
@app.post("/image/analyze")
async def image_analyze(files: List[UploadFile] = File(...)):
    # Validate count
    if not (2 <= len(files) <= 10):
        raise HTTPException(status_code=400, detail="Provide between 2 and 10 images.")

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    saved_paths = []

    for f in files:
        ext = os.path.splitext(f.filename)[1] or ".jpg"
        filename = f"{uuid.uuid4().hex}{ext}"
        path = os.path.join(UPLOAD_DIR, filename)
        # content = await f.read()
        # with open(path, "wb") as fh:
        #     fh.write(content)
        await run_in_threadpool(save_upload_file, f, path)
        saved_paths.append(path)

    # Preprocess and analyze
    # processed = preprocess_images(saved_paths) # DEPRECATED
    # if not processed:
    #     return {"damage_detected": False, "details": {}}
    
    # result = analyze_images(processed)
    
    # New Pipeline
    result = run_image_inference(saved_paths)
    return result


# ------------------------
# Decision Engine (placeholder)
# ------------------------
@app.post("/decision")
def decision(payload: Dict[str, Any]):
    survey = payload.get("survey", {})
    image = payload.get("image", {})
    return final_decision(survey, image)


# ------------------------
# Claim orchestration
# ------------------------
@app.post("/claim/process")
async def claim_process(
    description: str = Form(...),
    company: str = Form(...),
    policy_type: str = Form(...),
    survey_result: str = Form(...),
    files: List[UploadFile] = File(None),
    # db: Session = Depends(get_db), # Removed dependency, using local session
    current_user: User = Depends(get_current_user)
):
    # parse survey
    try:
        survey_obj = json.loads(survey_result)
    except Exception:
        raise HTTPException(status_code=400, detail="survey_result must be valid JSON")

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    saved_paths = []
    if files:
        for f in files:
            ext = os.path.splitext(f.filename)[1] or ".jpg"
            filename = f"{uuid.uuid4().hex}{ext}"
            path = os.path.join(UPLOAD_DIR, filename)
            await run_in_threadpool(save_upload_file, f, path)
            saved_paths.append(path)

    # Use a fresh session for this complex transaction to avoid PendingRollbackError
    # from middleware or other dependencies
    db = SessionLocal()
    try:
        try:
            # 1. Create Claim (Async wrapper for blocking DB call)
            new_claim = await run_in_threadpool(
                crud.create_claim,
                db=db,
                user_id=current_user.id,
                company=company,
                policy_type=policy_type,
                description=description,
                final_decision="PROCESSING",
                risk_level=None
            )
            
            # 2. Save Initial Survey (Async wrapper)
            await run_in_threadpool(
                crud.save_survey_result,
                db=db,
                claim_id=new_claim.id,
                survey_payload=survey_obj,
                survey_prediction=None,
                survey_probability=None
            )
            
            # Extract ID before closing session to avoid DetachedInstanceError
            claim_id_val = new_claim.id
            
        except Exception as e:
            logger.error(f"Failed to create claim or save survey: {e}")
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Database Error: {str(e)}")
        
        # 3. Heavy Processing (ML/RAG) - Must run in threadpool
        # process_claim creates its OWN session, so it is safe.
        try:
            result = await run_in_threadpool(
                process_claim,
                description=description,
                company=company,
                policy_type=policy_type,
                survey_result=survey_obj,
                uploaded_image_paths=saved_paths,
                user_id=current_user.id,
                claim_id=claim_id_val
            )
        except Exception as e:
            # Mark as error if processing fails
            logger.error(f"Processing failed: {e}")
            new_claim.final_decision = "ERROR"
            db.add(new_claim) # Ensure it's attached
            db.commit()
            raise e

        return result

    finally:
        db.close()

    return result

# ------------------------
# Compatibility endpoints for frontend
# ------------------------

def _to_dict(obj):
    d = obj.__dict__.copy()
    d.pop("_sa_instance_state", None)
    return d


@app.get("/claims")
def list_claims(company: str = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # If company user, filter by company. If regular user, filter by their ID?
    # Requirement: "Login must reject role mismatch".
    
    # Let's enforce: Users see their own. Companies see all (or filtered).
    # Let's enforce: Users see their own. Companies see all (or filtered).
    if current_user.role == 'user':
        items = crud.list_claims(db, user_id=current_user.id)
    else:
        # Strict security: Company users can ONLY see claims for their registered company
        target_company = current_user.company if current_user.company else company
        items = crud.list_claims(db, company=target_company)
        
    return [map_claim_to_frontend(i) for i in items]


@app.get("/claims/{claim_id}")
def get_claim(claim_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    c = crud.get_claim(db, claim_id)
    if not c:
        raise HTTPException(status_code=404, detail="Claim not found")
    
    # Access control
    if current_user.role == 'user' and c.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this claim")
        
    return map_claim_to_frontend(c)


@app.delete("/claims/{claim_id}")
def delete_claim(claim_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    c = crud.get_claim(db, claim_id)
    if not c:
        raise HTTPException(status_code=404, detail="Claim not found")
    
    # Access control: Only owner or company (maybe?) can delete.
    # For now, simplistic: Only owner can delete their own claim.
    if current_user.role == 'user' and c.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this claim")

    success = crud.delete_claim(db, claim_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete claim")
    
    return {"status": "success", "message": "Claim deleted"}


@app.post("/claims")
def create_claim(payload: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Explicit claim creation endpoint (if used directly)
    c = crud.create_claim(
        db,
        user_id=current_user.id,
        company=payload.get("company"),
        policy_type=payload.get("policy_type"),
        description=payload.get("description"),
        final_decision=payload.get("final_decision"),
        risk_level=payload.get("risk_level"),
    )
    return _to_dict(c)


@app.post("/claims/upload")
async def claims_upload(file: UploadFile = File(...)):
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    ext = os.path.splitext(file.filename)[1] or ".jpg"
    filename = f"{uuid.uuid4().hex}{ext}"
    path = os.path.join(UPLOAD_DIR, filename)
    # content = await file.read()
    # with open(path, "wb") as fh:
    #     fh.write(content)
    await run_in_threadpool(save_upload_file, file, path)
    return {"filename": filename, "path": path}


@app.post("/image")
async def image_single(file: UploadFile = File(...)):
    # single-file compatibility wrapper for frontend
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    ext = os.path.splitext(file.filename)[1] or ".jpg"
    filename = f"{uuid.uuid4().hex}{ext}"
    path = os.path.join(UPLOAD_DIR, filename)
    # content = await file.read()
    # with open(path, "wb") as fh:
    #     fh.write(content)
    await run_in_threadpool(save_upload_file, file, path)

    # processed = preprocess_images([path])
    # if not processed:
    #     return {"damage_detected": False, "details": {}}
    # return analyze_images(processed)
    
    # New Pipeline
    return run_image_inference(path)


@app.post("/auth/login", response_model=Token)
def auth_login(payload: UserAuth, db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, email=payload.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Strict Role Check
    # If the frontend sent a specific intended role, we MUST match it.
    # If payload.role is None, we might allow it (optional), but if set, it must match.
    if payload.role and payload.role != user.role:
         raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Role mismatch. You are registered as '{user.role}' but tried to login as '{payload.role}'."
        )
    
    # Generate Token with sub=user_id (str)
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role, "email": user.email}, 
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "company": user.company
        }
    }


@app.post("/auth/signup")
def auth_signup(payload: UserAuth, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=payload.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    new_user = crud.create_user(
        db=db,
        email=payload.email,
        name=payload.name or "New User",
        password=payload.password,
        role=payload.role or "user",
        company=payload.company
    )
    
    # Auto-login after signup
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(new_user.id), "role": new_user.role, "email": new_user.email},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "name": new_user.name,
            "email": new_user.email,
            "role": new_user.role,
            "company": new_user.company
        }
    }


@app.put("/auth/me")
def update_profile(payload: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Update name or password
    # Payload: { "name": "...", "password": "..." (optional) }
    
    user = crud.get_user_by_id(db, current_user.id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if "name" in payload and payload["name"]:
        user.name = payload["name"]
    
    if "password" in payload and payload["password"]:
        from db.crud import get_password_hash
        user.hashed_password = get_password_hash(payload["password"])

    db.commit()
    db.refresh(user)

    return {
        "message": "Profile updated successfully",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "company": user.company
        }
    }


# ------------------------
# RAG Explanation (placeholder)
@app.post("/explanation")
def explanation(payload: dict):
    return {
        "explanation": generate_explanation(payload)
    }


@app.post("/rag/query")
def rag_query(payload: dict):
    query = payload.get("query", "")
    # Placeholder: retrieve relevant clauses.
    # We might not have company/policy_type in this ad-hoc query, assume defaults or generic search.
    primary, secondary = retrieve.get_reason_aware_clauses(query, company="General", policy_type="General")
    # Combine and return matches in 'matches' key expected by frontend
    matches = primary + secondary
    # transform to frontend expected format if needed
    formatted = []
    for m in matches:
        formatted.append({
            "text": m.get("text", "No text"),
            "source": m.get("source", "Unknown"),
            "score": m.get("score", 0.0),
            "page": m.get("page", 0)
        })
    return {"matches": formatted}

