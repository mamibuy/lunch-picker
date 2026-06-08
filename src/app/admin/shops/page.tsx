'use client';
import { useAuth } from '@/components/AuthProvider';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ALL_CATEGORIES, CATEGORY_EMOJI } from '@/lib/shops';
import type { Shop, Category, PriceRange } from '@/lib/shops';

type AdminShop = Shop & { visible: boolean };

const BADGE_OPTIONS = ['特約店家', '附近店家', '活動優惠'];
const PRICE_OPTIONS: PriceRange[] = ['$', '$$', '$$$'];

export default function AdminShopsPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [shops, setShops] = useState<AdminShop[]>([]);
  const [fetching, setFetching] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<string>('全部');
  const [filterVisible, setFilterVisible] = useState<'all' | 'visible' | 'hidden'>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingShop, setEditingShop] = useState<AdminShop | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  const isAdmin = profile?.is_staff_committee === true && profile?.is_active === true;

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) router.replace('/');
  }, [loading, user, isAdmin, router]);

  const fetchShops = useCallback(async () => {
    setFetching(true);
    const res = await fetch('/api/admin/shops');
    if (res.ok) setShops(await res.json());
    setFetching(false);
  }, []);

  useEffect(() => {
    if (isAdmin) fetchShops();
  }, [isAdmin, fetchShops]);

  async function toggleVisible(shop: AdminShop) {
    setToggling(shop.id);
    await fetch(`/api/admin/shops/${shop.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visible: !shop.visible }),
    });
    setShops(prev => prev.map(s => s.id === shop.id ? { ...s, visible: !s.visible } : s));
    setToggling(null);
  }

  const filtered = shops.filter(s => {
    if (filterCat !== '全部' && s.category !== filterCat) return false;
    if (filterVisible === 'visible' && !s.visible) return false;
    if (filterVisible === 'hidden' && s.visible) return false;
    if (search && !s.name.includes(search) && !(s.deal ?? '').includes(search)) return false;
    return true;
  });

  if (loading || fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#1e293b' }}>
        <div className="animate-bounce text-3xl">🍽️</div>
      </div>
    );
  }

  if (!isAdmin) return null;

  const visibleCount = shops.filter(s => s.visible).length;
  const hiddenCount = shops.filter(s => !s.visible).length;

  return (
    <div className="min-h-screen pb-16" style={{ background: '#1e293b' }}>
      <div className="max-w-2xl mx-auto px-4 pt-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-slate-400 hover:text-slate-200 text-sm">← 後台</Link>
            <span className="text-slate-600">|</span>
            <h1 className="text-lg font-black text-white">店家管理</h1>
            <span className="text-xs text-slate-500">
              {visibleCount} 上架 · {hiddenCount} 下架
            </span>
          </div>
          <button
            onClick={() => { setEditingShop(null); setShowForm(true); }}
            className="px-4 py-2 rounded-xl font-bold text-white text-sm active:scale-95 transition-transform"
            style={{ background: 'linear-gradient(135deg, #FF7A45 0%, #FF5B5B 100%)' }}
          >
            + 新增店家
          </button>
        </div>

        {/* Search & filter */}
        <div className="flex flex-col gap-3 mb-5">
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="搜尋店名或優惠內容…"
            className="w-full bg-slate-800 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-400"
          />
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {['全部', ...ALL_CATEGORIES].map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCat(cat)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  filterCat === cat
                    ? 'bg-orange-500 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {cat === '全部' ? '全部' : `${CATEGORY_EMOJI[cat as Category]} ${cat}`}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {(['all', 'visible', 'hidden'] as const).map(v => (
              <button
                key={v}
                onClick={() => setFilterVisible(v)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  filterVisible === v
                    ? 'bg-slate-500 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {v === 'all' ? '全部狀態' : v === 'visible' ? '✅ 上架中' : '🚫 已下架'}
              </button>
            ))}
          </div>
        </div>

        {/* Shop form (create/edit) */}
        {showForm && (
          <ShopForm
            initialData={editingShop}
            onClose={() => setShowForm(false)}
            onSaved={(saved) => {
              if (editingShop) {
                setShops(prev => prev.map(s => s.id === saved.id ? saved : s));
              } else {
                setShops(prev => [saved, ...prev]);
              }
              setShowForm(false);
            }}
          />
        )}

        {/* Shop list */}
        <div className="flex flex-col gap-3">
          {filtered.length === 0 && (
            <div className="text-center text-slate-500 py-12 text-sm">
              {shops.length === 0 ? '尚無店家資料，請先在 Supabase 執行 SQL 匯入' : '沒有符合篩選條件的店家'}
            </div>
          )}
          {filtered.map(shop => (
            <ShopRow
              key={shop.id}
              shop={shop}
              toggling={toggling === shop.id}
              onToggle={() => toggleVisible(shop)}
              onEdit={() => { setEditingShop(shop); setShowForm(true); }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ShopRow({ shop, toggling, onToggle, onEdit }: {
  shop: AdminShop;
  toggling: boolean;
  onToggle: () => void;
  onEdit: () => void;
}) {
  return (
    <div className={`bg-slate-800 rounded-2xl p-4 flex items-start gap-4 transition-opacity ${shop.visible ? '' : 'opacity-60'}`}>
      {/* Category icon */}
      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 bg-slate-700">
        {CATEGORY_EMOJI[shop.category as Category] ?? '🍽️'}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-white font-bold text-sm leading-tight">{shop.name}</span>
          {shop.deal && (
            <span className="text-xs bg-orange-500/20 text-orange-300 px-2 py-0.5 rounded-lg">
              {shop.deal.slice(0, 20)}{shop.deal.length > 20 ? '…' : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="text-slate-400 text-xs">{shop.category}</span>
          {shop.priceRange && <span className="text-slate-500 text-xs">{shop.priceRange}</span>}
          {shop.hours && <span className="text-slate-500 text-xs truncate max-w-[120px]">{shop.hours}</span>}
        </div>
        <div className="text-slate-500 text-xs mt-0.5 truncate">{shop.address}</div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={onEdit}
          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-700 text-slate-300 hover:bg-slate-600 active:scale-95 transition-all"
        >
          編輯
        </button>
        <button
          onClick={onToggle}
          disabled={toggling}
          className={`w-12 h-6 rounded-full transition-colors duration-200 flex-shrink-0 disabled:opacity-50 ${shop.visible ? 'bg-green-500' : 'bg-slate-600'}`}
        >
          <div className={`w-5 h-5 bg-white rounded-full shadow mt-0.5 mx-0.5 transition-transform duration-200 ${shop.visible ? 'translate-x-6' : 'translate-x-0'}`} />
        </button>
      </div>
    </div>
  );
}

type FormData = {
  name: string;
  category: string;
  description: string;
  address: string;
  map_url: string;
  phone: string;
  price_range: string;
  deal: string;
  tags: string;
  photo_url: string;
  badge_type: string;
  hours: string;
  lat: string;
  lng: string;
  foodpanda_url: string;
  line_url: string;
  visible: boolean;
};

function ShopForm({ initialData, onClose, onSaved }: {
  initialData: AdminShop | null;
  onClose: () => void;
  onSaved: (shop: AdminShop) => void;
}) {
  const [form, setForm] = useState<FormData>({
    name: initialData?.name ?? '',
    category: initialData?.category ?? ALL_CATEGORIES[0],
    description: initialData?.description ?? '',
    address: initialData?.address ?? '',
    map_url: initialData?.mapUrl ?? '',
    phone: initialData?.phone ?? '',
    price_range: initialData?.priceRange ?? '',
    deal: initialData?.deal ?? '',
    tags: initialData?.tags?.join('、') ?? '',
    photo_url: initialData?.photoUrl ?? '',
    badge_type: initialData?.badgeType ?? '附近店家',
    hours: initialData?.hours ?? '',
    lat: initialData?.lat?.toString() ?? '',
    lng: initialData?.lng?.toString() ?? '',
    foodpanda_url: initialData?.foodpandaUrl ?? '',
    line_url: initialData?.lineUrl ?? '',
    visible: initialData?.visible ?? true,
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const set = (k: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.category || !form.address.trim()) {
      setErrorMsg('店名、分類、地址為必填');
      setStatus('error');
      return;
    }
    setStatus('loading');
    setErrorMsg('');

    const body = {
      name: form.name.trim(),
      category: form.category,
      description: form.description.trim(),
      address: form.address.trim(),
      map_url: form.map_url.trim(),
      phone: form.phone.trim(),
      price_range: form.price_range,
      deal: form.deal.trim(),
      tags: form.tags.split(/[,，、]/).map(t => t.trim()).filter(Boolean),
      photo_url: form.photo_url.trim(),
      badge_type: form.badge_type,
      hours: form.hours.trim(),
      lat: form.lat ? parseFloat(form.lat) : null,
      lng: form.lng ? parseFloat(form.lng) : null,
      foodpanda_url: form.foodpanda_url.trim(),
      line_url: form.line_url.trim(),
      visible: form.visible,
    };

    const url = initialData ? `/api/admin/shops/${initialData.id}` : '/api/admin/shops';
    const method = initialData ? 'PATCH' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const d = await res.json();
      setErrorMsg(d.error ?? '儲存失敗');
      setStatus('error');
      return;
    }

    const saved = await res.json();
    onSaved({
      id: saved.id,
      name: saved.name,
      category: saved.category,
      description: saved.description,
      address: saved.address,
      mapUrl: saved.map_url,
      phone: saved.phone,
      priceRange: saved.price_range,
      deal: saved.deal,
      tags: saved.tags,
      photos: saved.photos,
      photoUrl: saved.photo_url,
      badgeType: saved.badge_type,
      hours: saved.hours,
      lat: saved.lat,
      lng: saved.lng,
      foodpandaUrl: saved.foodpanda_url,
      lineUrl: saved.line_url,
      visible: saved.visible,
    });
  }

  const inputCls = 'w-full bg-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-400';
  const labelCls = 'text-slate-400 text-xs font-bold mb-1';

  return (
    <div className="bg-slate-800 rounded-2xl p-5 mb-5 border border-slate-700">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-black text-white text-base">
          {initialData ? `編輯：${initialData.name}` : '新增店家'}
        </h2>
        <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">✕</button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* 必填 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <div className={labelCls}>店名 *</div>
            <input type="text" value={form.name} onChange={set('name')} placeholder="店名" required className={inputCls} />
          </div>
          <div>
            <div className={labelCls}>分類 *</div>
            <select value={form.category} onChange={set('category')} className={inputCls}>
              {ALL_CATEGORIES.map(c => (
                <option key={c} value={c}>{CATEGORY_EMOJI[c]} {c}</option>
              ))}
            </select>
          </div>
          <div>
            <div className={labelCls}>價位</div>
            <select value={form.price_range} onChange={set('price_range')} className={inputCls}>
              <option value="">-- 不填 --</option>
              {PRICE_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        <div>
          <div className={labelCls}>地址 *</div>
          <input type="text" value={form.address} onChange={set('address')} placeholder="完整地址" required className={inputCls} />
        </div>

        {/* 優惠 */}
        <div>
          <div className={labelCls}>特約優惠內容</div>
          <textarea value={form.deal} onChange={set('deal')} placeholder="例：員工憑識別證 9 折" rows={2}
            className={`${inputCls} resize-none`} />
        </div>

        {/* 聯絡 */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className={labelCls}>電話</div>
            <input type="text" value={form.phone} onChange={set('phone')} placeholder="(02)xxxx-xxxx" className={inputCls} />
          </div>
          <div>
            <div className={labelCls}>Google Maps 連結</div>
            <input type="url" value={form.map_url} onChange={set('map_url')} placeholder="https://maps.google.com/..." className={inputCls} />
          </div>
        </div>

        {/* 額外資訊 */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className={labelCls}>營業時間</div>
            <input type="text" value={form.hours} onChange={set('hours')} placeholder="11:00-21:00" className={inputCls} />
          </div>
          <div>
            <div className={labelCls}>店家標籤</div>
            <select value={form.badge_type} onChange={set('badge_type')} className={inputCls}>
              {BADGE_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
        </div>

        <div>
          <div className={labelCls}>標籤（逗號分隔）</div>
          <input type="text" value={form.tags} onChange={set('tags')} placeholder="份量大、快出餐、有素食" className={inputCls} />
        </div>

        <div>
          <div className={labelCls}>介紹</div>
          <textarea value={form.description} onChange={set('description')} placeholder="一句話介紹" rows={2}
            className={`${inputCls} resize-none`} />
        </div>

        <div>
          <div className={labelCls}>照片網址</div>
          <input type="url" value={form.photo_url} onChange={set('photo_url')} placeholder="https://..." className={inputCls} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className={labelCls}>Foodpanda 連結</div>
            <input type="url" value={form.foodpanda_url} onChange={set('foodpanda_url')} placeholder="https://..." className={inputCls} />
          </div>
          <div>
            <div className={labelCls}>LINE@ 連結</div>
            <input type="url" value={form.line_url} onChange={set('line_url')} placeholder="https://line.me/..." className={inputCls} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className={labelCls}>緯度（Lat）</div>
            <input type="number" step="any" value={form.lat} onChange={set('lat')} placeholder="25.0418" className={inputCls} />
          </div>
          <div>
            <div className={labelCls}>經度（Lng）</div>
            <input type="number" step="any" value={form.lng} onChange={set('lng')} placeholder="121.5497" className={inputCls} />
          </div>
        </div>

        {/* 上架狀態 */}
        <label className="flex items-center gap-3 cursor-pointer">
          <button
            type="button"
            onClick={() => setForm(prev => ({ ...prev, visible: !prev.visible }))}
            className={`w-11 h-6 rounded-full transition-colors ${form.visible ? 'bg-green-500' : 'bg-slate-600'}`}
          >
            <div className={`w-5 h-5 bg-white rounded-full shadow mt-0.5 mx-0.5 transition-transform ${form.visible ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
          <span className="text-sm text-slate-300 font-semibold">
            {form.visible ? '✅ 上架中（員工看得到）' : '🚫 已下架（員工看不到）'}
          </span>
        </label>

        {status === 'error' && <p className="text-red-400 text-xs">{errorMsg}</p>}

        <div className="flex gap-3 mt-1">
          <button type="button" onClick={onClose}
            className="flex-1 py-3 rounded-xl text-slate-400 text-sm font-semibold bg-slate-700 hover:bg-slate-600">
            取消
          </button>
          <button type="submit" disabled={status === 'loading'}
            className="flex-1 py-3 rounded-xl text-white text-sm font-bold disabled:opacity-50 active:scale-95 transition-all"
            style={{ background: 'linear-gradient(135deg, #FF7A45 0%, #FF5B5B 100%)' }}>
            {status === 'loading' ? '儲存中…' : initialData ? '儲存變更' : '新增店家'}
          </button>
        </div>
      </form>
    </div>
  );
}
