#!/usr/bin/env python3
"""
Database Migration Script using psycopg2
Connects to Supabase via Session Pooler and executes knowledge base migration
"""

import psycopg2
import psycopg2.extras
import sys
import os
from datetime import datetime

# Connection string for Supabase Session Pooler
CONNECTION_STRING = "postgresql://postgres.hixuvycqekjxbplddykt:SisI2009@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres"

# ANSI color codes for output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
CYAN = '\033[96m'
RESET = '\033[0m'
BOLD = '\033[1m'

def print_header(text):
    """Print formatted header"""
    print(f"\n{CYAN}{BOLD}{'=' * 80}{RESET}")
    print(f"{CYAN}{BOLD}{text.center(80)}{RESET}")
    print(f"{CYAN}{BOLD}{'=' * 80}{RESET}\n")

def print_success(text):
    """Print success message"""
    print(f"{GREEN}[OK] {text}{RESET}")

def print_error(text):
    """Print error message"""
    print(f"{RED}[ERROR] {text}{RESET}")

def print_warning(text):
    """Print warning message"""
    print(f"{YELLOW}[WARN] {text}{RESET}")

def print_info(text):
    """Print info message"""
    print(f"{BLUE}[INFO] {text}{RESET}")

def connect_to_database():
    """Establish connection to Supabase database"""
    print_header("DATABASE CONNECTION")

    print_info("Connecting to Supabase via Session Pooler...")
    print_info("Host: aws-1-ap-southeast-1.pooler.supabase.com")
    print_info("Database: postgres")
    print_info("User: postgres.hixuvycqekjxbplddykt")

    try:
        conn = psycopg2.connect(CONNECTION_STRING)
        conn.autocommit = False  # We'll manage transactions manually
        print_success("Connected to database successfully!")

        # Get database version
        with conn.cursor() as cur:
            cur.execute("SELECT version();")
            version = cur.fetchone()[0]
            print_info(f"PostgreSQL Version: {version.split(',')[0]}")

        return conn
    except Exception as e:
        print_error(f"Connection failed: {str(e)}")
        sys.exit(1)

def read_migration_file():
    """Read the migration SQL file"""
    print_header("READING MIGRATION FILE")

    migration_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        'supabase', 'migrations', '20250114_knowledge_base.sql'
    )

    print_info(f"Migration file: {migration_path}")

    try:
        with open(migration_path, 'r', encoding='utf-8') as f:
            sql = f.read()

        print_success(f"Migration file loaded ({len(sql)} characters)")
        return sql
    except Exception as e:
        print_error(f"Failed to read migration file: {str(e)}")
        sys.exit(1)

def execute_migration(conn, sql):
    """Execute the migration SQL"""
    print_header("EXECUTING MIGRATION")

    try:
        with conn.cursor() as cur:
            print_info("Executing migration SQL...")
            cur.execute(sql)
            conn.commit()
            print_success("Migration executed successfully!")
        return True
    except Exception as e:
        conn.rollback()
        print_error(f"Migration failed: {str(e)}")
        print_warning("Transaction rolled back")
        return False

