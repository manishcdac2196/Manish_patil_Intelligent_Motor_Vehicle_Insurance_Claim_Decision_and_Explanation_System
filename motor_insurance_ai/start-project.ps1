Param(
    [string]$DatabaseUrl = $env:DATABASE_URL
)

if ([string]::IsNullOrWhiteSpace($DatabaseUrl)) {
    # Defaulting to typically common credentials but using the password gathered (abhishekc1)
    # Correcting username to 'postgres' which is standard
    $DefaultUrl = "postgresql://postgres:abhishekc1@localhost:5432/motor_insurance_db"
    
    Write-Host "No DATABASE_URL provided. Defaulting to: $DefaultUrl"
    Write-Host "Set `DATABASE_URL` environment variable to override if these credentials are wrong."
    $DatabaseUrl = $DefaultUrl
}

# Resolve script directory robustly so script can be run from any cwd
$scriptDir = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Definition }
$root = [System.IO.Path]::GetFullPath($scriptDir)
Write-Host "Starting project from: $root"

# --------------------
# Backend (FastAPI)
# --------------------
$backendVenv = Join-Path $root 'motor\Scripts\Activate.ps1'
$backendCmdParts = @()
if (Test-Path $backendVenv) {
    $backendCmdParts += "& '$backendVenv'"
}
else {
    Write-Host "Warning: Virtual environment activate script not found at $backendVenv. Using system python if available."
}
$backendCmdParts += "`$env:DATABASE_URL='$DatabaseUrl'"
$backendCmdParts += "cd '$root\backend'"
$backendCmdParts += "if (-not (Test-Path '..\data\All_Polices_SEMANTIC.json')) { Write-Host 'Enriching RAG metadata...'; python rag/enrich_metadata.py } else { Write-Host 'RAG metadata found.' }"
$backendCmdParts += "if (-not (Test-Path 'rag\rag_index\faiss.index')) { Write-Host 'Building RAG index...'; python rag/build_index.py } else { Write-Host 'RAG index found.' }"
$backendCmdParts += "if (Get-Command uvicorn -ErrorAction SilentlyContinue) { uvicorn main:app --host 127.0.0.1 --port 8000 --reload } else { python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload }"
$backendCmd = $backendCmdParts -join "; "
Start-Process powershell -ArgumentList @('-NoExit', '-NoProfile', '-Command', $backendCmd) -WindowStyle Normal
Write-Host "Backend window launched."

# --------------------
# Frontend (Vite)
# --------------------
if (Get-Command npm -ErrorAction SilentlyContinue) {
    Write-Host "Node.js/npm found in PATH."
    $frontendCmd = "cd '$root\Frontend\modified_frontend'; if (-not (Test-Path node_modules)) { npm install } ; npm run dev"
}
else {
    Write-Host "Error: Node.js (npm) not found in PATH. Please install Node.js." -ForegroundColor Red
    $frontendCmd = "Write-Host 'Node.js not found. Install Node.js and restart.' -ForegroundColor Red; Read-Host 'Press Enter to exit'"
}

Start-Process powershell -ArgumentList @('-NoExit', '-NoProfile', '-Command', $frontendCmd) -WindowStyle Normal
Write-Host "Frontend window launched."

# --------------------
# AI Model (Ollama)
# --------------------
if (Get-Command ollama -ErrorAction SilentlyContinue) {
    Write-Host "Ollama found. Starting model 'llama3'..."
    $ollamaCmd = "ollama run llama3"
    Start-Process powershell -ArgumentList @('-NoExit', '-NoProfile', '-Command', $ollamaCmd) -WindowStyle Normal
    Write-Host "Ollama window launched."
}
else {
    Write-Host "Warning: Ollama not found. AI features (RAG/LLM) will not work." -ForegroundColor Yellow
}

Write-Host "All processes started. Use the opened PowerShell windows to view logs and stop services."