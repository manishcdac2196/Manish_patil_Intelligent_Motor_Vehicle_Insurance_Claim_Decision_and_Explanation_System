import json
import os
from typing import List, Tuple, Dict, Any

from ml.image_model import run_image_inference
from ml.Claim_model.predict import predict_survey
from llm import keyword_extractor
from rag import retrieve
from decision_engine import final_decision
from llm.explanation_gen import generate_explanation
from db import crud
from db.database import SessionLocal
import numpy as np

def sanitize_for_json(obj):
    if isinstance(obj, dict):
        return {k: sanitize_for_json(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [sanitize_for_json(v) for v in obj]
    elif isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.floating):
        return float(obj)
    elif isinstance(obj, np.bool_):
        return bool(obj)
    elif isinstance(obj, np.ndarray):
        return sanitize_for_json(obj.tolist())
    return obj


def _combine_clauses(primary: List[dict], secondary: List[dict]) -> List[dict]:
    # Return combined list with primary first then secondary
    return primary + secondary


def process_claim(description: str,
                  company: str,
                  policy_type: str,
                  survey_result: Any,
                  uploaded_image_paths: List[str],
                  user_id: Any = None,
                  claim_id: int = None) -> Dict[str, Any]:
    """Orchestrate image analysis, keyword extraction, clause retrieval,
    decision engine and explanation generation. Persists results to DB.

    Returns a dictionary ready to be returned by the API.
    """
    
    # Ensure survey_result is a dict
    if isinstance(survey_result, str):
        try:
           survey_result = json.loads(survey_result)
        except Exception:
           print("Warning: Failed to parse survey_result string")
           survey_result = {}

    image_result = {}
    if uploaded_image_paths:
        try:
            # Preprocess and analyze
            image_result = run_image_inference(uploaded_image_paths)
        except Exception as e:
            print(f"Warning: Image analysis failed: {e}")
            # Fallback: Treat as no damage detected or inconclusive
            image_result = {"accident": False, "damage_detected": False, "details": {"error": str(e)}}

    # Extract keywords
    try:
        kw = keyword_extractor.extract_keywords(description)
        keywords = kw.get("keywords", []) if isinstance(kw, dict) else []
    except Exception as e:
        print(f"Warning: Keyword extraction failed: {e}")
        kw = {}
        keywords = []

    # Build query for RAG retrieval
    query = " ".join(filter(None, [description, " ".join(keywords)])) or description

    try:
        primary, secondary = retrieve.get_reason_aware_clauses(query, company, policy_type)
    except Exception as e:
        print(f"Warning: RAG retrieval failed: {e}")
        primary, secondary = [], []

    decision = final_decision(survey_result, image_result)

    # Generate explanation text (use top clauses)
    selected_clauses = _combine_clauses(primary, secondary)[:5]
    try:
        explanation_text = generate_explanation(
            company=company,
            policy_type=policy_type,
            reasons=decision.get("reason", []),
            clauses=selected_clauses,
            image_findings=image_result
        )
    except Exception as e:
        print(f"LLM Explanation generation failed: {e}")
        explanation_text = "Detailed explanation unavailable due to LLM service error."
    
    # Persist to DB (synchronous SQLAlchemy)
    db = SessionLocal()
    try:
        if claim_id:
             # Update existing claim
             claim = crud.get_claim(db, claim_id)
             if claim:
                 # Update fields
                 claim.final_decision = decision.get("final_decision")
                 claim.risk_level = decision.get("risk_level")
                 db.commit()
                 db.refresh(claim)
             else:
                 # Fallback if not found (should not happen)
                 claim = crud.create_claim(
                    db=db,
                    user_id=user_id,
                    company=company,
                    policy_type=policy_type,
                    description=description,
                    final_decision=decision.get("final_decision"),
                    risk_level=decision.get("risk_level")
                )
        else:
             # Create core claim row
            claim = crud.create_claim(
                db=db,
                user_id=user_id,
                company=company,
                policy_type=policy_type,
                description=description,
                final_decision=decision.get("final_decision"),
                risk_level=decision.get("risk_level")
            )

        # Save survey
        try:
            # If prediction is missing (which is likely if called from simpler frontend), calculate it now
            if isinstance(survey_result, dict) and "probability" not in survey_result:
                print("Calculating missing survey prediction...")
                
                # Flatten the nested structure for the model
                raw_flat = {}
                if "vehicleDetails" in survey_result: raw_flat.update(survey_result["vehicleDetails"])
                if "incidentDetails" in survey_result: raw_flat.update(survey_result["incidentDetails"])
                if "accidentSpecifics" in survey_result: raw_flat.update(survey_result["accidentSpecifics"])
                # Also include top-level keys just in case
                raw_flat.update({k: v for k, v in survey_result.items() if isinstance(v, (str, int, float, bool))})
                
                # --- MAPPER: Frontend (camelCase) -> Model (snake_case) ---
                model_input = {}
                
                # Direct Mappings
                key_map = {
                    "carAge": "car_age",
                    "driverAge": "driver_age",
                    "accidentTime": "accident_time",
                    "locationType": "location_type",
                    "accidentType": "accident_type",
                    "previousClaims": "previous_claims", 
                    "policeReport": "police_report", 
                    "driverAtFault": "driver_at_fault"
                }

                for fe_key, model_key in key_map.items():
                    if fe_key in raw_flat:
                        model_input[model_key] = raw_flat[fe_key]
                
                # Handle Damage Parts (Array -> Flags)
                dmg_parts = raw_flat.get("damageParts", [])
                # Ensure it's a list
                if isinstance(dmg_parts, str): 
                    # If passed as string representation
                    dmg_parts = [] 
                
                model_input["damage_front"] = 1 if "Damage Front" in dmg_parts else 0
                model_input["damage_rear"] = 1 if "Damage Rear" in dmg_parts else 0
                model_input["damage_left_side"] = 1 if "Damage Left" in dmg_parts else 0
                model_input["damage_right_side"] = 1 if "Damage Right" in dmg_parts else 0
                
                # Fallback for accident_time if needed (e.g. if model expects hour int)
                # But let's pass as-is first.
                
                print(f"DEBUG: Model Input Prepared: {model_input.keys()}")
                
                pred_out = predict_survey(model_input)
                survey_result.update(pred_out) # Merge back result

            prediction = survey_result.get("prediction") if isinstance(survey_result, dict) else None
            probability = survey_result.get("probability") if isinstance(survey_result, dict) else None
        except Exception as e:
            print(f"Error calculating/saving survey: {e}")
            prediction = None
            probability = None

        crud.save_survey_result(
            db=db,
            claim_id=claim.id,
            survey_payload=survey_result,
            survey_prediction=prediction,
            survey_probability=probability
        )

        # Save images (store aggregate result for each image file)
        if uploaded_image_paths:
            image_results = []
            filenames = []
            sanitized_result = sanitize_for_json(image_result)
            for path in uploaded_image_paths:
                image_results.append(sanitized_result)
                filenames.append(os.path.basename(path))
            
            # Re-enabled image saving with filenames
            crud.save_claim_images(db=db, claim_id=claim.id, image_results=image_results, filenames=filenames)

        # Save explanation + keywords + clauses
        crud.save_claim_explanation(
            db=db,
            claim_id=claim.id,
            extracted_keywords=sanitize_for_json(kw),
            clauses_used=sanitize_for_json(selected_clauses),
            explanation_text=explanation_text
        )
        
        # Prepare Result Dict inside session to avoid DetachedInstanceError
        result_dict = {
            "claim_id": claim.id,
            "status": decision.get("final_decision", "PENDING"),
            "final_decision": decision.get("final_decision"),
            "risk_level": decision.get("risk_level"),
            "clauses_used": selected_clauses,
            "explanation": explanation_text,
            "image_result": image_result,
            "ml_result": image_result
        }
        return result_dict

    except Exception as e:
        print(f"Error in process_claim: {e}")
        db.rollback()
        raise e
    finally:
        db.close()