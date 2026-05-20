'use client';

import { useRef, useState } from 'react';

export default function PhotoGallery({ photos, name }: { photos: string[]; name: string }) {
  const [current, setCurrent] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  if (photos.length === 0) return null;

  if (photos.length === 1) {
    return <img src={photos[0]} alt={name} className="w-full h-56 object-cover" />;
  }

  function scrollTo(index: number) {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: el.clientWidth * index, behavior: 'smooth' });
    setCurrent(index);
  }

  return (
    <div className="relative group">
      <div
        ref={scrollRef}
        className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar"
        onScroll={(e) => {
          const el = e.currentTarget;
          setCurrent(Math.round(el.scrollLeft / el.clientWidth));
        }}
      >
        {photos.map((url, i) => (
          <img
            key={i}
            src={url}
            alt={`${name} 照片 ${i + 1}`}
            className="min-w-full h-56 object-cover flex-shrink-0 snap-center"
            loading={i === 0 ? 'eager' : 'lazy'}
          />
        ))}
      </div>

      {/* 頁碼點點 */}
      <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 pointer-events-none">
        {photos.map((_, i) => (
          <span
            key={i}
            className={`rounded-full transition-all duration-200 ${
              i === current
                ? 'w-3 h-1.5 bg-white'
                : 'w-1.5 h-1.5 bg-white/50'
            }`}
          />
        ))}
      </div>

      {/* 張數提示 */}
      <div className="absolute top-2 right-2 bg-black/40 text-white text-xs px-2 py-0.5 rounded-full">
        {current + 1} / {photos.length}
      </div>

      {/* 左箭頭 */}
      {current > 0 && (
        <button
          onClick={() => scrollTo(current - 1)}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/30 text-white text-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/50"
        >
          ‹
        </button>
      )}

      {/* 右箭頭 */}
      {current < photos.length - 1 && (
        <button
          onClick={() => scrollTo(current + 1)}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/30 text-white text-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/50"
        >
          ›
        </button>
      )}
    </div>
  );
}
