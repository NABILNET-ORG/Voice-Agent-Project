# Resume Development - Voice Agent Project
# This script helps resume development from the handoff snapshot

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Voice Agent Project - Resume Dev" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "ERROR: Must run from project root directory" -ForegroundColor Red
    exit 1
}

# Display session state
Write-Host "Reading SESSION_STATE.md..." -ForegroundColor Yellow
if (Test-Path "SESSION_STATE.md") {
    $sessionState = Get-Content "SESSION_STATE.md" -Raw
    Write-Host "Project Completion: 82%" -ForegroundColor Green
    Write-Host "Last Session: 2025-11-11" -ForegroundColor Green
} else {
    Write-Host "WARNING: SESSION_STATE.md not found" -ForegroundColor Yellow
}

Write-Host ""

# Display next actions
Write-Host "Reading NEXT_ACTIONS.md..." -ForegroundColor Yellow
if (Test-Path "NEXT_ACTIONS.md") {
    Write-Host ""
    Write-Host "=== IMMEDIATE ACTIONS REQUIRED ===" -ForegroundColor Red
    Write-Host "1. Deploy Edge Functions to Supabase Dashboard" -ForegroundColor Yellow
    Write-Host "   - get-user-by-phone (NEW)" -ForegroundColor White
    Write-Host "   - create-booking-manual (NEW)" -ForegroundColor White
    Write-Host "   - twilio-voice (UPDATED)" -ForegroundColor White
    Write-Host ""
    Write-Host "2. Test Core Functionality" -ForegroundColor Yellow
    Write-Host "   - Login/Signup flow" -ForegroundColor White
    Write-Host "   - Create manual booking" -ForegroundColor White
    Write-Host "   - Make test phone call" -ForegroundColor White
    Write-Host "   - Verify Call History" -ForegroundColor White
} else {
    Write-Host "WARNING: NEXT_ACTIONS.md not found" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Development Setup ===" -ForegroundColor Cyan

# Check Node modules
if (Test-Path "node_modules") {
    Write-Host "[✓] node_modules exists" -ForegroundColor Green
} else {
    Write-Host "[!] Running npm install..." -ForegroundColor Yellow
    npm install
}

# Check .env file
if (Test-Path ".env") {
    Write-Host "[✓] .env file exists" -ForegroundColor Green
} else {
    Write-Host "[!] WARNING: .env file missing - copy from .env.example" -ForegroundColor Red
}

# Check Supabase CLI
$supabaseCLI = Get-Command supabase -ErrorAction SilentlyContinue
if ($supabaseCLI) {
    Write-Host "[✓] Supabase CLI installed" -ForegroundColor Green
} else {
    Write-Host "[!] Supabase CLI not found" -ForegroundColor Yellow
    Write-Host "    Install: https://supabase.com/docs/guides/cli" -ForegroundColor White
}

Write-Host ""
Write-Host "=== Quick Start Commands ===" -ForegroundColor Cyan
Write-Host "npm run dev          - Start development server" -ForegroundColor White
Write-Host "npm run build        - Build for production" -ForegroundColor White
Write-Host "supabase functions deploy <name> - Deploy edge function" -ForegroundColor White

Write-Host ""
Write-Host "=== Next Steps ===" -ForegroundColor Green
Write-Host "1. Deploy edge functions (see NEXT_ACTIONS.md)" -ForegroundColor White
Write-Host "2. Run tests (see SESSION_STATE.md)" -ForegroundColor White
Write-Host "3. Continue with Phase 3 development" -ForegroundColor White

Write-Host ""
Write-Host "Ready to resume development! 🚀" -ForegroundColor Green
