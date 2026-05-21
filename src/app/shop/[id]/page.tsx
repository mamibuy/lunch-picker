import { fetchShopById, fetchShops } from '@/lib/fetchShops';

function FoodpandaLogo() {
  return (
    <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#FF2B85' }}>
      <svg width="21" height="21" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="12.5" r="8.5" fill="white"/>
        <circle cx="4" cy="5" r="3" fill="#1a1a1a"/>
        <circle cx="18" cy="5" r="3" fill="#1a1a1a"/>
        <ellipse cx="7.5" cy="10.5" rx="3" ry="2.6" fill="#1a1a1a"/>
        <ellipse cx="14.5" cy="10.5" rx="3" ry="2.6" fill="#1a1a1a"/>
        <circle cx="7.5" cy="10.5" r="1.3" fill="white"/>
        <circle cx="14.5" cy="10.5" r="1.3" fill="white"/>
        <ellipse cx="11" cy="14" rx="1.6" ry="1.2" fill="#1a1a1a"/>
        <path d="M9 15.5 Q11 17 13 15.5" stroke="#1a1a1a" strokeWidth="0.9" fill="none" strokeLinecap="round"/>
      </svg>
    </div>
  );
}
import { CATEGORY_EMOJI } from '@/lib/shops';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import NavigateButton from '@/components/NavigateButton';
import PhotoGallery from '@/components/PhotoGallery';
import FavButton from '@/components/FavButton';

export async function generateStaticParams() {
  const shops = await fetchShops();
  return shops.map((s) => ({ id: s.id }));
}

export default async function ShopPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const shop = await fetchShopById(id);

  if (!shop) notFound();

  return (
    <div className="min-h-screen" style={{ background: '#FDEEDD' }}>
      {/* 頂部返回列 */}
      <div className="sticky top-0 z-10 px-4 py-3 flex items-center justify-between gap-2 bg-orange-100">
        <Link href="/" className="flex items-center gap-1 font-semibold text-sm text-stone-700 active:opacity-70 transition-opacity">
          ← 返回列表
        </Link>
        <FavButton shopId={shop.id} />
      </div>

      {/* 照片或 Emoji 佔位 */}
      {shop.photos && shop.photos.length > 0 ? (
        <PhotoGallery photos={shop.photos} name={shop.name} />
      ) : (
        <div className="w-full h-48 bg-orange-100 flex items-center justify-center text-7xl">
          {CATEGORY_EMOJI[shop.category]}
        </div>
      )}

      <div className="max-w-lg mx-auto px-4 py-5">
        {/* 店名與分類 */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <h1 className="text-2xl font-black text-stone-800 leading-tight">{shop.name}</h1>
          <div className="flex flex-col items-end gap-1 flex-shrink-0 mt-1">
            <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full font-semibold">
              {CATEGORY_EMOJI[shop.category]} {shop.category}
            </span>
            {shop.priceRange && <span className="text-sm text-stone-400">{shop.priceRange}</span>}
          </div>
        </div>

        {/* 特約內容 ＋ Foodpanda（特約店家限定） / 一般優惠區塊 */}
        {shop.badgeType === '特約店家' ? (
          <div className="rounded-3xl p-4 mb-5 shadow-sm" style={{ background: '#D4618A', boxShadow: '0 2px 12px rgba(180,60,110,0.25)' }}>
            <div className="text-xs font-bold text-white opacity-75 mb-1 tracking-wider">✨ 員工特約優惠</div>
            <div className="text-lg font-black text-white leading-snug whitespace-pre-line mb-4">{shop.deal}</div>
            {/* Foodpanda 合作按鈕：有連結就可點，沒有就純展示 */}
            {shop.foodpandaUrl ? (
              <a
                href={shop.foodpandaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-2xl px-3 py-2.5 flex items-center gap-2.5 active:opacity-80 transition-opacity"
                style={{ background: 'rgba(255,255,255,0.95)' }}
              >
                <FoodpandaLogo />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold" style={{ color: '#FF2B85' }}>foodpanda 合作優惠</div>
                  <div className="font-bold text-stone-800 text-sm">預約訂餐，外帶自取</div>
                </div>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FF2B85" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </a>
            ) : (
              <div className="rounded-2xl px-3 py-2.5 flex items-center gap-2.5" style={{ background: 'rgba(255,255,255,0.95)' }}>
                <FoodpandaLogo />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold" style={{ color: '#FF2B85' }}>foodpanda 合作優惠</div>
                  <div className="font-bold text-stone-800 text-sm">預約訂餐，外帶自取</div>
                </div>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FF2B85" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-orange-500 text-white rounded-3xl p-4 mb-5 shadow-sm shadow-orange-900/20">
            <div className="text-xs font-bold opacity-75 mb-1 tracking-wider">✨ 員工特約優惠</div>
            <div className="text-lg font-black leading-snug whitespace-pre-line">{shop.deal}</div>
          </div>
        )}

        {shop.description && (
          <p className="text-stone-500 text-sm mb-5 leading-relaxed">{shop.description}</p>
        )}

        {/* 地址、電話 */}
        <div className="bg-white rounded-3xl divide-y divide-stone-100 overflow-hidden mb-5 shadow-sm shadow-orange-900/10">
          <NavigateButton shop={shop} />
          {shop.phone && (
            <a href={`tel:${shop.phone}`}
              className="flex items-center gap-3 px-4 py-4 active:bg-orange-50 transition-colors">
              <span className="text-xl">📞</span>
              <div className="flex-1">
                <div className="text-xs text-stone-400 mb-0.5">電話（點此撥號）</div>
                <div className="text-sm text-stone-700">{shop.phone}</div>
              </div>
              <span className="text-stone-300 text-lg">›</span>
            </a>
          )}
        </div>

        {/* 標籤 */}
        {shop.tags && shop.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {shop.tags.map((tag) => (
              <span key={tag} className="text-sm bg-white text-stone-500 px-3 py-1.5 rounded-full border border-stone-200 shadow-sm">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