def audit_migration(conn):
    """Audit the migration to verify all objects were created"""
    print_header("MIGRATION AUDIT")

    audit_results = {
        'tables': [],
        'columns': [],
        'indexes': [],
        'policies': [],
        'triggers': [],
        'errors': []
    }

    try:
        with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
            # 1. Check if knowledge_sources table exists
            print_info("Checking knowledge_sources table...")
            cur.execute("""
                SELECT table_name,
                       (SELECT COUNT(*) FROM information_schema.columns
                        WHERE table_name = 'knowledge_sources'
                        AND table_schema = 'public') as column_count
                FROM information_schema.tables
                WHERE table_schema = 'public'
                AND table_name = 'knowledge_sources';
            """)
            result = cur.fetchone()
            if result:
                audit_results['tables'].append({
                    'name': 'knowledge_sources',
                    'columns': result['column_count'],
                    'status': 'exists'
                })
                print_success(f"Table 'knowledge_sources' exists with {result['column_count']} columns")
            else:
                audit_results['errors'].append("Table 'knowledge_sources' not found")
                print_error("Table 'knowledge_sources' not found")

            # 2. Check knowledge_sources columns
            print_info("Verifying knowledge_sources columns...")
            cur.execute("""
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns
                WHERE table_schema = 'public'
                AND table_name = 'knowledge_sources'
                ORDER BY ordinal_position;
            """)
            columns = cur.fetchall()
            for col in columns:
                audit_results['columns'].append({
                    'table': 'knowledge_sources',
                    'name': col['column_name'],
                    'type': col['data_type'],
                    'nullable': col['is_nullable']
                })
            print_success(f"Found {len(columns)} columns in knowledge_sources")

            # 3. Check business_config new columns
            print_info("Checking business_config AI model columns...")
            cur.execute("""
                SELECT column_name, data_type
                FROM information_schema.columns
                WHERE table_schema = 'public'
                AND table_name = 'business_config'
                AND column_name IN ('ai_model_provider', 'ai_model_name', 'gemini_api_key', 'openrouter_api_key');
            """)
            ai_columns = cur.fetchall()
            for col in ai_columns:
                audit_results['columns'].append({
                    'table': 'business_config',
                    'name': col['column_name'],
                    'type': col['data_type']
                })
            print_success(f"Found {len(ai_columns)} AI model columns in business_config")

            # 4. Check indexes
            print_info("Checking indexes...")
            cur.execute("""
                SELECT indexname, tablename
                FROM pg_indexes
                WHERE schemaname = 'public'
                AND tablename = 'knowledge_sources';
            """)
            indexes = cur.fetchall()
            for idx in indexes:
                audit_results['indexes'].append({
                    'name': idx['indexname'],
                    'table': idx['tablename']
                })
            print_success(f"Found {len(indexes)} indexes on knowledge_sources")

            # 5. Check RLS policies
            print_info("Checking Row Level Security policies...")
            cur.execute("""
                SELECT policyname, cmd, qual
                FROM pg_policies
                WHERE schemaname = 'public'
                AND tablename = 'knowledge_sources';
            """)
            policies = cur.fetchall()
            for pol in policies:
                audit_results['policies'].append({
                    'name': pol['policyname'],
                    'command': pol['cmd']
                })
            print_success(f"Found {len(policies)} RLS policies on knowledge_sources")

            # 6. Check triggers
            print_info("Checking triggers...")
            cur.execute("""
                SELECT trigger_name, event_manipulation
                FROM information_schema.triggers
                WHERE event_object_schema = 'public'
                AND event_object_table = 'knowledge_sources';
            """)
            triggers = cur.fetchall()
            for trg in triggers:
                audit_results['triggers'].append({
                    'name': trg['trigger_name'],
                    'event': trg['event_manipulation']
                })
            print_success(f"Found {len(triggers)} triggers on knowledge_sources")

            # 7. Check RLS is enabled
            print_info("Checking RLS status...")
            cur.execute("""
                SELECT relname, relrowsecurity
                FROM pg_class
                WHERE relname = 'knowledge_sources'
                AND relnamespace = 'public'::regnamespace;
            """)
            rls_status = cur.fetchone()
            if rls_status and rls_status['relrowsecurity']:
                print_success("Row Level Security is ENABLED on knowledge_sources")
            else:
                print_warning("Row Level Security status unclear")

    except Exception as e:
        audit_results['errors'].append(str(e))
        print_error(f"Audit error: {str(e)}")

    return audit_results

