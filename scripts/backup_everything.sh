#!/bin/bash
# Complete System Backup - ALL Data
# Backs up: Business Config + Knowledge Base Sources

BACKUP_DIR="backups"
mkdir -p "$BACKUP_DIR/business_config" "$BACKUP_DIR/knowledge_base"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

echo "🔄 COMPLETE SYSTEM BACKUP"
echo "========================="
echo ""

# 1. Backup Business Config (Services, Settings, etc.)
echo "📊 Backing up Business Configuration..."
BUSINESS_FILE="$BACKUP_DIR/business_config/full_backup_$TIMESTAMP.json"
curl -s -X GET \
  "https://hixuvycqekjxbplddykt.supabase.co/rest/v1/business_config?select=*" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpeHV2eWNxZWtqeGJwbGRkeWt0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjg0NzQwMywiZXhwIjoyMDc4NDIzNDAzfQ.S-UnAbcHuFmkUPo1f78y0_KlhyOVqxmbWFKIWVjHkcs" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpeHV2eWNxZWtqeGJwbGRkeWt0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjg0NzQwMywiZXhwIjoyMDc4NDIzNDAzfQ.S-UnAbcHuFmkUPo1f78y0_KlhyOVqxmbWFKIWVjHkcs" \
  > "$BUSINESS_FILE"

if [ -f "$BUSINESS_FILE" ]; then
  BSIZE=$(wc -c < "$BUSINESS_FILE")
  SERVICE_COUNT=$(grep -o '"name":' "$BUSINESS_FILE" | wc -l)
  echo "   ✅ Business Config ($BSIZE bytes)"
  echo "   📦 Services: $SERVICE_COUNT"
fi

# 2. Backup Knowledge Base
echo ""
echo "📚 Backing up Knowledge Base Sources..."
KB_FILE="$BACKUP_DIR/knowledge_base/kb_backup_$TIMESTAMP.json"
curl -s -X GET \
  "https://hixuvycqekjxbplddykt.supabase.co/rest/v1/knowledge_sources?select=*" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpeHV2eWNxZWtqeGJwbGRkeWt0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjg0NzQwMywiZXhwIjoyMDc4NDIzNDAzfQ.S-UnAbcHuFmkUPo1f78y0_KlhyOVqxmbWFKIWVjHkcs" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpeHV2eWNxZWtqeGJwbGRkeWt0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjg0NzQwMywiZXhwIjoyMDc4NDIzNDAzfQ.S-UnAbcHuFmkUPo1f78y0_KlhyOVqxmbWFKIWVjHkcs" \
  > "$KB_FILE"

if [ -f "$KB_FILE" ]; then
  KBSIZE=$(wc -c < "$KB_FILE")
  KB_COUNT=$(grep -o '"id":' "$KB_FILE" | wc -l)
  echo "   ✅ Knowledge Base ($KBSIZE bytes)"
  echo "   📚 Sources: $KB_COUNT"
fi

echo ""
echo "========================="
echo "✅ BACKUP COMPLETE!"
echo ""
echo "📁 Backup Files:"
echo "   - $BUSINESS_FILE"
echo "   - $KB_FILE"
echo ""
echo "🛡️  Your data is safe!"

# Cleanup old backups (keep last 10)
ls -t "$BACKUP_DIR"/business_config/full_backup_*.json 2>/dev/null | tail -n +11 | xargs -r rm
ls -t "$BACKUP_DIR"/knowledge_base/kb_backup_*.json 2>/dev/null | tail -n +11 | xargs -r rm
