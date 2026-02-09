import pickle
import pandas as pd
import os
import logging

logger = logging.getLogger(__name__)

BASE_DIR = os.path.dirname(__file__)
PKL_PATH = os.path.join(BASE_DIR, "claim_approval_model.pkl")
JOBLIB_PATH = os.path.join(BASE_DIR, "claim_approval_model.joblib")

# Lazy load the pipeline on first use. Prefer joblib (.joblib) if present,
# fall back to joblib.load on .pkl (works for many sklearn artifacts), then
# pickle as a final fallback.
pipeline = None
_loaded_from = None


def _load_pipeline():
    """Attempts to load the pipeline from supported files and sets
    the module-level `pipeline` and `_loaded_from` variables.
    Returns the loaded pipeline or None on failure."""
    global pipeline, _loaded_from
    if pipeline is not None:
        return pipeline

    # Try joblib file first
    if os.path.exists(JOBLIB_PATH):
        try:
            import joblib
            pipeline = joblib.load(JOBLIB_PATH)
            _loaded_from = JOBLIB_PATH
            logger.info("Loaded pipeline with joblib from %s", JOBLIB_PATH)
            return pipeline
        except Exception as e:
            logger.warning("joblib load from %s failed: %s", JOBLIB_PATH, e)

    # Try joblib on the .pkl file (sometimes joblib can read it)
    if os.path.exists(PKL_PATH):
        try:
            import joblib
            pipeline = joblib.load(PKL_PATH)
            _loaded_from = PKL_PATH
            logger.info("Loaded pipeline with joblib from %s", PKL_PATH)
            return pipeline
        except Exception:
            logger.debug("joblib on %s failed, falling back to pickle", PKL_PATH)

        # Fall back to pickle
        try:
            with open(PKL_PATH, "rb") as f:
                pipeline = pickle.load(f)
            _loaded_from = PKL_PATH
            logger.info("Loaded pipeline with pickle from %s", PKL_PATH)
            return pipeline
        except Exception as e:
            logger.warning("Failed to load pipeline using pickle from %s: %s", PKL_PATH, e)

    logger.warning("No pipeline file found at %s or %s", JOBLIB_PATH, PKL_PATH)
    return None


def get_model_metadata():
    """Return metadata for the model (if available).

    Example response:
    {
        "available": True,
        "loaded_from": ".../claim_approval_model.joblib",
        "model_type": "sklearn.pipeline.Pipeline",
        "feature_names": [...],
        "named_steps": [...]
    }
    """
    mdl = _load_pipeline()
    if mdl is None:
        return {"available": False, "loaded_from": None}

    metadata = {
        "available": True,
        "loaded_from": _loaded_from,
        "model_type": str(type(mdl)),
        "feature_names": list(getattr(mdl, 'feature_names_in_', [])),
        "named_steps": list(getattr(mdl, 'named_steps', {}).keys())
    }
    return metadata


def predict_survey(data: dict):
    """
    Uses the trained pipeline (encoder + classifier). If the model
    isn't available or failed to load, returns a placeholder prediction.
    """
    df = pd.DataFrame([data])

    _load_pipeline()

    if pipeline is None:
        # Placeholder response when model is not available
        return {
            "prediction": "APPROVED",
            "probability": 0.5,
            "note": "Model unavailable; placeholder result returned"
        }

    # Validate input columns against model's expected features (if available)
    expected = list(getattr(pipeline, 'feature_names_in_', []))
    if expected:
        missing = [f for f in expected if f not in df.columns]
        if missing:
            logger.warning("Missing required fields for prediction: %s", missing)
            return {
                "error": "missing required fields",
                "required_fields": expected,
                "missing_fields": missing
            }

    try:
        prob = pipeline.predict_proba(df)[0][1]
    except Exception as e:
        logger.warning("Prediction failed: %s", e, exc_info=True)
        # Return placeholder instead of crashing the server
        return {
            "prediction": "APPROVED",
            "probability": 0.5,
            "note": "Prediction failed; placeholder result returned",
            "error": str(e)
        }

    return {
        "prediction": "APPROVED" if prob >= 0.5 else "REJECTED",
        "probability": round(float(prob), 3)
    }
