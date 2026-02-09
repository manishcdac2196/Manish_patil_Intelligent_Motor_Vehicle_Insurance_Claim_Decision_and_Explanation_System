# Backend setup notes

This document contains environment notes and instructions for running the backend, especially the RAG (retrieval) components which have OS-dependent dependencies.

## Python requirements
- Primary dependencies are listed in `backend/requirement.txt`.
- We added `sentence-transformers` and `hnswlib` to support embedding generation and HNSW indexing.
- **FAISS** is **not** included by default because it requires platform-appropriate installation (conda or Linux wheels). If you want FAISS (recommended for production speed on Linux), install via conda:

```bash
conda install -c conda-forge faiss-cpu
# or for GPU
conda install -c conda-forge faiss-gpu
```

Windows users: installing `faiss` via pip is often problematic. Use WSL (Ubuntu) or a Linux container, or conda on a supported platform.

## Torch (PyTorch)
- `torch` and `torchvision` are environment-specific and large. For CPU-only installs use the official PyTorch instructions and pick the correct wheel for your OS and Python version. Example:

```bash
pip install "torch --index-url https://download.pytorch.org/whl/cpu"
```

If you need GPU builds, follow instructions at https://pytorch.org/get-started/locally/.

## RAG indices supported
- FAISS (fast, recommended on Linux/WSL/Conda)
- HNSW (with `hnswlib`) — cross-platform and available on Windows
- Brute-force fallback using saved embeddings (numpy)

Use `backend/rag/build_index.py` to build an index; it will choose FAISS if available, otherwise HNSW if available, otherwise save embeddings and metadata for brute-force retrieval.

## Frontend
- The frontend requires Node >= 20.19. See the project root instructions to upgrade Node (nvm recommended on Windows: nvm-windows).

## Tips
- If you change embedding model or corpus, re-run `backend/rag/build_index.py` to regenerate index and metadata.
- If you need help installing `faiss` on your platform I can add a script or Dockerfile/WSL instructions.

- YOLO / Ultralytics note: `ultralytics` is optional. If `ultralytics` is not installed or the YOLO model file `yolov8n.pt` is absent the image preprocessing will fall back to a center-crop + resize step so the backend can still run; install `ultralytics` to enable advanced car detection and tighter cropping for image-based analysis.

## Quick start (development) ✅
- Use the project-level `start-project.ps1` (Windows PowerShell) to launch both backend and frontend in separate windows. The script now resolves the project root no matter the current working directory.
- **PostgreSQL required**: The backend no longer supports SQLite. `DATABASE_URL` **must** be set to a PostgreSQL URL (for example: `postgresql://user:password@host:port/dbname`). The server fails fast on startup if `DATABASE_URL` is missing or not a PostgreSQL URL.
- To run only the backend for debugging and to see logs in the current terminal:
  - Activate your Python venv and run: `python -m uvicorn main:app --host 127.0.0.1 --port 8000`
- Optional: the backend will try to warm heavy ML models at startup to reduce first-request latency. Control this with the `DEV_WARM_MODELS` environment variable (set to `0` to disable).
- The frontend requires Node >= 20.19. The `start-project.ps1` script will use a portable Node installation in `%LOCALAPPDATA%` if present.

