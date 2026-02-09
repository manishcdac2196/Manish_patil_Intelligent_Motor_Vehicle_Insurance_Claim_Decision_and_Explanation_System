import requests
import sys

OLLAMA_BASE_URL = "http://localhost:11434"
MODEL_NAME = "llama3"

def check_ollama():
    print(f"Checking Ollama at {OLLAMA_BASE_URL}...")
    
    # 1. Check if server is up
    try:
        res = requests.get(f"{OLLAMA_BASE_URL}/")
        if res.status_code == 200:
            print("SUCCESS: Ollama server is running.")
        else:
            print(f"WARNING: Ollama server responded with {res.status_code}")
    except Exception as e:
        print(f"CRITICAL: Could not connect to Ollama. Is it running? Error: {e}")
        sys.exit(1)

    # 2. Check for 'llama3' model
    print("\nChecking available models...")
    try:
        res = requests.get(f"{OLLAMA_BASE_URL}/api/tags")
        if res.status_code == 200:
            models = res.json().get('models', [])
            model_names = [m['name'] for m in models]
            print(f"Found models: {model_names}")
            
            # Check for partial match (e.g. 'llama3:latest')
            found = any(MODEL_NAME in m for m in model_names)
            if found:
                print(f"SUCCESS: Model '{MODEL_NAME}' found.")
            else:
                print(f"FAILURE: Model '{MODEL_NAME}' NOT found. Please run 'ollama pull {MODEL_NAME}'")
        else:
            print(f"ERROR: Failed to list models. Status: {res.status_code}")
    except Exception as e:
        print(f"ERROR: Exception while listing models: {e}")

    # 3. Test Generation
    print("\nTesting generation (short ping)...")
    try:
        payload = {
            "model": MODEL_NAME,
            "prompt": "Say 'Hello' in one word.",
            "stream": False
        }
        res = requests.post(f"{OLLAMA_BASE_URL}/api/generate", json=payload, timeout=10)
        if res.status_code == 200:
            print(f"Generation Response: {res.json().get('response', '').strip()}")
            print("SUCCESS: LLM is working.")
        else:
            print(f"FAILURE: Generation failed. Status: {res.status_code}, Body: {res.text}")
    except Exception as e:
        print(f"FAILURE: Exception during generation: {e}")

if __name__ == "__main__":
    check_ollama()
