import pkg from 'pg';
const { Client } = pkg;
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const connectionString = 'postgresql://postgres:SisI2009@db.hixuvycqekjxbplddykt.supabase.co:5432/postgres';

console.log('🔧 Payments Table Migration');
console.log('='.repeat(60));

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  try {
    console.log('📡 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully\n');

    const migrationPath = join(__dirname, '../supabase/migrations/20251117064519_payments_table.sql');
    console.log('📄 Reading migration file:', migrationPath);
    const sql = readFileSync(migrationPath, 'utf-8');
    console.log('✅ Migration file loaded\n');

    console.log('🚀 Executing migration...\n');
    await client.query(sql);

    console.log('✅ Migration executed successfully!\n');

    // Verify tables
    console.log('🔍 Verifying migration...');

    const tableCheck = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'payments'
    `);

    if (tableCheck.rows.length > 0) {
      console.log('✅ payments table created');
    } else {
      console.log('❌ payments table not found');
    }

    const columnCheck = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'payments'
      ORDER BY ordinal_position
    `);

    console.log(`✅ Payments table has ${columnCheck.rows.length} columns:`);
    columnCheck.rows.forEach(row => {
      console.log(`   - ${row.column_name}`);
    });

    const indexCheck = await client.query(`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'payments'
    `);

    console.log(`\n✅ Created ${indexCheck.rows.length} indexes:`);
    indexCheck.rows.forEach(row => {
      console.log(`   - ${row.indexname}`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('✅ Migration completed successfully!');
    console.log('='.repeat(60));
    console.log('\n📊 Next steps:');
    console.log('1. Configure Stripe keys in .env.local');
    console.log('2. Test payment flow with test card: 4242 4242 4242 4242');
    console.log('3. Set up Stripe webhook in Dashboard');
    console.log('\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    if (error.detail) console.error('Details:', error.detail);
    if (error.code === '42P07') {
      console.log('\n⚠️  Table already exists. Migration may have run previously.');
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
