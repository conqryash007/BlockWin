import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email') || 'tanvirrockz@gmail.com';
    
    // Find user by email in auth
    const { data: usersData, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 500 });
    }
    
    const user = usersData.users.find(u => u.email === email);
    
    if (!user) {
      return NextResponse.json({ message: `User with email ${email} not found in Supabase Auth. They need to sign in at least once.` });
    }
    
    // Update the public.users table
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ is_admin: true })
      .eq('id', user.id);
      
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
    
    return NextResponse.json({ message: `Successfully made ${email} an admin in the database!` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
