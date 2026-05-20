import Link from 'next/link';
import { Shop, CATEGORY_EMOJI } from '@/lib/shops';
import { formatDistance } from '@/lib/geo';

export default function ShopCard({
  shop,
  distanceKm,
  isPreferred,
  index = 0,
}: {
  shop: Shop;
  distanceKm?: number | null;
  isPreferred?: boolean;
  index?: number;
}) {
  return (
    <Link
      href={`/shop/${shop.id}`}
      className="block animate-fade-in-up"
      style={{ animationDelay: `${index * 0.06}s` }}
    >
      <div
        className={`bg-white rounded-3xl overflow-hidden active:scale-95 transition-transform duration-150 cursor-pointer shadow-sm shadow-orange-900/10 ${
          isPreferred ? 'ring-2 ring-orange-400' : ''
        }`}
      >
        {/* 照片或 Emoji 佔位 */}
        {shop.photoUrl ? (
          <img
            src={shop.photoUrl}
            alt={shop.name}
            className="w-full h-40 object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-28 bg-orange-50 flex items-center justify-center text-5xl">
            {CATEGORY_EMOJI[shop.category]}
          </div>
        )}

        <div className="p-4">
          {/* 店名與標籤列 */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <h2 className="text-lg font-bold text-stone-800 leading-snug">{shop.name}</h2>
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              {isPreferred && (
                <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-semibold">
                  ❤️ 你的口味
                </span>
              )}
              <span className="text-xs bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full">
                {CATEGORY_EMOJI[shop.category]} {shop.category}
              </span>
              {shop.priceRange && (
                <span className="text-xs text-stone-400">{shop.priceRange}</span>
              )}
            </div>
          </div>

          {/* 特約內容 — 最重要 */}
          <div className="bg-orange-500 text-white text-sm font-semibold px-3 py-2 rounded-2xl mb-3 flex items-center gap-2">
            <span>🎉</span>
            <span>{shop.deal}</span>
          </div>

          {shop.description && (
            <p className="text-sm text-stone-500 mb-2 line-clamp-1">{shop.description}</p>
          )}

          {/* 底部資訊列 */}
          <div className="flex items-center gap-3 text-xs text-stone-400">
            {distanceKm != null ? (
              <span className="text-orange-500 font-medium">📍 {formatDistance(distanceKm)}</span>
            ) : shop.walkMinutes !== undefined ? (
              <span>🚶 步行 {shop.walkMinutes} 分鐘</span>
            ) : null}
            {shop.tags && shop.tags.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {shop.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="bg-stone-100 text-stone-500 text-xs px-2 py-0.5 rounded-full">{tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
