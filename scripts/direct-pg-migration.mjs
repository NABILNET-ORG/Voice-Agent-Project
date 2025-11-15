import pkg from 'pg';
const { Client } = pkg;
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Direct PostgreSQL Migration');
console.log('='.repeat(60));

// Try multiple connection approaches
const configs = [
  {
    name: 'Connection String with SSL',
    config: {
      connectionString: 'postgresql://postgres:SisI2009@db.hixuvycqekjxbplddykt.supabase.co:5432/postgres',
      ssl: { rejectUnauthorized: false }
    }
  },
  {
    name: 'Direct Config with SSL',
    config: {
      host: 'db.hixuvycqekjxbplddykt.supabase.co',
      port: 5432,
      database: 'postgres',
      user: 'postgres',
      password: 'SisI2009',
      ssl: { rejectUnauthorized: false }
    }
  },
  {
    name: 'IPv4 Pooler',
    config: {
      host: 'aws-0-us-west-1.pooler.supabase.com',
      port: 5432,
      database: 'postgres',
      user: 'postgres.hixuvycqekjxbplddykt',
      password: 'SisI2009',
      ssl: { rejectUnauthorized: false }
    }
  }
];

async function tryConnection(configObj) {
  const client = new Client(configObj.config);

  console.log(`\nTrying: ${configObj.name}...`);

  try {
    await client.connect();
    console.log('✅ Connected!');

    // Read and execute migration
    const migrationPath = join(__dirname, '../supabase/migrations/20250114_knowledge_base.sql');
    const sql = readFileSync(migrationPath, 'utf-8');

    console.log('Executing migration...');
    await client.query(sql);
    console.log('✅ Migration executed successfully!');

    // Verify
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'knowledge_sources'
    `);

    if (result.rows.length > 0) {
      console.log('✅ Verified: knowledge_sources table exists');
    }

    await client.end();
    return true;
  } catch (error) {
    console.log('❌ Failed:', error.message);
    try {
      await client.end();
    } catch (e) {
      // ignore
    }
    return false;
  }
}

async function runMigration() {
  for (const config of configs) {
    const success = await tryConnection(config);
    if (success) {
      console.log('\n' + '='.repeat(60));
      console.log('✅ Migration completed successfully!');
      console.log('='.repeat(60));
      process.exit(0);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('❌ All connection attempts failed');
  console.log('\nPlease run migration manually:');
  console.log('1. Visit: https://hixuvycqekjxbplddykt.supabase.co');
  console.log('2. Go to: SQL Editor');
  console.log('3. Paste contents from: supabase/migrations/20250114_knowledge_base.sql');
  console.log('4. Click Run');
  console.log('='.repeat(60));
  process.exit(1);
}

runMigration();
