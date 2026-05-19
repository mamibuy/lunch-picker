'use client';

import { useState } from 'react';
import { Shop } from '@/lib/shops';
import dynamic from 'next/dynamic';

const TinderMode = dynamic(() => import('./TinderMode'), { ssr: false });

export default function TinderButton({ shops }: { shops: Shop[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full mb-4 bg-white border-2 border-dashed border-orange-300 text-orange-500 font-bold py-3.5 rounded-3xl flex items-center justify-center gap-2 text-sm active:scale-95 transition-transform duration-150 hover:bg-orange-50"
      >
        <span>🃏</span>
        <span>翻牌模式，不要再暈船了，來暈碳吧</span>
      </button>

      {open && <TinderMode shops={shops} onClose={() => setOpen(false)} />}
    </>
  );
}
