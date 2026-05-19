'use client';

import { Shop } from '@/lib/shops';

type Props = {
  shop: Pick<Shop, 'address' | 'lat' | 'lng'>;
};

export default function NavigateButton({ shop }: Props) {
  function openMaps(userLat?: number, userLng?: number) {
    const dest = (shop.lat && shop.lng)
      ? `${shop.lat},${shop.lng}`
      : encodeURIComponent(shop.address);

    const origin = (userLat != null && userLng != null)
      ? `${userLat},${userLng}`
      : '';

    window.open(`https://www.google.com/maps/dir/${origin}/${dest}`, '_blank');
  }

  function handleClick() {
    if (!navigator.geolocation) {
      openMaps();
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => openMaps(pos.coords.latitude, pos.coords.longitude),
      ()    => openMaps(),
      { timeout: 5000 },
    );
  }

  return (
    <button
      onClick={handleClick}
      className="w-full flex items-center gap-3 px-4 py-4 active:bg-orange-50 transition-colors text-left"
    >
      <span className="text-xl">📍</span>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-stone-400 mb-0.5">地址（點此導航）</div>
        <div className="text-sm text-stone-700">{shop.address}</div>
      </div>
      <span className="text-stone-300 text-lg">›</span>
    </button>
  );
}
