#!/usr/bin/env python3
"""Check current AI configuration in database"""

import psycopg2
import psycopg2.extras

CONNECTION_STRING = "postgresql://postgres.hixuvycqekjxbplddykt:SisI2009@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres"

def main():
    print("=" * 80)
    print("AI CONFIGURATION STATUS CHECK")
    print("=" * 80)

    conn = psycopg2.connect(CONNECTION_STRING)

    with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
        # Get all AI-related columns from business_config
        cur.execute("""
            SELECT
                business_name,
                ai_model_provider,
                ai_model_name,
                ai_voice_agent_provider,
                ai_summarization_provider,
                ai_analytics_provider,
                ai_transcription_provider,
                openai_api_key IS NOT NULL as has_openai_key,
                gemini_api_key IS NOT NULL as has_gemini_key,
                openrouter_api_key IS NOT NULL as has_openrouter_key,
                LENGTH(openai_api_key) as openai_key_length,
                LENGTH(gemini_api_key) as gemini_key_length,
                LENGTH(openrouter_api_key) as openrouter_key_length
            FROM business_config
            LIMIT 1;
        """)

        row = cur.fetchone()

        if row:
            print("\n[OK] Business Config Found")
            print(f"\nBusiness: {row['business_name']}\n")

            print("AI Provider Configuration:")
            print(f"  Default Provider: {row['ai_model_provider'] or 'NOT SET'}")
            print(f"  Default Model: {row['ai_model_name'] or 'NOT SET'}")

            print("\nFeature-Specific Providers:")
            print(f"  Voice Agent:      {row['ai_voice_agent_provider'] or 'NOT SET'}")
            print(f"  Summarization:    {row['ai_summarization_provider'] or 'NOT SET'}")
            print(f"  Analytics:        {row['ai_analytics_provider'] or 'NOT SET'}")
            print(f"  Transcription:    {row['ai_transcription_provider'] or 'NOT SET'}")

            print("\nAPI Keys Status:")
            print(f"  OpenAI:      {'SET (' + str(row['openai_key_length']) + ' chars)' if row['has_openai_key'] else 'NOT SET'}")
            print(f"  Gemini:      {'SET (' + str(row['gemini_key_length']) + ' chars)' if row['has_gemini_key'] else 'NOT SET'}")
            print(f"  OpenRouter:  {'SET (' + str(row['openrouter_key_length']) + ' chars)' if row['has_openrouter_key'] else 'NOT SET'}")

            # Recommendations
            print("\n" + "=" * 80)
            print("RECOMMENDATIONS:")
            print("=" * 80)

            if not row['has_openai_key'] and not row['has_gemini_key'] and not row['has_openrouter_key']:
                print("[ERROR] No API keys configured!")
                print("  Action: Go to Settings → Integrations → AI Models and add at least one API key")

            if not row['ai_summarization_provider']:
                print("[WARN] No provider assigned to Summarization")
                print("  Action: Configure which AI to use for Knowledge Base in Integrations")

            if row['ai_summarization_provider'] == 'openai' and not row['has_openai_key']:
                print("[ERROR] Summarization set to OpenAI but no OpenAI key!")
                print("  Action: Add OpenAI key or change summarization provider")

            if row['ai_summarization_provider'] == 'gemini' and not row['has_gemini_key']:
                print("[ERROR] Summarization set to Gemini but no Gemini key!")
                print("  Action: Add Gemini key or change summarization provider")

            if row['ai_summarization_provider'] == 'openrouter' and not row['has_openrouter_key']:
                print("[ERROR] Summarization set to OpenRouter but no OpenRouter key!")
                print("  Action: Add OpenRouter key or change summarization provider")

            # Success case
            if row['ai_summarization_provider'] and (
                (row['ai_summarization_provider'] == 'openai' and row['has_openai_key']) or
                (row['ai_summarization_provider'] == 'gemini' and row['has_gemini_key']) or
                (row['ai_summarization_provider'] == 'openrouter' and row['has_openrouter_key'])
            ):
                print(f"[OK] Summarization configured correctly!")
                print(f"  Provider: {row['ai_summarization_provider'].upper()}")
                print(f"  API Key: SET")
                print(f"  Status: READY TO USE")

        else:
            print("[ERROR] No business_config row found!")

    conn.close()
    print("\n" + "=" * 80)

if __name__ == "__main__":
    main()
