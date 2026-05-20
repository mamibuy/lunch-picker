import { fetchShopById, fetchShops } from '@/lib/fetchShops';
import { CATEGORY_EMOJI } from '@/lib/shops';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import NavigateButton from '@/components/NavigateButton';
import PhotoGallery from '@/components/PhotoGallery';

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
    <div className="min-h-screen bg-orange-50">
      {/* 頂部返回列 */}
      <div className="sticky top-0 z-10 px-4 py-3 flex items-center gap-2 bg-orange-100">
        <Link href="/" className="flex items-center gap-1 font-semibold text-sm text-stone-700 active:opacity-70 transition-opacity">
          ← 返回列表
        </Link>
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

        {/* 特約內容 */}
        <div className="bg-orange-500 text-white rounded-3xl p-4 mb-5 shadow-sm shadow-orange-900/20">
          <div className="text-xs font-bold opacity-75 mb-1 tracking-wider">✨ 員工特約優惠</div>
          <div className="text-lg font-black leading-snug">{shop.deal}</div>
        </div>

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
