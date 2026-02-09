import requests
import json

MODEL_NAME = "llama3"

# ---- CONFIG ----
ALLOWED_REASON_CODES = [
    "ALCOHOL_INTOXICATION",
    "INVALID_LICENSE",
    "FIR_NOT_SUBMITTED",
    "DELAY_IN_INTIMATION",
    "POLICY_EXPIRED",
    "ADDON_NOT_COVERED",
    "UNAUTHORIZED_USE",
    "NON_DISCLOSURE",
    "MECHANICAL_FAILURE",
    "PROCEDURAL_VIOLATION",
    "UNKNOWN"
]

# ---- PROMPT TEMPLATE (MCP CONTROLLED) ----
PROMPT_TEMPLATE = """
You are an insurance claim analysis assistant specializing in motor insurance.

Task:
Identify the reason(s) for claim rejection from the given text.

STRICT RULES:
- Choose reason_code ONLY from the allowed list
- Do NOT guess or assume
- If no clear reason is found, return ONLY "UNKNOWN"
- Multiple reasons may be returned only if clearly stated
- Return VALID JSON only (no explanation text)

Allowed reason_code values:
{allowed_codes}

Output JSON format:
{{
  "rejection_reasons": [
    {{
      "reason_code": "<CODE>",
      "confidence": "HIGH | MEDIUM | LOW"
    }}
  ]
}}

Claim Text:
\"\"\"
{text}
\"\"\"
"""


def extract_rejection_reasons(text: str) -> dict:
    """
    Extract structured claim rejection reasons using LLM.
    MCP-enforced: no guessing, no hallucination.
    """

    prompt = PROMPT_TEMPLATE.format(
        allowed_codes=", ".join(ALLOWED_REASON_CODES),
        text=text.strip()
    )

    payload = {
        "model": MODEL_NAME,
        "prompt": prompt,
        "stream": False
    }

    try:
        response = requests.post("http://localhost:11434/api/generate", json=payload, timeout=120)
        response.raise_for_status()
        result_text = response.json().get("response", "")
        return _safe_parse_llm_output(result_text)
    except Exception as e:
        print(f"Error in extract_rejection_reasons: {e}")
        return {
            "rejection_reasons": [
                {"reason_code": "UNKNOWN", "confidence": "LOW"}
            ]
        }


def _safe_parse_llm_output(output: str) -> dict:
    """
    Safely parse LLM output.
    Falls back to UNKNOWN if parsing fails or output is invalid.
    """
    try:
        parsed = json.loads(output)

        # Minimal validation
        reasons = parsed.get("rejection_reasons", [])
        if not reasons:
            raise ValueError("Empty reasons")

        for r in reasons:
            if r.get("reason_code") not in ALLOWED_REASON_CODES:
                raise ValueError("Invalid reason_code")

        return parsed

    except Exception:
        return {
            "rejection_reasons": [
                {"reason_code": "UNKNOWN", "confidence": "LOW"}
            ]
        }


# ---- TEST ----
if __name__ == "__main__":
    test_text = (
        "Claim rejected because the driver was under the influence of alcohol "
        "and FIR was not submitted."
    )

    print(json.dumps(extract_rejection_reasons(test_text), indent=2))
