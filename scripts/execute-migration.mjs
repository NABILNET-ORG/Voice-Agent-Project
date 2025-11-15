import pkg from 'pg';
const { Client } = pkg;
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const connectionString = 'postgresql://postgres:SisI2009@db.hixuvycqekjxbplddykt.supabase.co:5432/postgres';

console.log('🔧 Database Migration Script');
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

    const migrationPath = join(__dirname, '../supabase/migrations/20250114_knowledge_base.sql');
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
      AND table_name = 'knowledge_sources'
    `);
    
    if (tableCheck.rows.length > 0) {
      console.log('✅ knowledge_sources table created');
    } else {
      console.log('❌ knowledge_sources table not found');
    }

    const columnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'business_config' 
      AND column_name IN ('ai_model_provider', 'ai_model_name', 'gemini_api_key', 'openrouter_api_key')
    `);
    
    console.log(`✅ Added ${columnCheck.rows.length} AI model columns to business_config`);
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Migration completed successfully!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    if (error.detail) console.error('Details:', error.detail);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
