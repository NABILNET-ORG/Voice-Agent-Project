#!/bin/bash
# Automatic Business Config Backup Script

BACKUP_DIR="backups/business_config"
mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/config_backup_$TIMESTAMP.json"

echo "🔄 Backing up business configuration..."

curl -s -X GET \
  "https://hixuvycqekjxbplddykt.supabase.co/rest/v1/business_config?select=*" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpeHV2eWNxZWtqeGJwbGRkeWt0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjg0NzQwMywiZXhwIjoyMDc4NDIzNDAzfQ.S-UnAbcHuFmkUPo1f78y0_KlhyOVqxmbWFKIWVjHkcs" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpeHV2eWNxZWtqeGJwbGRkeWt0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjg0NzQwMywiZXhwIjoyMDc4NDIzNDAzfQ.S-UnAbcHuFmkUPo1f78y0_KlhyOVqxmbWFKIWVjHkcs" \
  > "$BACKUP_FILE"

if [ -f "$BACKUP_FILE" ]; then
  SIZE=$(wc -c < "$BACKUP_FILE")
  if [ "$SIZE" -gt 100 ]; then
    echo "✅ Backup saved: $BACKUP_FILE ($SIZE bytes)"
    
    # Count services
    SERVICE_COUNT=$(grep -o '"id"' "$BACKUP_FILE" | wc -l)
    echo "📊 Services backed up: $SERVICE_COUNT"
    
    # Keep only last 10 backups
    ls -t "$BACKUP_DIR"/config_backup_*.json | tail -n +11 | xargs -r rm
    echo "🧹 Cleaned old backups (keeping last 10)"
  else
    echo "⚠️  Backup file too small, might be empty"
  fi
else
  echo "❌ Backup failed"
fi
