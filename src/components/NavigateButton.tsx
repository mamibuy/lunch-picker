import { Shop } from '@/lib/shops';

type Props = {
  shop: Pick<Shop, 'address'>;
};

export default function NavigateButton({ shop }: Props) {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(shop.address)}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="w-full flex items-center gap-3 px-4 py-4 active:bg-orange-50 transition-colors text-left"
    >
      <span className="text-xl">📍</span>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-stone-400 mb-0.5">地址（點此導航）</div>
        <div className="text-sm text-stone-700">{shop.address}</div>
      </div>
      <span className="text-stone-300 text-lg">›</span>
    </a>
  );
}
