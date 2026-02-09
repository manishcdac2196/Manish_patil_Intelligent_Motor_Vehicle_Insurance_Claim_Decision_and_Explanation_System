import requests
import json

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "llama3"

def generate_explanation(company, policy_type, reasons, clauses, image_findings=None):
    clause_text = "\n".join(
        [f"- {c.get('clause_text', '')}" for c in clauses]
    )
    
    visual_context = ""
    if image_findings:
        details = []
        if image_findings.get("severity"):
            details.append(f"Severity: {image_findings['severity']}")
        if image_findings.get("damage_detected"):
            details.append(f"Damage Detected: YES")
        if image_findings.get("claimability"):
            details.append(f"Claimability Status: {image_findings['claimability']}")
        if image_findings.get("reasoning"):
            details.append(f"Visual Observations: {', '.join(image_findings['reasoning'])}")
        
        visual_context = "\nVisual Evidence Analysis:\n" + "\n".join(details)

    prompt = f"""
You are an expert insurance claim analyst.

Claim Context:
Company: {company}
Policy: {policy_type}
Decision Factors: {reasons}

{visual_context}

Relevant Policy Clauses:
{clause_text}

Task:
Generate a professional claim assessment.
1. Synthesize the decision factors and visual evidence into a clear explanation.
2. If visuals are provided, explicitly mention what the AI "saw" (e.g., "The image analysis confirms major damage...").
3. Cite the specific policy clauses that justify the decision.

Output Format (STRICTLY follow these headers):

## Explanation
<A detailed 3-4 sentence paragraph explaining the decision, citing policy and visual evidence.>

## Visual Analysis
<A specific note on what the image analysis found (e.g., "The AI detected a major dent on the front bumper which aligns with the incident report...").>

## Evidence Used
- <Bullet points of the exact policy clauses or rules applied>
"""

    payload = {
        "model": MODEL_NAME,
        "prompt": prompt,
        "stream": False
    }

    try:
        response = requests.post(OLLAMA_URL, json=payload, timeout=120)
        response.raise_for_status()
        data = response.json()
        return data.get("response", "Explanation generation failed (no response).")
    except Exception as e:
        print(f"Error generating explanation: {e}")
        return "Explanation unavailable at this time."
