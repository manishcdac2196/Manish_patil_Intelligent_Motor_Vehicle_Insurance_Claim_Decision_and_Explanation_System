from typing import List, Optional, Dict, Any
from datetime import datetime
from db import models

def map_claim_to_frontend(claim: models.Claim) -> Dict[str, Any]:
    """
    Transforms a DB Claim object into the nested structure the Frontend expects.
    """
    
    # 1. Extract Vehicle Details from Survey
    vehicle_details = {
        "registrationNumber": "Unknown",
        "insurerName": claim.company,
        "vehicleType": claim.policy_type,
        "carAge": 0
    }
    
    incident_details = {}
    accident_specifics = {}
    
    # Assuming the most recent survey is the relevant one
    # We sort by id desc just in case, or rely on list order if reliable
    if claim.surveys:
        # Pick the last one (most recent usually)
        latest_survey = claim.surveys[-1] 
        payload = latest_survey.survey_payload or {}
        
        # Merge if keys exist
        if "vehicleDetails" in payload:
            vehicle_details.update(payload["vehicleDetails"])
            
        if "incidentDetails" in payload:
            incident_details.update(payload["incidentDetails"])
            
        if "accidentSpecifics" in payload:
            accident_specifics.update(payload["accidentSpecifics"])

    # 2. Construct AI Analysis
    # Frontend expects: 
    # { 
    #   confidence: number, 
    #   damagePercent: number, 
    #   approvalProbability: number,
    #   explanations: string[],
    #   ragMatches: []
    # }
    
    ai_analysis = {
        "confidence": 0.0,
        "damagePercent": 0,
        "approvalProbability": 0.0,
        "explanations": [],
        "ragMatches": []
    }
    
    # From Image Results
    if claim.images:
        # Aggregate logic? Or just take the first one?
        # Let's take the first for simplicity or aggregate
        # Frontend usually looks for 'damage_score' or similar
        # Let's look at one image result
        img_res = claim.images[0].image_result or {}
        
        # Extract fields
        # Extract fields
        damage_conf = img_res.get("confidence", 0.0)
        
        # Update AI Analysis
        ai_analysis["confidence"] = damage_conf
        ai_analysis["damagePercent"] = int(damage_conf * 100)
        
        # New Fields
        ai_analysis["severity"] = img_res.get("severity", "N/A")
        ai_analysis["evidence_strength"] = img_res.get("evidence_strength", "N/A")
        ai_analysis["worst_damage"] = img_res.get("worst_damage", "N/A")
        ai_analysis["annotated_images"] = img_res.get("annotated_images", [])
        ai_analysis["damage_detected"] = img_res.get("damage_detected", False)
        ai_analysis["claimability"] = img_res.get("claimability", "Unknown")
        
        # If explanation is missing, use reasoning from ML
        if not ai_analysis["explanations"] and "reasoning" in img_res:
             ai_analysis["explanations"] = img_res["reasoning"]

    # From Explanations
    if claim.explanations:
        expl = claim.explanations[-1]
        text = expl.explanation_text or ""
        
        # Parse Sections (Markdown style headers)
        import re
        
        # Default empty
        ai_analysis["explanation"] = ""
        ai_analysis["visual_analysis"] = ""
        ai_analysis["evidence_list"] = []
        
        # Extract Explanation
        exp_match = re.search(r"## Explanation\s*(.*?)\s*(?=##|$)", text, re.DOTALL)
        if exp_match:
            ai_analysis["explanation"] = exp_match.group(1).strip()
            
        # Extract Visual Analysis
        vis_match = re.search(r"## Visual Analysis\s*(.*?)\s*(?=##|$)", text, re.DOTALL)
        if vis_match:
            ai_analysis["visual_analysis"] = vis_match.group(1).strip()
            
        # Extract Evidence List
        ev_match = re.search(r"## Evidence Used\s*(.*?)\s*(?=##|$)", text, re.DOTALL)
        if ev_match:
            raw_evidence = ev_match.group(1).strip()
            # Split by - or *
            items = [item.strip() for item in re.split(r"[\-\*]\s+", raw_evidence) if item.strip()]
            ai_analysis["evidence_list"] = items
            
        # Fallback if parsing fails (old format or error)
        if not ai_analysis["explanation"]:
             ai_analysis["explanation"] = text # Just dump the whole thing
             
    # Map old 'ragMatches' if needed, but we prefer the parsed evidence list now
    if claim.explanations:
         expl = claim.explanations[-1]
         if expl.clauses_used:
             matches = []
             for c in expl.clauses_used:
                 matches.append({
                     "text": c.get("clause_text") or c.get("text"),
                     "source": c.get("doc_name") or c.get("source"),
                     "page": c.get("page", 0),
                     "score": 0.95
                 })
             ai_analysis["ragMatches"] = matches
             
    # From Survey Result (Prediction)
    if claim.surveys:
        s = claim.surveys[-1]
        if s.survey_probability:
             ai_analysis["approvalProbability"] = s.survey_probability
             ai_analysis["confidence"] = s.survey_probability # Mapping same for now
             
    # 3. Construct Images list
    images_list = []
    # In a real app, we'd return signed URLs or similar.
    # Here we assume we serve static files or have a way to view them.
    # For now, let's leave empty or placeholder if we don't have a URL field.
    # Wait, the DB doesn't store the URL/Path? 
    # The 'image_result' JSON might contain the path if we saved it?
    # Checking claim_processor.py -> preprocess_images returns paths?
    # We didn't explicitly store the file path in ClaimImage table columns, 
    # checking models.py -> ClaimImage only has image_result (JSON).
    # We should have stored the path in the JSON result!
    
    if claim.images:
        for img in claim.images:
            # Construct URL from filename. Assuming we mount /uploads in main.py
            # If filename is just basename:
            url = f"http://localhost:8000/uploads/{img.filename}" 
            # Or use relative path if frontend prepends host. Let's use absolute for safety in dev.
            
            images_list.append({
                "url": url
            })

    return {
        "id": claim.id,
        "createdAt": claim.created_at.isoformat() if claim.created_at else datetime.now().isoformat(),
        "status": claim.final_decision or "PENDING",
        "userId": str(claim.user_id), # Frontend expects string?
        "policyNumber": vehicle_details.get("policyNumber", "N/A"),
        
        "vehicleDetails": vehicle_details,
        "incidentDetails": incident_details,
        "accidentSpecifics": accident_specifics,
        
        "images": images_list,
        "aiAnalysis": ai_analysis
    }
