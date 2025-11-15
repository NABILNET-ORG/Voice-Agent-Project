import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';

config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing environment variables');
  process.exit(1);
}

console.log('Supabase Migration Runner');
console.log('URL:', SUPABASE_URL);

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const migrationPath = join(__dirname, '../supabase/migrations/20250114_knowledge_base.sql');
const sql = readFileSync(migrationPath, 'utf-8');

console.log('Loaded migration file');
console.log('Executing migration via Supabase Dashboard SQL Editor...');
console.log('');
console.log('INSTRUCTIONS:');
console.log('1. Open Supabase Dashboard: https://hixuvycqekjxbplddykt.supabase.co');
console.log('2. Go to SQL Editor');
console.log('3. Paste and run the SQL below:');
console.log('');
console.log('='.repeat(60));
console.log(sql);
console.log('='.repeat(60));
console.log('');

async function verifyMigration() {
  console.log('Attempting to verify migration...');

  const { data, error } = await supabase
    .from('knowledge_sources')
    .select('id')
    .limit(1);

  if (error) {
    if (error.code === '42P01') {
      console.log('Table does not exist yet - please run the SQL in Supabase Dashboard');
      console.log('');
      console.log('OR copy the migration file content and run it there manually');
    } else {
      console.log('Note:', error.message);
    }
  } else {
    console.log('SUCCESS: knowledge_sources table exists and is accessible');
  }

  const { data: configData, error: configError } = await supabase
    .from('business_config')
    .select('ai_model_provider, ai_model_name')
    .limit(1);

  if (!configError) {
    console.log('SUCCESS: ai_model columns added to business_config');
  }
}

verifyMigration();
