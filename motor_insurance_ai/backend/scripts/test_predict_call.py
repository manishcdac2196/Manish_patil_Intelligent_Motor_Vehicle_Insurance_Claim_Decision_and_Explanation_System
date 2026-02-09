import sys, os, traceback
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
try:
    from ml.Claim_model import predict as p
    print('module loaded, pipeline is', type(getattr(p, 'pipeline', None)))
    print('calling predict_survey...')
    print(p.predict_survey({}))
except Exception:
    traceback.print_exc()
