Motor Insurance AI System (Production Ready)

This project has been standardized and verified for production use.
Key Features

    Strict Authentication: Role-based access (Policy Holder vs. Insurance Company) secured by JWT.
    Unified Claim Pipeline: One-shot submission handling Image ML, Policy RAG, and Decision Engine.
    Robust Persistence: Claims are saved safely to PostgreSQL before processing begins to prevent data loss.
    Thin Frontend: All business logic resides in the backend; the frontend is a pure orchestration layer.

Project Structure

    backend/: FastAPI application, Python logic (ML, RAG).
    Frontend/: React (Vite) application.
    start-project.ps1: Single script to launch the full system.

Prerequisites

    PostgreSQL: Must be installed and running.
    Python 3.8+: With dependencies installed (pip install -r backend/requirements.txt).
    Node.js: With dependencies installed (npm install in frontend).

How to Run

    Configure Database: Ensure your local PostgreSQL is running. The default connection string in start-project.ps1 is: postgresql://postgresql:abhishekc1@localhost:5432/motor_insurance_db (Edit the script or set DATABASE_URL env var if yours differs)

    Start System: Run the PowerShell script:

    ./start-project.ps1

    This will launch both Backend (port 8000) and Frontend (port 5173).

Verification

    Login: Use the Sign Up page to create a User account.
    Claim: Submit a claim. You will be redirected to the dashboard.
    Data: Check your Database; tables claims, claim_images, claim_surveys will be populated.

