/**
 * Migration Runner Script
 * Runs the sports_bets table migration
 * 
 * Usage: node scripts/run-migration.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hvnyxvapeorjcxljtszc.supabase.co';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceRoleKey) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY environment variable is not set');
  console.error('Please set it in your .env.local file or environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function runMigration() {
  try {
    console.log('🔄 Running sports_bets migration...\n');

    // Read the migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/20240101000000_create_sports_bets.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration SQL:');
    console.log('─'.repeat(50));
    console.log(migrationSQL);
    console.log('─'.repeat(50));
    console.log('');

    // Execute the migration using RPC or direct SQL
    // Note: Supabase JS client doesn't support raw SQL execution directly
    // We need to use the REST API or create a function
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement || statement.length === 0) continue;

      try {
        console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
        
        // Use Supabase REST API to execute SQL
        // Note: This requires using the REST API directly since JS client doesn't support raw SQL
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceRoleKey,
            'Authorization': `Bearer ${supabaseServiceRoleKey}`,
          },
          body: JSON.stringify({ sql: statement }),
        });

        if (!response.ok) {
          // Try alternative: Check if table already exists
          if (statement.includes('CREATE TABLE') && response.status === 400) {
            const errorText = await response.text();
            if (errorText.includes('already exists') || errorText.includes('duplicate')) {
              console.log('   ℹ️  Table already exists, skipping...');
              continue;
            }
          }
          throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }

        console.log(`   ✅ Statement ${i + 1} executed successfully`);
      } catch (error) {
        // If exec_sql RPC doesn't exist, we'll need to use a different approach
        if (error.message.includes('exec_sql') || error.message.includes('404')) {
          console.log('   ⚠️  Direct SQL execution not available via RPC');
          console.log('   💡 Please run this migration manually in Supabase Dashboard:');
          console.log('      1. Go to https://supabase.com/dashboard');
          console.log('      2. Select your project');
          console.log('      3. Go to SQL Editor');
          console.log('      4. Paste and run the migration SQL');
          break;
        }
        console.error(`   ❌ Error executing statement ${i + 1}:`, error.message);
      }
    }

    // Verify the table was created
    console.log('\n🔍 Verifying migration...');
    const { data, error } = await supabase
      .from('sports_bets')
      .select('*')
      .limit(0);

    if (error) {
      if (error.code === '42P01') {
        console.log('❌ Table does not exist. Migration may have failed.');
        console.log('💡 Please run the migration manually in Supabase Dashboard SQL Editor');
      } else {
        console.log('⚠️  Could not verify table:', error.message);
      }
    } else {
      console.log('✅ Migration verified! sports_bets table exists.');
    }

    console.log('\n✨ Migration process completed!');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\n💡 Alternative: Run the migration manually in Supabase Dashboard:');
    console.error('   1. Go to https://supabase.com/dashboard');
    console.error('   2. Select your project');
    console.error('   3. Go to SQL Editor');
    console.error('   4. Copy the SQL from: supabase/migrations/20240101000000_create_sports_bets.sql');
    console.error('   5. Paste and execute it');
    process.exit(1);
  }
}

runMigration();
