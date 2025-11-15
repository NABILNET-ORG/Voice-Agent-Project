#!/bin/bash
# Comprehensive Business Data Backup Script
# Backs up: Business Config, Services, Business Info, Availability, AI Settings

BACKUP_DIR="backups/business_config"
mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/full_backup_$TIMESTAMP.json"

echo "🔄 Backing up ALL business data..."
echo "   - Business Information (name, type, contact, timezone)"
echo "   - Services (all services with prices, descriptions)"
echo "   - Availability & Scheduling policies"
echo "   - AI Integrations & Settings"
echo "   - Notification preferences"
echo ""

# Backup complete business_config table
curl -s -X GET \
  "https://hixuvycqekjxbplddykt.supabase.co/rest/v1/business_config?select=*" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpeHV2eWNxZWtqeGJwbGRkeWt0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjg0NzQwMywiZXhwIjoyMDc4NDIzNDAzfQ.S-UnAbcHuFmkUPo1f78y0_KlhyOVqxmbWFKIWVjHkcs" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpeHV2eWNxZWtqeGJwbGRkeWt0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjg0NzQwMywiZXhwIjoyMDc4NDIzNDAzfQ.S-UnAbcHuFmkUPo1f78y0_KlhyOVqxmbWFKIWVjHkcs" \
  > "$BACKUP_FILE"

if [ -f "$BACKUP_FILE" ]; then
  SIZE=$(wc -c < "$BACKUP_FILE")
  if [ "$SIZE" -gt 100 ]; then
    echo "✅ Full backup saved: $BACKUP_FILE"
    echo "   Size: $SIZE bytes"
    
    SERVICE_COUNT=$(grep -o '"name":' "$BACKUP_FILE" | wc -l)
    echo ""
    echo "📊 Backup Contents:"
    echo "   - Services: $SERVICE_COUNT"
    
    if grep -q '"business_name"' "$BACKUP_FILE"; then
      echo "   - ✅ Business Information"
    fi
    if grep -q '"business_timezone"' "$BACKUP_FILE"; then
      echo "   - ✅ Timezone & Regional Settings"
    fi
    if grep -q '"buffer_minutes"' "$BACKUP_FILE" || grep -q '"min_advance_hours"' "$BACKUP_FILE"; then
      echo "   - ✅ Availability & Scheduling"
    fi
    if grep -q '"gemini_api_key"' "$BACKUP_FILE" || grep -q '"openai_api_key"' "$BACKUP_FILE"; then
      echo "   - ✅ AI Integration Keys"
    fi
    if grep -q '"notification_' "$BACKUP_FILE"; then
      echo "   - ✅ Notification Settings"
    fi
    
    echo ""
    # Keep only last 10 backups
    ls -t "$BACKUP_DIR"/full_backup_*.json 2>/dev/null | tail -n +11 | xargs -r rm
    echo "🧹 Cleaned old backups (keeping last 10)"
    echo ""
    echo "✅ BACKUP COMPLETE - All your data is safe!"
  else
    echo "⚠️  Backup file too small"
  fi
else
  echo "❌ Backup failed"
fi
