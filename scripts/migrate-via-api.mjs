import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUPABASE_URL = 'https://hixuvycqekjxbplddykt.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpeHV2eWNxZWtqeGJwbGRkeWt0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjg0NzQwMywiZXhwIjoyMDc4NDIzNDAzfQ.S-UnAbcHuFmkUPo1f78y0_KlhyOVqxmbWFKIWVjHkcs';

console.log('Database Migration via HTTP');
console.log('='.repeat(60));

const migrationPath = join(__dirname, '../supabase/migrations/20250114_knowledge_base.sql');
const sql = readFileSync(migrationPath, 'utf-8');

console.log('Migration file loaded');
console.log('Attempting to execute via Supabase Management API...\n');

// Execute using PostgREST admin
async function executeMigration() {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({ query: sql })
    });

    console.log('Response status:', response.status);
    const text = await response.text();
    console.log('Response:', text.substring(0, 500));

  } catch (error) {
    console.error('Error:', error.message);
  }

  console.log('\nNote: Direct SQL execution via API may not be available.');
  console.log('Please use Supabase Dashboard SQL Editor instead:');
  console.log('\n1. Visit: https://hixuvycqekjxbplddykt.supabase.co');
  console.log('2. Go to SQL Editor');
  console.log('3. Paste and run migration from:');
  console.log('   supabase/migrations/20250114_knowledge_base.sql');
}

executeMigration();
