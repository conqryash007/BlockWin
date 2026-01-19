/**
 * Migration API Route
 * POST /api/migrations/run-sports-bets
 * 
 * Runs the sports_bets table migration
 * WARNING: This should be protected or removed after migration
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Read the migration file
    const migrationPath = path.join(process.cwd(), 'supabase/migrations/20240101000000_create_sports_bets.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('Running sports_bets migration...');

    // Split SQL into statements (simplified - handles basic cases)
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('COMMENT'));

    const results = [];
    const errors = [];

    // Execute each statement
    for (const statement of statements) {
      if (!statement) continue;

      try {
        // Use Supabase's REST API to execute raw SQL via PostgREST
        // Note: This is a workaround - ideally use Supabase CLI or Dashboard
        
        // For CREATE TABLE, we can check if it exists first
        if (statement.includes('CREATE TABLE')) {
          const tableNameMatch = statement.match(/CREATE TABLE.*?(\w+)\s*\(/i);
          if (tableNameMatch) {
            const tableName = tableNameMatch[1];
            
            // Check if table exists
            const { error: checkError } = await supabaseAdmin
              .from(tableName)
              .select('*')
              .limit(0);

            if (!checkError) {
              results.push({ statement: 'CREATE TABLE', status: 'skipped', message: `Table ${tableName} already exists` });
              continue;
            }
          }
        }

        // Try to execute via RPC (if available)
        // Otherwise, we'll need manual execution
        results.push({ 
          statement: statement.substring(0, 50) + '...', 
          status: 'requires_manual', 
          message: 'Please run this migration in Supabase Dashboard SQL Editor' 
        });

      } catch (error: any) {
        errors.push({ statement, error: error.message });
      }
    }

    if (errors.length > 0) {
      return NextResponse.json({
        success: false,
        message: 'Migration requires manual execution',
        errors,
        instructions: [
          '1. Go to https://supabase.com/dashboard',
          '2. Select your project',
          '3. Navigate to SQL Editor',
          '4. Copy the SQL from: supabase/migrations/20240101000000_create_sports_bets.sql',
          '5. Paste and execute it',
        ],
      }, { status: 200 });
    }

    return NextResponse.json({
      success: true,
      message: 'Migration instructions provided',
      results,
      instructions: [
        'Please run this migration manually in Supabase Dashboard SQL Editor',
        'The migration file is located at: supabase/migrations/20240101000000_create_sports_bets.sql',
      ],
    });

  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      instructions: [
        'Please run the migration manually:',
        '1. Go to Supabase Dashboard → SQL Editor',
        '2. Copy SQL from: supabase/migrations/20240101000000_create_sports_bets.sql',
        '3. Paste and execute',
      ],
    }, { status: 500 });
  }
}
