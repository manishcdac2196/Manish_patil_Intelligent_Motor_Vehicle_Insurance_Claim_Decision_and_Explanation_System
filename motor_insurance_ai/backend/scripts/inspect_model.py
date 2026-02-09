import binascii
from pathlib import Path
p = Path(__file__).resolve().parents[0] / '..' / 'ml' / 'Claim_model' / 'claim_approval_model.pkl'
print('PATH:', p)
if not p.exists():
    print('File not found')
    raise SystemExit(1)

b = p.open('rb').read(128)
print('First bytes (hex):', binascii.hexlify(b[:32]))

# Try pickle
import pickle
try:
    with p.open('rb') as f:
        obj = pickle.load(f)
    print('pickle: loaded, type=', type(obj))
except Exception as e:
    print('pickle error:', repr(e))

# Try joblib
try:
    import joblib
    obj = joblib.load(p)
    print('joblib: loaded, type=', type(obj))
except Exception as e:
    print('joblib error:', repr(e))

# Try cloudpickle
try:
    import cloudpickle
    with p.open('rb') as f:
        obj = cloudpickle.load(f)
    print('cloudpickle: loaded, type=', type(obj))
except Exception as e:
    print('cloudpickle error:', repr(e))

# Print file size
print('File size (bytes):', p.stat().st_size)
