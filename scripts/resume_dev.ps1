# Resume Development Script
# Displays session state and next actions

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Voice Agent Project - Resume Development  " -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Show Session State
if (Test-Path "SESSION_STATE.md") {
    Write-Host "SESSION STATE:" -ForegroundColor Green
    Get-Content "SESSION_STATE.md" | Select-Object -First 30
    Write-Host ""
}

# Show Next Actions
if (Test-Path "NEXT_ACTIONS.md") {
    Write-Host "NEXT ACTIONS:" -ForegroundColor Yellow
    Get-Content "NEXT_ACTIONS.md" | Select-Object -First 30
    Write-Host ""
}

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Ready to continue development!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
