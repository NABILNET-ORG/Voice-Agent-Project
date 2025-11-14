# Resume Development Script
# Universal AI Booking System
# Created: 2025-11-11

Write-Host "=== Resume Development Session ===" -ForegroundColor Cyan
Write-Host ""

# Display current session state
Write-Host "Reading SESSION_STATE.md..." -ForegroundColor Yellow
if (Test-Path "SESSION_STATE.md") {
    $sessionState = Get-Content "SESSION_STATE.md" -Raw
    Write-Host "✓ Session state loaded" -ForegroundColor Green
    Write-Host ""

    # Extract key metrics
    if ($sessionState -match "Project Completion:\*\* (\d+)%") {
        Write-Host "Project Completion: $($matches[1])%" -ForegroundColor Cyan
    }
    if ($sessionState -match "Branch:\*\* ``([^``]+)``") {
        Write-Host "Branch: $($matches[1])" -ForegroundColor Cyan
    }
} else {
    Write-Host "✗ SESSION_STATE.md not found" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Reading NEXT_ACTIONS.md..." -ForegroundColor Yellow
if (Test-Path "NEXT_ACTIONS.md") {
    $nextActions = Get-Content "NEXT_ACTIONS.md" -Raw
    Write-Host "✓ Next actions loaded" -ForegroundColor Green
    Write-Host ""

    # Show immediate actions
    Write-Host "=== IMMEDIATE ACTIONS ===" -ForegroundColor Magenta
    Write-Host ""
    Write-Host "Step 1: Deploy Edge Functions (MANUAL)" -ForegroundColor Yellow
    Write-Host "  → get-user-by-phone (new)" -ForegroundColor White
    Write-Host "  → create-booking-manual (new)" -ForegroundColor White
    Write-Host "  → twilio-voice (updated)" -ForegroundColor White
    Write-Host ""
    Write-Host "Instructions:" -ForegroundColor Cyan
    Write-Host "  1. Go to Supabase Dashboard" -ForegroundColor White
    Write-Host "  2. Navigate to Edge Functions" -ForegroundColor White
    Write-Host "  3. Deploy each function listed above" -ForegroundColor White
    Write-Host "  4. Verify deployment success" -ForegroundColor White
} else {
    Write-Host "✗ NEXT_ACTIONS.md not found" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== Git Status ===" -ForegroundColor Cyan
git status --short

Write-Host ""
Write-Host "=== Ready to Resume Development ===" -ForegroundColor Green
Write-Host "Current branch: $(git branch --show-current)" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next: Execute manual deployment of edge functions" -ForegroundColor Yellow
