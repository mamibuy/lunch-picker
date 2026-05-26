'use client';
import { useEffect, useState } from 'react';
import { Shop, SERVICE_CATEGORIES, CATEGORY_EMOJI } from '@/lib/shops';
import Link from 'next/link';

export default function HappyPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('全部');

  useEffect(() => {
    fetch('/api/shops')
      .then(r => r.json())
      .then((all: Shop[]) => {
        setShops(all.filter(s => (SERVICE_CATEGORIES as string[]).includes(s.category)));
        setLoading(false);
      });
  }, []);

  const categories = ['全部', ...SERVICE_CATEGORIES.filter(c => shops.some(s => s.category === c))];
  const filtered = activeCategory === '全部' ? shops : shops.filter(s => s.category === activeCategory);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#FDEEDD' }}>
        <div className="animate-pulse text-2xl">💆</div>
      </div>
    );
  }

  if (shops.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: '#FDEEDD' }}>
        <div className="text-center px-6">
          <div className="text-7xl mb-5">🚧</div>
          <h1 className="text-2xl font-black text-stone-700 mb-2">快樂專區</h1>
          <p className="text-stone-400 text-sm leading-relaxed">還沒有美業特約店家<br/>請管理員至試算表新增</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: '#FDEEDD' }}>
      <div className="max-w-lg mx-auto px-4 pt-6">
        <h1 className="text-2xl font-black text-stone-800 mb-1">快樂</h1>
        <p className="text-sm text-stone-400 mb-4">美髮、美甲、按摩，特約優惠</p>

        {/* 分類篩選 */}
        {categories.length > 2 && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
            {categories.map(c => (
              <button
                key={c}
                onClick={() => setActiveCategory(c)}
                className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all"
                style={
                  activeCategory === c
                    ? { background: '#FF7A45', color: 'white' }
                    : { background: 'white', color: '#999' }
                }
              >
                {c === '全部' ? '全部' : `${CATEGORY_EMOJI[c as keyof typeof CATEGORY_EMOJI]} ${c}`}
              </button>
            ))}
          </div>
        )}

        {/* 店家列表 */}
        <div className="flex flex-col gap-3">
          {filtered.map(shop => (
            <Link key={shop.id} href={`/shop/${shop.id}`}>
              <div
                className="bg-white rounded-3xl overflow-hidden active:scale-95 transition-all"
                style={{ boxShadow: '0 2px 14px rgba(0,0,0,0.07)' }}
              >
                {/* 照片或 Emoji */}
                {shop.photos?.[0] ? (
                  <div className="w-full h-36 overflow-hidden">
                    <img src={shop.photos[0]} alt={shop.name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-full h-28 flex items-center justify-center text-5xl"
                    style={{ background: 'linear-gradient(135deg, #FDE8DC 0%, #FFD6C8 100%)' }}>
                    {CATEGORY_EMOJI[shop.category]}
                  </div>
                )}

                <div className="px-4 py-3">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="font-black text-stone-800 text-base">{shop.name}</span>
                    <span className="text-xs bg-orange-50 text-orange-500 px-2 py-0.5 rounded-full font-semibold flex-shrink-0 mt-0.5">
                      {shop.category}
                    </span>
                  </div>
                  {shop.deal && (
                    <p className="text-xs text-stone-500 line-clamp-2 mb-1">{shop.deal}</p>
                  )}
                  {/* LINE@ 預約提示 */}
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: '#00B900' }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
                        <path d="M12 2C6.48 2 2 5.92 2 10.76c0 3.26 2.07 6.13 5.22 7.78L6 22l4.28-2.28c.55.09 1.13.14 1.72.14 5.52 0 10-3.92 10-8.76S17.52 2 12 2z"/>
                      </svg>
                    </div>
                    <span className="text-xs text-stone-400">加 LINE@ 預約享折扣</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
