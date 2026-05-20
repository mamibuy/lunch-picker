import Link from 'next/link';
import { Shop, CATEGORY_EMOJI } from '@/lib/shops';
import { formatDistance } from '@/lib/geo';

const StarIcon = () => <svg width="9" height="9" viewBox="0 0 24 24" fill="white"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>;
const PinIcon  = () => <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5" fill="white" stroke="none"/></svg>;
const TagIcon  = () => <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>;

const KNOWN_BADGES: Record<string, { bg: string; shadow: string; icon: React.ReactNode }> = {
  '特約店家': { bg: '#FF5B5B', shadow: 'rgba(255,91,91,0.4)',   icon: <StarIcon /> },
  '附近店家': { bg: '#22C55E', shadow: 'rgba(34,197,94,0.4)',   icon: <PinIcon />  },
  '活動優惠': { bg: '#F59E0B', shadow: 'rgba(245,158,11,0.4)',  icon: <TagIcon />  },
};

function getBadge(type: string) {
  return KNOWN_BADGES[type] ?? { bg: '#FF7A45', shadow: 'rgba(255,122,69,0.4)', icon: <StarIcon /> };
}

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
        className="bg-white rounded-[20px] overflow-hidden flex cursor-pointer active:scale-95 transition-transform duration-150"
        style={{
          boxShadow: isPreferred
            ? '0 4px 18px rgba(255,122,69,0.28), 0 1px 4px rgba(255,122,69,0.15)'
            : '0 2px 14px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)',
          border: isPreferred ? '1.5px solid rgba(255,122,69,0.4)' : '1.5px solid rgba(0,0,0,0.04)',
        }}
      >
        {/* ── 左側照片 ── */}
        <div className="relative flex-shrink-0" style={{ width: '40%' }}>
          {shop.photoUrl ? (
            <img
              src={shop.photoUrl}
              alt={shop.name}
              className="w-full object-cover"
              style={{ height: '160px' }}
              loading="lazy"
            />
          ) : (
            <div className="w-full flex items-center justify-center text-5xl" style={{ height: '160px', background: 'linear-gradient(145deg, #FFF4E0 0%, #FFE4C0 100%)' }}>
              {CATEGORY_EMOJI[shop.category]}
            </div>
          )}

          {/* T 欄徽章 — 顯示 shop.badgeType 原始文字 */}
          <div className="absolute top-2.5 left-2">
            {(() => {
              const label = shop.badgeType || '特約店家';
              const { bg, shadow, icon } = getBadge(label);
              return (
                <span className="flex items-center gap-1 text-white font-bold rounded-full px-2.5 py-1"
                  style={{ background: bg, fontSize: '10px', boxShadow: `0 2px 6px ${shadow}` }}>
                  {icon}
                  {label}
                </span>
              );
            })()}
          </div>

          {/* 喜好標記 */}
          {isPreferred && (
            <div className="absolute bottom-2 left-2">
              <span className="text-xs font-bold text-white rounded-full px-2 py-0.5" style={{ background: '#FF7A45', fontSize: '10px' }}>
                ❤️ 你的菜
              </span>
            </div>
          )}
        </div>

        {/* ── 右側資訊 ── */}
        <div className="flex-1 p-3.5 flex flex-col gap-2" style={{ minHeight: '160px' }}>
          <div>
            {/* 店名 + 愛心 */}
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <h2 className="font-black text-stone-800 leading-snug" style={{ fontSize: '17px' }}>
                {shop.name}
              </h2>
              <div className="flex-shrink-0 w-7 h-7 flex items-center justify-center" style={{ color: isPreferred ? '#FF5B5B' : '#DDD' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill={isPreferred ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              </div>
            </div>

            {/* 距離 */}
            {(distanceKm != null || shop.walkMinutes != null) && (
              <p className="text-xs text-stone-400 mb-2">
                {distanceKm != null
                  ? `📍 ${formatDistance(distanceKm)}`
                  : `📍 步行 ${shop.walkMinutes} 分鐘`}
              </p>
            )}

            {/* 分類 tag（粉色膠囊） */}
            <span
              className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full mb-2"
              style={{ background: '#FFE8E8', color: '#FF5B5B', fontSize: '11px' }}
            >
              {CATEGORY_EMOJI[shop.category]} {shop.category}
              {shop.priceRange ? ` · ${shop.priceRange}` : ''}
            </span>
          </div>

          {/* 優惠資訊（淡黃色底） */}
          {shop.deal ? (
            <div className="rounded-xl px-2.5 py-2 flex items-start gap-1.5" style={{ background: '#FFFBEC' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="flex-shrink-0 mt-0.5">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" stroke="#FF7A45" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="7" y1="7" x2="7.01" y2="7" stroke="#FF7A45" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
              <div className="min-w-0">
                <span className="text-xs font-bold" style={{ color: '#FF7A45' }}>優惠資訊</span>
                <p className="text-stone-600 mt-0.5 line-clamp-2 whitespace-pre-line" style={{ fontSize: '11px' }}>{shop.deal}</p>
              </div>
            </div>
          ) : shop.description ? (
            <p className="text-stone-700 line-clamp-2 whitespace-pre-line" style={{ fontSize: '11px' }}>{shop.description}</p>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
