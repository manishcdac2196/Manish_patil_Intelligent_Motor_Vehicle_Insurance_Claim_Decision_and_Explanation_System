from llm.reason_extractor import extract_rejection_reasons
from llm.explanation_gen import generate_explanation
from rag.retrieve import get_reason_aware_clauses


def run_rag_pipeline(
    decision_context: dict,
    company: str,
    policy_type: str
):
    """
    Full RAG pipeline:
    Decision → Reason Extraction → Clause Retrieval → LLM Explanation
    """

    # Step 1: Convert decision to text
    decision_text = " ".join(decision_context.get("reason", []))

    # Step 2: Extract structured rejection reasons (MCP)
    extracted = extract_rejection_reasons(decision_text)
    reasons = [
        r["reason_code"]
        for r in extracted.get("rejection_reasons", [])
    ]

    # Step 3: Retrieve relevant clauses
    primary, secondary = get_reason_aware_clauses(
        query=decision_text,
        company=company,
        policy_type=policy_type
    )

    clauses = primary + secondary

    # Step 4: Generate final explanation (LLM)
    explanation = generate_explanation(
        company=company,
        policy_type=policy_type,
        reasons=reasons,
        clauses=clauses
    )

    return {
        "decision": decision_context["final_decision"],
        "risk_level": decision_context.get("risk_level"),
        "reasons": reasons,
        "clauses_used": clauses,
        "explanation": explanation
    }
