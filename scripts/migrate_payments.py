import psycopg2
import sys

# Connection string via Session Pooler
conn_str = 'postgresql://postgres.hixuvycqekjxbplddykt:SisI2009@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres'

print('Payments Table Migration')
print('=' * 60)

try:
    print('Connecting to Supabase via Session Pooler...')
    conn = psycopg2.connect(conn_str)
    cur = conn.cursor()
    print('Connected successfully\n')

    print('Reading migration file...')
    with open('supabase/migrations/20251117064519_payments_table.sql', 'r', encoding='utf-8') as f:
        sql = f.read()
    print('Migration file loaded\n')

    print('Executing migration...\n')
    cur.execute(sql)
    conn.commit()
    print('Migration executed successfully!\n')

    # Verify table creation
    print('Verifying migration...')
    cur.execute("""
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'payments'
    """)

    if cur.fetchone():
        print('✓ payments table created')
    else:
        print('✗ payments table not found')

    # Check columns
    cur.execute("""
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'payments'
        ORDER BY ordinal_position
    """)

    columns = cur.fetchall()
    print(f'✓ Payments table has {len(columns)} columns:')
    for col in columns[:10]:  # Show first 10
        print(f'   - {col[0]}')
    if len(columns) > 10:
        print(f'   ... and {len(columns) - 10} more')

    # Check indexes
    cur.execute("""
        SELECT indexname
        FROM pg_indexes
        WHERE tablename = 'payments'
    """)

    indexes = cur.fetchall()
    print(f'\n✓ Created {len(indexes)} indexes:')
    for idx in indexes:
        print(f'   - {idx[0]}')

    # Check RLS policies
    cur.execute("""
        SELECT policyname
        FROM pg_policies
        WHERE tablename = 'payments'
    """)

    policies = cur.fetchall()
    print(f'\n✓ Created {len(policies)} RLS policies:')
    for pol in policies:
        print(f'   - {pol[0]}')

    print('\n' + '=' * 60)
    print('Migration completed successfully!')
    print('=' * 60)
    print('\nNext steps:')
    print('1. Add Stripe keys in Settings -> Integrations')
    print('2. Add STRIPE_WEBHOOK_SECRET to .env.local')
    print('3. Test payment with card: 4242 4242 4242 4242\n')

    cur.close()
    conn.close()

except psycopg2.errors.DuplicateTable as e:
    print(f'\nTable already exists: {e}')
    print('Migration may have run previously. Skipping...')
    sys.exit(0)
except Exception as e:
    print(f'\nMigration failed: {e}')
    if 'already exists' in str(e):
        print('Table already exists. Migration may have run previously.')
        sys.exit(0)
    sys.exit(1)
