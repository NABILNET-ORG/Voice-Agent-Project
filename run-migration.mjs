// Migration script to run SQL directly
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = 'https://hixuvycqekjxbplddykt.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpeHV2eWNxZWtqeGJwbGRkeWt0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjg0NzQwMywiZXhwIjoyMDc4NDIzNDAzfQ.S-UnAbcHuFmkUPo1f78y0_KlhyOVqxmbWFKIWVjHkcs';

const supabase = createClient(supabaseUrl, serviceKey);

async function runMigration() {
  console.log('🚀 Running database migration...');

  try {
    // Read the SQL file
    const sql = readFileSync('./supabase/migrations/20250111_initial_schema.sql', 'utf-8');

    // Split into individual statements (rough split by semicolons)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';

      // Skip comments
      if (statement.trim().startsWith('--')) continue;

      console.log(`\nExecuting statement ${i + 1}/${statements.length}...`);
      console.log(statement.substring(0, 100) + (statement.length > 100 ? '...' : ''));

      try {
        const { data, error } = await supabase.rpc('exec', { sql: statement });

        if (error) {
          console.error('❌ Error:', error.message);
          // Continue with next statement
        } else {
          console.log('✅ Success');
        }
      } catch (err) {
        console.error('❌ Exception:', err.message);
      }
    }

    console.log('\n✅ Migration completed!');
    console.log('\nVerifying tables...');

    // Verify tables exist
    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .in('table_name', ['profiles', 'business_config', 'bookings', 'call_logs']);

    if (error) {
      console.error('Error verifying tables:', error);
    } else {
      console.log('Tables found:', tables);
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
