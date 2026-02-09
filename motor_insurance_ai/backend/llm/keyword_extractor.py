import requests
import json

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "llama3"

SYSTEM_PROMPT = """
You are an insurance domain information extractor.

Your task:
- Extract structured information from an accident description.
- Do NOT explain.
- Do NOT make decisions.
- Output ONLY valid JSON.

JSON schema:
{
  "incident_type": string,
  "damage_severity": "minor" | "moderate" | "major",
  "keywords": [string]
}

Rules:
- keywords must be concrete vehicle parts or damage indicators
- incident_type must be one word
- damage_severity must be inferred conservatively
"""

def extract_keywords(description: str) -> dict:
    prompt = f"""
SYSTEM:
{SYSTEM_PROMPT}

USER:
Accident description:
\"\"\"{description}\"\"\"

Return JSON only.
"""

    payload = {
        "model": MODEL_NAME,
        "prompt": prompt,
        "stream": False
    }

    response = requests.post(OLLAMA_URL, json=payload, timeout=120)
    response.raise_for_status()

    raw = response.json()["response"]

    # Safety parse
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {
            "incident_type": "unknown",
            "damage_severity": "unknown",
            "keywords": []
        }
