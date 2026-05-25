'use client';
import { useAuth } from './AuthProvider';

export default function FavButton({ shopId }: { shopId: string }) {
  const { favIds, toggleFav } = useAuth();
  const isFav = favIds.includes(shopId);

  return (
    <button
      onClick={() => toggleFav(shopId)}
      className="w-10 h-10 flex items-center justify-center rounded-full active:scale-90 transition-transform duration-150"
      style={{ background: isFav ? '#FFF0F0' : '#F0F0F0' }}
      aria-label={isFav ? '取消收藏' : '加入收藏'}
    >
      <svg width="22" height="22" viewBox="0 0 24 24"
        fill={isFav ? '#FF5B5B' : 'none'}
        stroke={isFav ? '#FF5B5B' : '#AAA'}
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    </button>
  );
}
