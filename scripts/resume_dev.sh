#!/bin/bash
# Resume Development Script
# Universal AI Booking System
# Created: 2025-11-11

echo -e "\033[1;36m=== Resume Development Session ===\033[0m"
echo ""

# Display current session state
echo -e "\033[1;33mReading SESSION_STATE.md...\033[0m"
if [ -f "SESSION_STATE.md" ]; then
    echo -e "\033[1;32m✓ Session state loaded\033[0m"
    echo ""

    # Extract key metrics
    completion=$(grep "Project Completion:" SESSION_STATE.md | sed 's/.*: //')
    branch=$(grep "Branch:" SESSION_STATE.md | grep -o '`[^`]*`' | tr -d '`')

    echo -e "\033[1;36mProject Completion: $completion\033[0m"
    echo -e "\033[1;36mBranch: $branch\033[0m"
else
    echo -e "\033[1;31m✗ SESSION_STATE.md not found\033[0m"
    exit 1
fi

echo ""
echo -e "\033[1;33mReading NEXT_ACTIONS.md...\033[0m"
if [ -f "NEXT_ACTIONS.md" ]; then
    echo -e "\033[1;32m✓ Next actions loaded\033[0m"
    echo ""

    # Show immediate actions
    echo -e "\033[1;35m=== IMMEDIATE ACTIONS ===\033[0m"
    echo ""
    echo -e "\033[1;33mStep 1: Deploy Edge Functions (MANUAL)\033[0m"
    echo -e "  → get-user-by-phone (new)"
    echo -e "  → create-booking-manual (new)"
    echo -e "  → twilio-voice (updated)"
    echo ""
    echo -e "\033[1;36mInstructions:\033[0m"
    echo -e "  1. Go to Supabase Dashboard"
    echo -e "  2. Navigate to Edge Functions"
    echo -e "  3. Deploy each function listed above"
    echo -e "  4. Verify deployment success"
else
    echo -e "\033[1;31m✗ NEXT_ACTIONS.md not found\033[0m"
    exit 1
fi

echo ""
echo -e "\033[1;36m=== Git Status ===\033[0m"
git status --short

echo ""
echo -e "\033[1;32m=== Ready to Resume Development ===\033[0m"
echo -e "\033[1;36mCurrent branch: $(git branch --show-current)\033[0m"
echo ""
echo -e "\033[1;33mNext: Execute manual deployment of edge functions\033[0m"
