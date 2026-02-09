def generate_explanation(context: dict):
    decision = context.get("final_decision")
    reasons = context.get("reason", [])

    if decision == "APPROVED":
        return (
            "The claim has been approved based on policy coverage, "
            "acceptable vehicle condition, and low risk indicators."
        )

    return (
        "The claim has been rejected due to the following reasons: "
        + "; ".join(reasons)
        + ". This decision aligns with policy exclusions and risk assessment rules."
    )
