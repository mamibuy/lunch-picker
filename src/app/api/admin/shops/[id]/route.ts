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

// PATCH /api/admin/shops/:id — 更新店家
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await verifyAdmin()) {
    return NextResponse.json({ error: '無權限' }, { status: 403 });
  }
  const { id } = await params;
  const body = await request.json();
  const admin = createAdminClient();

  const updates: Record<string, unknown> = {};
  if ('name' in body) updates.name = body.name;
  if ('category' in body) updates.category = body.category;
  if ('description' in body) updates.description = body.description || null;
  if ('address' in body) updates.address = body.address;
  if ('map_url' in body) updates.map_url = body.map_url || null;
  if ('phone' in body) updates.phone = body.phone || null;
  if ('price_range' in body) updates.price_range = body.price_range || null;
  if ('deal' in body) updates.deal = body.deal || null;
  if ('tags' in body) updates.tags = body.tags?.length > 0 ? body.tags : null;
  if ('photo_url' in body) updates.photo_url = body.photo_url || null;
  if ('badge_type' in body) updates.badge_type = body.badge_type || '附近店家';
  if ('hours' in body) updates.hours = body.hours || null;
  if ('lat' in body) updates.lat = body.lat || null;
  if ('lng' in body) updates.lng = body.lng || null;
  if ('foodpanda_url' in body) updates.foodpanda_url = body.foodpanda_url || null;
  if ('line_url' in body) updates.line_url = body.line_url || null;
  if ('visible' in body) updates.visible = body.visible;

  const { data, error } = await admin.from('shops').update(updates).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
