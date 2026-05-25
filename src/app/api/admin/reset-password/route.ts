import { createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登入' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('is_staff_committee, is_active').eq('id', user.id).single();
  if (!profile?.is_staff_committee || !profile?.is_active) {
    return NextResponse.json({ error: '無權限' }, { status: 403 });
  }

  const { userId, password } = await request.json();
  if (!userId || !password || password.length < 6) {
    return NextResponse.json({ error: '密碼至少 6 位數' }, { status: 400 });
  }

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await adminClient.auth.admin.updateUserById(userId, { password });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ success: true });
}
