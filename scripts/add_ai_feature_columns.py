#!/usr/bin/env python3
"""Add feature-specific AI provider columns to business_config"""

import psycopg2

CONNECTION_STRING = "postgresql://postgres.hixuvycqekjxbplddykt:SisI2009@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres"

GREEN = '\033[92m'
CYAN = '\033[96m'
RESET = '\033[0m'
BOLD = '\033[1m'

def main():
    print(f"\n{CYAN}{BOLD}{'=' * 80}{RESET}")
    print(f"{CYAN}{BOLD}{'ADD FEATURE-SPECIFIC AI PROVIDER COLUMNS'.center(80)}{RESET}")
    print(f"{CYAN}{BOLD}{'=' * 80}{RESET}\n")

    conn = psycopg2.connect(CONNECTION_STRING)

    try:
        with conn.cursor() as cur:
            print("[INFO] Adding feature-specific AI provider columns...")

            # Add columns for each feature
            columns_to_add = [
                ("ai_voice_agent_provider", "Voice Agent provider"),
                ("ai_summarization_provider", "Knowledge Base Summarization provider"),
                ("ai_analytics_provider", "Analytics Insights provider"),
                ("ai_transcription_provider", "Call Transcription provider")
            ]

            for column_name, description in columns_to_add:
                print(f"[INFO] Adding column: {column_name}")
                cur.execute(f"""
                    ALTER TABLE business_config
                    ADD COLUMN IF NOT EXISTS {column_name} TEXT
                    CHECK ({column_name} IN ('openai', 'gemini', 'openrouter'));
                """)
                print(f"[OK] {column_name} added")

            conn.commit()
            print(f"\n{GREEN}[OK] All columns added successfully!{RESET}")

            # Verify columns
            print("\n[INFO] Verifying columns...")
            cur.execute("""
                SELECT column_name
                FROM information_schema.columns
                WHERE table_name = 'business_config'
                AND column_name LIKE 'ai_%_provider'
                ORDER BY column_name;
            """)

            columns = cur.fetchall()
            print(f"\n{CYAN}AI Provider Columns in business_config:{RESET}")
            for col in columns:
                print(f"  - {col[0]}")

            print(f"\n{GREEN}{BOLD}>>> Migration Status: SUCCESS{RESET}\n")
            print(f"{CYAN}Next steps:{RESET}")
            print("  1. Restart dev server: npm run dev")
            print("  2. Go to Settings → Integrations → AI Models tab")
            print("  3. Configure each AI provider and select which features to use")
            print()

    except Exception as e:
        conn.rollback()
        print(f"[ERROR] {e}")
        return False
    finally:
        conn.close()

if __name__ == "__main__":
    main()
