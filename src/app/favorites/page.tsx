'use client';
import { useAuth } from '@/components/AuthProvider';
import { useEffect, useState } from 'react';
import { fetchShops } from '@/lib/fetchShops';
import { Shop } from '@/lib/shops';
import ShopCard from '@/components/ShopCard';
import Link from 'next/link';

export default function FavoritesPage() {
  const { user, favIds, toggleFav, loading } = useAuth();
  const [allShops, setAllShops] = useState<Shop[]>([]);
  const [shopsLoading, setShopsLoading] = useState(true);

  useEffect(() => {
    fetchShops().then(shops => {
      setAllShops(shops);
      setShopsLoading(false);
    });
  }, []);

  const favShops = allShops.filter(s => favIds.includes(s.id));

  if (loading || shopsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#FDEEDD' }}>
        <div className="animate-pulse text-2xl">🍱</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#FDEEDD' }}>
      <div className="max-w-lg mx-auto px-4 pt-6 pb-8">
        <h1 className="text-2xl font-black text-stone-800 mb-1">我的收藏</h1>
        <p className="text-sm text-stone-400 mb-4">{favIds.length > 0 ? `${favIds.length} 家店` : '還沒有收藏'}</p>

        {/* 未登入提示條 */}
        {!user && favIds.length > 0 && (
          <Link href="/login"
            className="block bg-orange-50 border border-orange-200 rounded-2xl px-4 py-3 mb-4 text-sm text-orange-600 text-center font-semibold active:bg-orange-100 transition-colors">
            🔒 登入後收藏自動雲端同步，換手機不怕消失
          </Link>
        )}

        {/* 收藏列表 */}
        {favShops.length > 0 ? (
          <div className="flex flex-col gap-3">
            {favShops.map((shop, i) => (
              <ShopCard
                key={shop.id}
                shop={shop}
                isFav={true}
                onToggleFav={() => toggleFav(shop.id)}
                index={i}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">💔</div>
            <p className="text-stone-400 text-sm">還沒有收藏的店家</p>
            <p className="text-stone-300 text-xs mt-1">回首頁點愛心加入收藏</p>
            <Link href="/"
              className="inline-block mt-5 px-6 py-3 rounded-2xl font-bold text-white text-sm active:scale-95 transition-transform"
              style={{ background: '#FF7A45' }}>
              去找店家
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