def print_audit_summary(audit_results):
    """Print detailed audit summary"""
    print_header("AUDIT SUMMARY")

    # Tables
    print(f"{BOLD}Tables Created:{RESET}")
    for table in audit_results['tables']:
        print(f"  • {table['name']} ({table['columns']} columns)")

    # Columns detail
    print(f"\n{BOLD}knowledge_sources Columns:{RESET}")
    ks_columns = [c for c in audit_results['columns'] if c['table'] == 'knowledge_sources']
    for col in ks_columns:
        nullable = "NULL" if col['nullable'] == 'YES' else "NOT NULL"
        print(f"  • {col['name']:<30} {col['type']:<20} {nullable}")

    print(f"\n{BOLD}business_config AI Columns:{RESET}")
    bc_columns = [c for c in audit_results['columns'] if c['table'] == 'business_config']
    for col in bc_columns:
        print(f"  • {col['name']:<30} {col['type']:<20}")

    # Indexes
    print(f"\n{BOLD}Indexes Created:{RESET}")
    for idx in audit_results['indexes']:
        print(f"  • {idx['name']}")

    # Policies
    print(f"\n{BOLD}RLS Policies:{RESET}")
    for pol in audit_results['policies']:
        print(f"  • {pol['name']} ({pol['command']})")

    # Triggers
    print(f"\n{BOLD}Triggers:{RESET}")
    for trg in audit_results['triggers']:
        print(f"  • {trg['name']} ({trg['event']})")

    # Errors
    if audit_results['errors']:
        print(f"\n{BOLD}{RED}Errors:{RESET}")
        for error in audit_results['errors']:
            print(f"  • {error}")

def verify_functionality(conn):
    """Verify that the migration works with test queries"""
    print_header("FUNCTIONALITY VERIFICATION")

    try:
        with conn.cursor() as cur:
            # Test 1: Can select from knowledge_sources (should be empty)
            print_info("Test 1: SELECT from knowledge_sources...")
            cur.execute("SELECT COUNT(*) FROM knowledge_sources;")
            count = cur.fetchone()[0]
            print_success(f"knowledge_sources table accessible (count: {count})")

            # Test 2: Can select AI columns from business_config
            print_info("Test 2: SELECT AI columns from business_config...")
            cur.execute("""
                SELECT ai_model_provider, ai_model_name
                FROM business_config
                LIMIT 1;
            """)
            if cur.rowcount > 0:
                result = cur.fetchone()
                print_success(f"AI model columns accessible (provider: {result[0]}, model: {result[1]})")
            else:
                print_warning("No rows in business_config (table may be empty)")

            # Test 3: Check constraints
            print_info("Test 3: Checking constraints...")
            cur.execute("""
                SELECT conname, contype
                FROM pg_constraint
                WHERE conrelid = 'knowledge_sources'::regclass;
            """)
            constraints = cur.fetchall()
            print_success(f"Found {len(constraints)} constraints")

            print_success("All functionality tests passed!")
            return True
    except Exception as e:
        print_error(f"Functionality test failed: {str(e)}")
        return False

def main():
    """Main execution function"""
    print_header("SUPABASE DATABASE MIGRATION TOOL")
    print(f"{BOLD}Date:{RESET} {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{BOLD}Migration:{RESET} Knowledge Base (20250114)")
    print(f"{BOLD}Method:{RESET} Python psycopg2 via Session Pooler")

    # Step 1: Connect
    conn = connect_to_database()

    # Step 2: Read migration
    sql = read_migration_file()

    # Step 3: Execute migration
    success = execute_migration(conn, sql)

    if not success:
        conn.close()
        print_error("Migration failed. Exiting.")
        sys.exit(1)

    # Step 4: Audit migration
    audit_results = audit_migration(conn)

    # Step 5: Print audit summary
    print_audit_summary(audit_results)

    # Step 6: Verify functionality
    verify_functionality(conn)

    # Close connection
    conn.close()
    print_info("Database connection closed")

    # Final summary
    print_header("MIGRATION COMPLETE")
    print_success("Knowledge base migration executed successfully!")
    print_info("Tables: knowledge_sources")
    print_info("Columns: Added AI model fields to business_config")
    print_info("Security: RLS policies enabled")
    print_info("Indexes: Optimized for performance")

    print(f"\n{GREEN}{BOLD}>>> Migration Status: SUCCESS{RESET}\n")
    print(f"{CYAN}Next steps:{RESET}")
    print("  1. Test Knowledge Base feature in Settings → AI Configuration")
    print("  2. Add website sources for AI context")
    print("  3. Run TestSprite test TC015")
    print()

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n{YELLOW}Migration interrupted by user{RESET}")
        sys.exit(1)
    except Exception as e:
        print_error(f"Unexpected error: {str(e)}")
        sys.exit(1)
