"""Resave the trained pipeline into a joblib file for compatibility.

This script will try to load an existing model from either
`claim_approval_model.joblib` or `claim_approval_model.pkl` and will
write `claim_approval_model.joblib` (backing up an existing file if present).

Run:
  python resave_model.py

"""
from pathlib import Path
import shutil
import datetime

BASE_DIR = Path(__file__).resolve().parents[1] / 'ml' / 'Claim_model'
PKL = BASE_DIR / 'claim_approval_model.pkl'
JOBLIB = BASE_DIR / 'claim_approval_model.joblib'

print('BASE_DIR:', BASE_DIR)

pipeline = None
loaded_from = None

# Try joblib first
try:
    import joblib
    if JOBLIB.exists():
        pipeline = joblib.load(JOBLIB)
        loaded_from = JOBLIB
        print('Loaded existing joblib from', JOBLIB)
except Exception as e:
    print('joblib load of existing joblib failed (or no file):', e)

if pipeline is None:
    # Try joblib on pkl
    try:
        import joblib
        if PKL.exists():
            pipeline = joblib.load(PKL)
            loaded_from = PKL
            print('Loaded model with joblib from', PKL)
    except Exception as e:
        print('joblib loading from pkl failed:', e)

if pipeline is None and PKL.exists():
    # Try pickle
    import pickle
    try:
        with open(PKL, 'rb') as f:
            pipeline = pickle.load(f)
        loaded_from = PKL
        print('Loaded model with pickle from', PKL)
    except Exception as e:
        print('pickle load failed:', e)

if pipeline is None:
    print('Could not load any model; aborting.')
    raise SystemExit(1)

# Backup existing joblib if exists
if JOBLIB.exists():
    bak = JOBLIB.with_suffix('.joblib.bak.' + datetime.datetime.now().strftime('%Y%m%d%H%M%S'))
    shutil.copy2(JOBLIB, bak)
    print('Backed up existing joblib to', bak)

# Dump to joblib
try:
    import joblib
    joblib.dump(pipeline, JOBLIB)
    print('Saved pipeline to', JOBLIB)
    print('Source loaded from', loaded_from)
except Exception as e:
    print('Failed to dump joblib:', e)
    raise
