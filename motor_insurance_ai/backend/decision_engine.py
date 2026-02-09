def final_decision(survey_result: dict, image_result: dict):
    """
    Combine survey + image model outputs
    """

    # Default structure
    decision = {
        "final_decision": "APPROVED",
        "reason": [],
        "risk_level": "LOW"
    }

    # ---- Image-based rejection ----
    # ---- Image-based Analysis ----
    claimability = image_result.get("claimability")
    
    if claimability == "Non-Claimable":
        decision["final_decision"] = "REJECTED"
        # Append main reason
        decision["reason"].append(image_result.get("final_insurance_reason", "Damage criteria not met"))
        decision["risk_level"] = "HIGH"
        
    elif claimability == "Requires Review":
        decision["final_decision"] = "REQUIRES_REVIEW"
        decision["risk_level"] = "MEDIUM"
        decision["reason"].append("Image Evidence requires manual review (Severity/Confidence Check)")
        
    elif image_result.get("damage_detected") is False and image_result.get("details"):
        # If no damage but not explicitly "Non-Claimable" (maybe just low confidence?)
        # But usually inference sets Non-Claimable if no damage.
        pass

    # ---- Survey-based rejection ----
    # Wrapper to handle nested structure or direct access
    def get_field(path):
        parts = path.split('.')
        curr = survey_result
        for p in parts:
            if isinstance(curr, dict):
                curr = curr.get(p)
            else:
                return None
        return curr

    # Example Logic Check 1: Policy Expired (computed)
    if get_field("computed.claimable_policy") is False:
        decision["final_decision"] = "REJECTED"
        decision["reason"].append("Policy Expired or Invalid")
        decision["risk_level"] = "HIGH"

    # Example Logic Check 2: Alcohol Intoxication (accidentSpecifics)
    if get_field("accidentSpecifics.alcoholIntoxicated") is True:
        decision["final_decision"] = "REJECTED"
        decision["reason"].append("Driver Alcohol Intoxication Detected")
        decision["risk_level"] = "HIGH"

    # Example Logic Check 3: Invalid License
    if get_field("accidentSpecifics.driverLicenseValid") is False:
        decision["final_decision"] = "REJECTED"
        decision["reason"].append("Driver License Invalid")
        decision["risk_level"] = "HIGH"

    # Legacy fallback if "prediction" key exists directly
    if survey_result.get("prediction") == "REJECTED":
        decision["final_decision"] = "REJECTED"
        decision["reason"].append("Survey risk factors failed (Auto-ML)")
        decision["risk_level"] = "HIGH"

    if not decision["reason"]:
        decision["reason"].append("All checks passed")

    return decision
