/**
 * Check and provide instructions for running the sports_bets migration
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hvnyxvapeorjcxljtszc.supabase.co';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceRoleKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in environment variables');
  console.error('Please set it in your .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function checkAndRunMigration() {
  try {
    console.log('🔍 Checking if sports_bets table exists...\n');

    // Try to query the table
    const { data, error } = await supabase
      .from('sports_bets')
      .select('*')
      .limit(0);

    if (error) {
      if (error.code === '42P01' || error.message.includes('does not exist')) {
        console.log('❌ Table does not exist. Migration needs to be run.\n');
        console.log('📋 To run the migration, please follow these steps:\n');
        console.log('   1. Go to: https://supabase.com/dashboard');
        console.log('   2. Select your project');
        console.log('   3. Click on "SQL Editor" in the left sidebar');
        console.log('   4. Click "New query"');
        console.log('   5. Copy and paste the following SQL:\n');
        console.log('─'.repeat(60));
        
        const fs = require('fs');
        const path = require('path');
        const migrationPath = path.join(__dirname, '../supabase/migrations/20240101000000_create_sports_bets.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        console.log(migrationSQL);
        
        console.log('─'.repeat(60));
        console.log('\n   6. Click "Run" to execute the migration');
        console.log('   7. Verify the table was created successfully\n');
        
        return false;
      } else {
        console.error('❌ Error checking table:', error.message);
        return false;
      }
    } else {
      console.log('✅ sports_bets table already exists!');
      console.log('   Migration has already been run.\n');
      return true;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

checkAndRunMigration().then(exists => {
  if (exists) {
    console.log('✨ No action needed - table exists!');
  } else {
    console.log('💡 Please run the migration using the instructions above.');
  }
  process.exit(exists ? 0 : 1);
});
