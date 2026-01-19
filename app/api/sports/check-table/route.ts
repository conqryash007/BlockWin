/**
 * Diagnostic endpoint to check if sports_bets table exists
 * GET /api/sports/check-table
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  try {
    // Try to query the table
    const { data, error } = await supabaseAdmin
      .from('sports_bets')
      .select('*')
      .limit(0);

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json({
          exists: false,
          error: 'Table does not exist',
          code: error.code,
          message: error.message,
          hint: 'Please run the migration: supabase/migrations/20240101000000_create_sports_bets.sql',
        });
      }
      
      return NextResponse.json({
        exists: false,
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
    }

    // Try to get table structure
    const { data: tableInfo, error: infoError } = await supabaseAdmin
      .rpc('get_table_info', { table_name: 'sports_bets' })
      .single();

    return NextResponse.json({
      exists: true,
      message: 'Table exists and is accessible',
      columns: tableInfo || 'Unable to fetch column info',
    });

  } catch (error: any) {
    return NextResponse.json({
      exists: false,
      error: error.message,
      type: 'exception',
    }, { status: 500 });
  }
}
