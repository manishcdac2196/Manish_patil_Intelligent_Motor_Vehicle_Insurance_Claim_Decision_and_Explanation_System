
import os
import sys
import pickle
import joblib

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from ml.Claim_model.predict import _load_pipeline

with open("model_features.txt", "w") as f:
    try:
        pipeline = _load_pipeline()
        if pipeline:
            f.write("Model Loaded Successfully!\n")
            if hasattr(pipeline, 'feature_names_in_'):
                f.write(f"Expected Features: {list(pipeline.feature_names_in_)}\n")
            else:
                f.write("Model does not have feature_names_in_ attribute.\n")
                
        else:
            f.write("Failed to load model.\n")

    except Exception as e:
        f.write(f"Error: {e}\n")
