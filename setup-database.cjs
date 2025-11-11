#!/usr/bin/env node

/**
 * Database Setup Script
 * Run this with: node setup-database.js
 *
 * This will execute the SQL migration on your Supabase database.
 * Make sure you have network access to Supabase.
 */

const fs = require('fs');
const https = require('https');

const config = {
  supabaseUrl: 'https://hixuvycqekjxbplddykt.supabase.co',
  serviceKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpeHV2eWNxZWtqeGJwbGRkeWt0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjg0NzQwMywiZXhwIjoyMDc4NDIzNDAzfQ.S-UnAbcHuFmkUPo1f78y0_KlhyOVqxmbWFKIWVjHkcs',
  dbPassword: 'SisI2009',
};

console.log('🚀 Universal AI Booking System - Database Setup');
console.log('================================================\n');

// Check if psql is available
const { execSync } = require('child_process');

try {
  execSync('which psql', { stdio: 'ignore' });
  console.log('✅ PostgreSQL client (psql) found\n');

  // Run migration using psql
  const connectionString = `postgresql://postgres:${config.dbPassword}@db.hixuvycqekjxbplddykt.supabase.co:5432/postgres`;
  const sqlFile = './supabase/migrations/20250111_initial_schema.sql';

  console.log('📂 Reading migration file...');
  if (!fs.existsSync(sqlFile)) {
    console.error('❌ Migration file not found:', sqlFile);
    process.exit(1);
  }

  console.log('🔄 Executing migration...\n');

  try {
    const output = execSync(`psql "${connectionString}" -f ${sqlFile}`, {
      encoding: 'utf-8',
      stdio: 'pipe'
    });

    console.log(output);
    console.log('\n✅ Migration completed successfully!');

    // Verify tables
    console.log('\n🔍 Verifying tables...');
    const verifyQuery = `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('profiles', 'business_config', 'bookings', 'call_logs');`;

    const tables = execSync(`psql "${connectionString}" -t -c "${verifyQuery}"`, {
      encoding: 'utf-8',
      stdio: 'pipe'
    });

    console.log('Tables created:');
    console.log(tables);
    console.log('\n✅ Database setup complete!');
    console.log('\nNext steps:');
    console.log('1. Deploy edge functions');
    console.log('2. Configure edge function secrets');
    console.log('3. Set up Twilio webhook');
    console.log('\nSee QUICK_START.md for details.');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.log('\n⚠️  Please run the migration manually:');
    console.log('1. Go to: https://supabase.com/dashboard/project/hixuvycqekjxbplddykt/sql/new');
    console.log('2. Copy contents from: supabase/migrations/20250111_initial_schema.sql');
    console.log('3. Paste and click Run');
    process.exit(1);
  }

} catch (error) {
  console.log('⚠️  PostgreSQL client (psql) not found on this system');
  console.log('\n📋 MANUAL SETUP REQUIRED');
  console.log('========================\n');
  console.log('Please follow these steps:\n');
  console.log('1. Go to: https://supabase.com/dashboard/project/hixuvycqekjxbplddykt/sql/new');
  console.log('2. Open file: supabase/migrations/20250111_initial_schema.sql');
  console.log('3. Copy ALL contents (Ctrl+A, Ctrl+C)');
  console.log('4. Paste into Supabase SQL Editor');
  console.log('5. Click "Run" button\n');
  console.log('Verification query:');
  console.log('SELECT table_name FROM information_schema.tables');
  console.log('WHERE table_schema = \'public\'');
  console.log('AND table_name IN (\'profiles\', \'business_config\', \'bookings\', \'call_logs\');\n');
  console.log('✅ You should see all 4 tables listed!\n');
  console.log('See RUN_MIGRATION.md for more details.');
}
