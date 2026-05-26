'use client';
import { useAuth } from '@/components/AuthProvider';
import { createBrowserClient } from '@/lib/supabase/client';
import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Profile } from '@/components/AuthProvider';

type Item = { name: string; price: string; qty: number };

type Order = {
  id: string;
  user_id: string;
  user_name: string;
  items: Item[];
  note: string | null;
  created_at: string;
};

type Run = {
  id: string;
  creator_id: string;
  creator_name: string;
  shop_name: string;
  note: string | null;
  status: string;
  created_at: string;
};

export default function RunDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [run, setRun] = useState<Run | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [fetching, setFetching] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [closing, setClosing] = useState(false);

  const myOrder = orders.find((o) => o.user_id === user?.id);
  const isCreator = run?.creator_id === user?.id;
  const totalAll = orders.reduce(
    (sum, o) => sum + o.items.reduce((s, i) => s + (parseFloat(i.price) || 0) * i.qty, 0),
    0
  );

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user, id]);

  async function fetchData() {
    const supabase = createBrowserClient();
    const [{ data: runData }, { data: ordersData }] = await Promise.all([
      supabase.from('purchase_runs').select('*').eq('id', id).single(),
      supabase.from('purchase_orders').select('*').eq('run_id', id).order('created_at'),
    ]);
    setRun(runData);
    setOrders((ordersData ?? []) as Order[]);
    setFetching(false);
  }

  async function closeRun() {
    if (!confirm('確定要結單嗎？結單後其他人無法再加入。')) return;
    setClosing(true);
    const supabase = createBrowserClient();
    await supabase.from('purchase_runs').update({ status: 'closed' }).eq('id', id);
    setRun((prev) => (prev ? { ...prev, status: 'closed' } : prev));
    setClosing(false);
  }

  if (loading || fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#FDEEDD' }}>
        <div className="animate-pulse text-2xl">🛍️</div>
      </div>
    );
  }

  if (!run) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3" style={{ background: '#FDEEDD' }}>
        <p className="text-stone-400">找不到此代購</p>
        <Link href="/daigou" className="text-orange-400 text-sm font-semibold">← 返回代購列表</Link>
      </div>
    );
  }

  const firstOtherOrder = orders.find((o) => o.user_id !== user?.id);

  return (
    <div className="min-h-screen pb-24" style={{ background: '#FDEEDD' }}>
      <div className="max-w-lg mx-auto px-4 pt-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <Link href="/daigou" className="text-stone-500 text-sm font-semibold active:opacity-60">
            ← 返回
          </Link>
          <div className="flex-1" />
          <span
            className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
              run.status === 'open' ? 'bg-green-50 text-green-500' : 'bg-stone-100 text-stone-400'
            }`}
          >
            {run.status === 'open' ? '進行中' : '已結單'}
          </span>
        </div>

        {/* Run 資訊卡 */}
        <div className="bg-white rounded-3xl px-5 py-4 mb-4" style={{ boxShadow: '0 2px 14px rgba(0,0,0,0.07)' }}>
          <h1 className="text-xl font-black text-stone-800">{run.shop_name}</h1>
          <p className="text-xs text-stone-400 mt-0.5">
            {run.creator_name} 發起 · {orders.length} 人已加入
            {totalAll > 0 && ` · 合計 $${totalAll.toFixed(0)}`}
          </p>
          {run.note && (
            <p className="text-sm text-stone-600 mt-2 bg-orange-50 rounded-2xl px-3 py-2">{run.note}</p>
          )}
        </div>

        {/* 我的訂單（已有） */}
        {myOrder && (
          <div
            className="rounded-3xl px-5 py-4 mb-4 border-2 border-orange-200"
            style={{ background: '#FFF7F2' }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-orange-600 text-sm">我的訂單</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-stone-400">
                  ${myOrder.items.reduce((s, i) => s + (parseFloat(i.price) || 0) * i.qty, 0).toFixed(0)}
                </span>
                {run.status === 'open' && (
                  <button
                    onClick={() => setShowForm(true)}
                    className="text-xs text-orange-400 font-bold bg-orange-100 px-2.5 py-1 rounded-xl active:bg-orange-200 transition-colors"
                  >
                    編輯
                  </button>
                )}
              </div>
            </div>
            <OrderItems items={myOrder.items} />
            {myOrder.note && (
              <p className="text-xs text-stone-400 mt-1.5">備註：{myOrder.note}</p>
            )}
          </div>
        )}

        {/* 加入按鈕 */}
        {!myOrder && run.status === 'open' && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="w-full py-4 rounded-3xl font-black text-white text-base mb-4 active:scale-95 transition-all"
            style={{
              background: 'linear-gradient(135deg, #FF7A45 0%, #FF5B5B 100%)',
              boxShadow: '0 4px 14px rgba(255,122,69,0.3)',
            }}
          >
            + 加入這個代購
          </button>
        )}

        {/* 填寫訂單表單 */}
        {showForm && run.status === 'open' && (
          <JoinForm
            runId={run.id}
            profile={profile}
            myOrder={myOrder}
            templateOrder={firstOtherOrder}
            onClose={() => setShowForm(false)}
            onSaved={() => {
              setShowForm(false);
              fetchData();
            }}
          />
        )}

        {/* 所有訂單列表 */}
        {orders.length > 0 && (
          <div className="mt-2">
            <h2 className="text-sm font-bold text-stone-500 mb-3">所有訂單</h2>
            <div className="flex flex-col gap-3">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-3xl px-5 py-4"
                  style={{ boxShadow: '0 2px 14px rgba(0,0,0,0.07)' }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-stone-700 text-sm">
                      {order.user_name}
                      {order.user_id === user?.id && (
                        <span className="text-orange-400 font-normal text-xs ml-1">（我）</span>
                      )}
                    </span>
                    <span className="text-xs text-stone-400 font-semibold">
                      ${order.items.reduce((s, i) => s + (parseFloat(i.price) || 0) * i.qty, 0).toFixed(0)}
                    </span>
                  </div>
                  <OrderItems items={order.items} />
                  {order.note && (
                    <p className="text-xs text-stone-400 mt-1.5">備註：{order.note}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 結單按鈕（代購人專屬） */}
        {isCreator && run.status === 'open' && (
          <button
            onClick={closeRun}
            disabled={closing}
            className="w-full py-4 rounded-3xl font-bold text-stone-500 text-sm mt-6 bg-stone-100 active:bg-stone-200 transition-colors disabled:opacity-50"
          >
            {closing ? '結單中…' : '✋ 結單'}
          </button>
        )}
      </div>
    </div>
  );
}

function OrderItems({ items }: { items: Item[] }) {
  return (
    <div className="flex flex-col gap-1">
      {items.map((item, i) => (
        <div key={i} className="flex items-center justify-between text-sm">
          <span className="text-stone-700">
            {item.name}
            {item.qty > 1 && <span className="text-stone-400 ml-1">×{item.qty}</span>}
          </span>
          <span className="text-stone-500">${((parseFloat(item.price) || 0) * item.qty).toFixed(0)}</span>
        </div>
      ))}
    </div>
  );
}

function JoinForm({
  runId,
  profile,
  myOrder,
  templateOrder,
  onClose,
  onSaved,
}: {
  runId: string;
  profile: Profile | null;
  myOrder?: Order;
  templateOrder?: Order;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [items, setItems] = useState<Item[]>(
    myOrder?.items ?? [{ name: '', price: '', qty: 1 }]
  );
  const [note, setNote] = useState(myOrder?.note ?? '');
  const [status, setStatus] = useState<'idle' | 'loading'>('idle');

  function copyTemplate() {
    if (!templateOrder) return;
    setItems(templateOrder.items.map((i) => ({ ...i })));
    setNote(templateOrder.note ?? '');
  }

  function addItem() {
    setItems((prev) => [...prev, { name: '', price: '', qty: 1 }]);
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateItem(idx: number, field: keyof Item, value: string | number) {
    setItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validItems = items.filter((i) => i.name.trim());
    if (validItems.length === 0) return;
    setStatus('loading');
    const supabase = createBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (myOrder) {
      await supabase
        .from('purchase_orders')
        .update({ items: validItems, note: note.trim() || null })
        .eq('id', myOrder.id);
    } else {
      await supabase.from('purchase_orders').insert({
        run_id: runId,
        user_id: user.id,
        user_name: profile?.display_name ?? user.email ?? '匿名',
        items: validItems,
        note: note.trim() || null,
      });
    }
    onSaved();
  }

  const total = items.reduce((s, i) => s + (parseFloat(i.price) || 0) * i.qty, 0);

  return (
    <div className="bg-white rounded-3xl p-5 mb-4" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-black text-stone-800">{myOrder ? '編輯訂單' : '填寫訂單'}</h2>
        {templateOrder && !myOrder && (
          <button
            type="button"
            onClick={copyTemplate}
            className="text-xs text-orange-500 font-bold bg-orange-50 px-3 py-1.5 rounded-xl active:bg-orange-100 transition-colors"
          >
            複製前人
          </button>
        )}
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {/* 品項列表 */}
        <div className="flex flex-col gap-2">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                value={item.name}
                onChange={(e) => updateItem(idx, 'name', e.target.value)}
                placeholder="品項名稱"
                className="flex-1 border-2 border-stone-100 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-orange-300"
              />
              {/* 數量 */}
              <div className="flex items-center border-2 border-stone-100 rounded-xl overflow-hidden flex-shrink-0">
                <button
                  type="button"
                  onClick={() => updateItem(idx, 'qty', Math.max(1, item.qty - 1))}
                  className="px-2.5 py-2 text-stone-400 font-bold text-base leading-none"
                >
                  −
                </button>
                <span className="text-sm font-bold text-stone-700 w-4 text-center">{item.qty}</span>
                <button
                  type="button"
                  onClick={() => updateItem(idx, 'qty', item.qty + 1)}
                  className="px-2.5 py-2 text-stone-400 font-bold text-base leading-none"
                >
                  +
                </button>
              </div>
              {/* 價格 */}
              <div className="relative flex-shrink-0">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 text-sm">$</span>
                <input
                  type="number"
                  value={item.price}
                  onChange={(e) => updateItem(idx, 'price', e.target.value)}
                  placeholder="0"
                  min="0"
                  className="w-16 border-2 border-stone-100 rounded-xl pl-5 pr-2 py-2.5 text-sm outline-none focus:border-orange-300"
                />
              </div>
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  className="text-stone-300 font-bold text-xl leading-none flex-shrink-0"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addItem}
          className="text-sm text-orange-400 font-semibold text-left px-1 active:opacity-60"
        >
          + 新增品項
        </button>

        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="備註（例：不要香菜、加辣）"
          className="w-full border-2 border-stone-100 rounded-2xl px-4 py-3 text-sm outline-none focus:border-orange-300"
        />

        {total > 0 && (
          <div className="text-right text-sm font-bold text-stone-600">
            合計：${total.toFixed(0)}
          </div>
        )}

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
            disabled={status === 'loading'}
            className="flex-1 py-3 rounded-2xl text-white text-sm font-bold disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #FF7A45 0%, #FF5B5B 100%)' }}
          >
            {status === 'loading' ? '送出中…' : myOrder ? '更新訂單' : '確認加入'}
          </button>
        </div>
      </form>
    </div>
  );
}
