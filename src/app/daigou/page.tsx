'use client';
import { useAuth } from '@/components/AuthProvider';
import { createBrowserClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Profile } from '@/components/AuthProvider';

type Run = {
  id: string;
  creator_id: string;
  creator_name: string;
  shop_name: string;
  note: string | null;
  status: string;
  created_at: string;
  order_count: number;
};

export default function DaigouPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [runs, setRuns] = useState<Run[]>([]);
  const [fetching, setFetching] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    fetchRuns();
  }, [user]);

  async function fetchRuns() {
    const supabase = createBrowserClient();
    const { data } = await supabase
      .from('purchase_runs')
      .select('*, purchase_orders(count)')
      .eq('status', 'open')
      .order('created_at', { ascending: false });
    setRuns(
      (data ?? []).map((r) => ({
        ...r,
        order_count: (r.purchase_orders as { count: number }[])?.[0]?.count ?? 0,
      }))
    );
    setFetching(false);
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#FDEEDD' }}>
        <div className="animate-pulse text-2xl">🛍️</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: '#FDEEDD' }}>
      <div className="max-w-lg mx-auto px-4 pt-6">
        <h1 className="text-2xl font-black text-stone-800 mb-1">代購</h1>
        <p className="text-sm text-stone-400 mb-5">我幫你買，你幫我買</p>

        {/* 兩個主要入口 */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={() => setShowCreate(true)}
            className="bg-white rounded-3xl p-5 text-left active:scale-95 transition-all"
            style={{ boxShadow: '0 2px 14px rgba(0,0,0,0.07)' }}
          >
            <div className="text-2xl mb-2">🛍️</div>
            <div className="font-black text-stone-800 text-base">開啟代購</div>
            <div className="text-xs text-stone-400 mt-0.5">我要去買，有需要加入</div>
          </button>
          <button
            onClick={() => document.getElementById('runs-list')?.scrollIntoView({ behavior: 'smooth' })}
            className="bg-white rounded-3xl p-5 text-left active:scale-95 transition-all"
            style={{ boxShadow: '0 2px 14px rgba(0,0,0,0.07)' }}
          >
            <div className="text-2xl mb-2">🙋</div>
            <div className="font-black text-stone-800 text-base">加入代購</div>
            <div className="text-xs text-stone-400 mt-0.5">看看同事去哪買</div>
          </button>
        </div>

        {/* 建立代購表單 */}
        {showCreate && (
          <CreateRunForm
            profile={profile}
            onClose={() => setShowCreate(false)}
            onCreated={(id) => router.push(`/daigou/${id}`)}
          />
        )}

        {/* 進行中的代購 */}
        <div id="runs-list">
          <h2 className="text-sm font-bold text-stone-500 mb-3">
            進行中的代購（{fetching ? '…' : runs.length}）
          </h2>
          {fetching ? (
            <div className="text-center text-stone-300 py-8 text-sm">載入中…</div>
          ) : runs.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-4xl mb-3">🌙</div>
              <p className="text-stone-400 text-sm">目前沒有進行中的代購</p>
              <p className="text-stone-300 text-xs mt-1">按「開啟代購」發起一個吧</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {runs.map((run) => (
                <Link key={run.id} href={`/daigou/${run.id}`}>
                  <div
                    className="bg-white rounded-3xl px-4 py-4 active:scale-95 transition-all"
                    style={{ boxShadow: '0 2px 14px rgba(0,0,0,0.07)' }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-black text-stone-800">{run.shop_name}</span>
                      <span className="text-xs bg-green-50 text-green-500 px-2 py-0.5 rounded-full font-bold">
                        進行中
                      </span>
                    </div>
                    <div className="text-xs text-stone-400">
                      {run.creator_name} 發起 · {run.order_count} 人已加入
                    </div>
                    {run.note && (
                      <div className="text-xs text-stone-500 mt-1.5 bg-stone-50 rounded-xl px-3 py-1.5">
                        {run.note}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CreateRunForm({
  profile,
  onClose,
  onCreated,
}: {
  profile: Profile | null;
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const [shops, setShops] = useState<{ id: string; name: string }[]>([]);
  const [shopName, setShopName] = useState('');
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading'>('idle');

  useEffect(() => {
    fetch('/api/shops')
      .then((r) => r.json())
      .then((data) => setShops(data.map((s: { id: string; name: string }) => ({ id: s.id, name: s.name }))));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!shopName.trim()) return;
    setStatus('loading');
    const supabase = createBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from('purchase_runs')
      .insert({
        creator_id: user.id,
        creator_name: profile?.display_name ?? user.email ?? '匿名',
        shop_name: shopName.trim(),
        note: note.trim() || null,
      })
      .select('id')
      .single();
    if (!error && data) onCreated(data.id);
  }

  return (
    <div className="bg-white rounded-3xl p-5 mb-6" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
      <h2 className="font-black text-stone-800 mb-4">🛍️ 開啟代購</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div>
          <label className="text-xs font-bold text-stone-400 mb-1 block">店家名稱</label>
          <input
            list="shops-datalist"
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            placeholder="輸入或選擇店家"
            required
            className="w-full border-2 border-stone-100 rounded-2xl px-4 py-3 text-sm outline-none focus:border-orange-300"
          />
          <datalist id="shops-datalist">
            {shops.map((s) => (
              <option key={s.id} value={s.name} />
            ))}
          </datalist>
        </div>
        <div>
          <label className="text-xs font-bold text-stone-400 mb-1 block">備註（選填）</label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="例：預計 12:30 出發，12:45 回來"
            className="w-full border-2 border-stone-100 rounded-2xl px-4 py-3 text-sm outline-none focus:border-orange-300"
          />
        </div>
        <div className="flex gap-3 mt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl text-stone-400 text-sm font-semibold bg-stone-50"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={status === 'loading' || !shopName.trim()}
            className="flex-1 py-3 rounded-2xl text-white text-sm font-bold disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #FF7A45 0%, #FF5B5B 100%)' }}
          >
            {status === 'loading' ? '發起中…' : '發起代購'}
          </button>
        </div>
      </form>
    </div>
  );
}
