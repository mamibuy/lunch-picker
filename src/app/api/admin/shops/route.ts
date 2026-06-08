import { createServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

async function verifyAdmin() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from('profiles')
    .select('is_staff_committee, is_active').eq('id', user.id).single();
  if (!profile?.is_staff_committee || !profile?.is_active) return null;
  return user;
}

// GET /api/admin/shops — 讀取所有店家（含隱藏）
export async function GET() {
  if (!await verifyAdmin()) {
    return NextResponse.json({ error: '無權限' }, { status: 403 });
  }
  const admin = createAdminClient();
  const { data, error } = await admin.from('shops').select('*').order('name');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/admin/shops — 新增店家
export async function POST(request: Request) {
  if (!await verifyAdmin()) {
    return NextResponse.json({ error: '無權限' }, { status: 403 });
  }
  const body = await request.json();
  const admin = createAdminClient();
  const { data, error } = await admin.from('shops').insert({
    name: body.name,
    category: body.category,
    description: body.description || null,
    address: body.address,
    map_url: body.map_url || null,
    phone: body.phone || null,
    price_range: body.price_range || null,
    deal: body.deal || null,
    tags: body.tags?.length > 0 ? body.tags : null,
    photo_url: body.photo_url || null,
    badge_type: body.badge_type || '附近店家',
    hours: body.hours || null,
    lat: body.lat || null,
    lng: body.lng || null,
    foodpanda_url: body.foodpanda_url || null,
    line_url: body.line_url || null,
    visible: body.visible ?? true,
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
