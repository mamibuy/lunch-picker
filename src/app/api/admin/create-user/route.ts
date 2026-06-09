import { createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  // 驗證請求者是否為管理員
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: '未登入' }, { status: 401 });
  }
  const { data: profile } = await supabase.from('profiles').select('is_staff_committee, is_active').eq('id', user.id).single();
  if (!profile?.is_staff_committee || !profile?.is_active) {
    return NextResponse.json({ error: '無權限' }, { status: 403 });
  }

  const { email, password, display_name, department } = await request.json();
  if (!email || !password) {
    return NextResponse.json({ error: '請填寫 Email 和密碼' }, { status: 400 });
  }

  // 使用 service role key 建立帳號（繞過 email 驗證）
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!.trim(),
    process.env.SUPABASE_SERVICE_ROLE_KEY!.trim()
  );

  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name, department },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // 立即將 profile 設為 active（管理員建立的帳號直接開通）
  await adminClient.from('profiles').update({
    display_name: display_name || null,
    department: department || null,
    is_active: true,
  }).eq('id', data.user.id);

  return NextResponse.json({ success: true, userId: data.user.id });
}
