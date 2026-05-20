'use client';
import { useState, useEffect } from 'react';

const FAV_KEY = 'lp-fav-shops';

export function getFavIds(): string[] {
  try { return JSON.parse(localStorage.getItem(FAV_KEY) ?? '[]'); } catch { return []; }
}

export function setFavIds(ids: string[]) {
  try { localStorage.setItem(FAV_KEY, JSON.stringify(ids)); } catch {}
}

export default function FavButton({ shopId }: { shopId: string }) {
  const [isFav, setIsFav] = useState(false);

  useEffect(() => {
    setIsFav(getFavIds().includes(shopId));
  }, [shopId]);

  function toggle() {
    const ids = getFavIds();
    const next = ids.includes(shopId) ? ids.filter(id => id !== shopId) : [...ids, shopId];
    setFavIds(next);
    setIsFav(next.includes(shopId));
  }

  return (
    <button
      onClick={toggle}
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
