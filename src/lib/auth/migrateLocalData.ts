import { createBrowserClient } from '@/lib/supabase/client';

const FAV_KEY = 'lp-fav-shops';
const PREF_CAT_KEY = 'lunch-picker:preferred-categories';
const PREF_ANY_KEY = 'lunch-picker:prefer-any';
const MIGRATED_FLAG = 'lp-migrated-to-cloud';

export async function migrateLocalData(userId: string): Promise<boolean> {
  if (localStorage.getItem(MIGRATED_FLAG) === 'true') return false;

  const supabase = createBrowserClient();
  let migrated = false;

  try {
    const localFavs: string[] = JSON.parse(localStorage.getItem(FAV_KEY) ?? '[]');
    if (localFavs.length > 0) {
      const { data: cloudFavs } = await supabase
        .from('favorites')
        .select('shop_id')
        .eq('user_id', userId);
      const cloudIds = new Set((cloudFavs ?? []).map((r: { shop_id: string }) => r.shop_id));
      const toInsert = localFavs
        .filter(id => !cloudIds.has(id))
        .map(shop_id => ({ user_id: userId, shop_id }));
      if (toInsert.length > 0) {
        await supabase.from('favorites').insert(toInsert);
        migrated = true;
      }
    }
  } catch (e) {
    console.warn('遷移收藏失敗', e);
  }

  try {
    const localCats: string[] = JSON.parse(localStorage.getItem(PREF_CAT_KEY) ?? '[]');
    const localAny = localStorage.getItem(PREF_ANY_KEY) === 'true';
    if (localCats.length > 0 || localAny) {
      const { data: existing } = await supabase
        .from('preferences')
        .select('preferred_categories, prefer_any')
        .eq('user_id', userId)
        .single();
      const cloudCats: string[] = existing?.preferred_categories ?? [];
      const merged = Array.from(new Set([...cloudCats, ...localCats])).slice(0, 3);
      await supabase.from('preferences').upsert({
        user_id: userId,
        preferred_categories: merged,
        prefer_any: (existing?.prefer_any ?? false) || localAny,
      });
    }
  } catch (e) {
    console.warn('遷移偏好失敗', e);
  }

  localStorage.setItem(MIGRATED_FLAG, 'true');
  return migrated;
}
