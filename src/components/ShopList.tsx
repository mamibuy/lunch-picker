'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Shop, Category, ALL_CATEGORIES, CATEGORY_EMOJI } from '@/lib/shops';
import { LatLng, haversineDistance, geocodeAddress, formatDistance } from '@/lib/geo';
import { loadPreferences, savePreferences, loadPreferAny, savePreferAny, MAX_PREFERENCES } from '@/lib/preferences';
import ShopCard from './ShopCard';

const FILTER_LABELS = ['全部', ...ALL_CATEGORIES] as const;
type FilterLabel = (typeof FILTER_LABELS)[number];

type LocationState =
  | { status: 'none' }
  | { status: 'loading' }
  | { status: 'set'; coords: LatLng; label: string }
  | { status: 'error'; message: string };

const GPS_LOADING_MSGS = [
  '正在通靈附近的便當店...',
  '詢問衛星你在哪裡覓食...',
  '計算步行幾步會餓昏...',
];

function sortShops(shops: Shop[], coords: LatLng | null, preferred: Category[]): Shop[] {
  return [...shops]
    .map((s) => ({
      shop: s,
      dist: coords && s.lat != null && s.lng != null
        ? haversineDistance(coords, { lat: s.lat, lng: s.lng })
        : null,
      isPreferred: preferred.includes(s.category),
    }))
    .sort((a, b) => {
      if (a.isPreferred !== b.isPreferred) return a.isPreferred ? -1 : 1;
      if (a.dist != null && b.dist != null) return a.dist - b.dist;
      return (a.shop.walkMinutes ?? 99) - (b.shop.walkMinutes ?? 99);
    })
    .map((m) => m.shop);
}

export default function ShopList({ shops }: { shops: Shop[] }) {
  const [activeCategory, setActiveCategory] = useState<FilterLabel>('全部');
  const [luckyShop, setLuckyShop] = useState<Shop | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [rollingName, setRollingName] = useState('');
  const [slotKey, setSlotKey] = useState(0);

  const [location, setLocation] = useState<LocationState>({ status: 'none' });
  const [showLocationPanel, setShowLocationPanel] = useState(false);
  const [addressInput, setAddressInput] = useState('');
  const [gpsMsg, setGpsMsg] = useState(GPS_LOADING_MSGS[0]);

  const [preferred, setPreferred] = useState<Category[]>([]);
  const [preferAny, setPreferAny] = useState(false);
  const [showPrefPanel, setShowPrefPanel] = useState(false);
  const [draftPref, setDraftPref] = useState<Category[]>([]);
  const [draftAny, setDraftAny] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPreferred(loadPreferences());
    setPreferAny(loadPreferAny());
  }, []);

  // ── 偏好 ────────────────────────────────────────────────────
  function openPrefPanel() {
    setDraftPref(preferred);
    setDraftAny(preferAny);
    setShowPrefPanel(true);
  }

  function toggleDraft(cat: Category) {
    setDraftPref((prev) =>
      prev.includes(cat)
        ? prev.filter((c) => c !== cat)
        : prev.length >= MAX_PREFERENCES ? prev : [...prev, cat],
    );
  }

  function savePref() {
    savePreferences(draftAny ? [] : draftPref);
    savePreferAny(draftAny);
    setPreferred(draftAny ? [] : draftPref);
    setPreferAny(draftAny);
    setShowPrefPanel(false);
  }

  // ── 排序（「隨便」時不做偏好加權）──────────────────────────────
  const categorised = activeCategory === '全部' ? shops : shops.filter((s) => s.category === activeCategory);
  const coords = location.status === 'set' ? location.coords : null;
  const sorted = sortShops(categorised, coords, preferAny ? [] : preferred);

  // ── 老虎機 ──────────────────────────────────────────────────
  function pickRandom() {
    if (isRolling) return;
    const base = sorted.length > 0 ? sorted : shops;
    const preferredPool = (!preferAny && preferred.length > 0) ? base.filter((s) => preferred.includes(s.category)) : [];
    const pool = preferredPool.length > 0 ? preferredPool : base;
    const winner = pool[Math.floor(Math.random() * pool.length)];

    setLuckyShop(null);
    setIsRolling(true);

    let count = 0;
    const total = 14;
    const interval = setInterval(() => {
      const rnd = pool[Math.floor(Math.random() * pool.length)];
      setRollingName(rnd.name);
      setSlotKey((k) => k + 1);
      count++;
      if (count >= total) {
        clearInterval(interval);
        setRollingName(winner.name);
        setSlotKey((k) => k + 1);
        setTimeout(() => { setIsRolling(false); setLuckyShop(winner); }, 200);
      }
    }, 110);
  }

  // ── GPS ─────────────────────────────────────────────────────
  function useGps() {
    setLocation({ status: 'loading' });
    let msgIdx = 0;
    const msgTimer = setInterval(() => {
      msgIdx = (msgIdx + 1) % GPS_LOADING_MSGS.length;
      setGpsMsg(GPS_LOADING_MSGS[msgIdx]);
    }, 1200);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearInterval(msgTimer);
        setLocation({ status: 'set', coords: { lat: pos.coords.latitude, lng: pos.coords.longitude }, label: '目前位置' });
        setShowLocationPanel(false);
      },
      () => {
        clearInterval(msgTimer);
        setLocation({ status: 'error', message: '無法取得 GPS，請確認已允許定位權限' });
      },
    );
  }

  async function useAddress() {
    const addr = addressInput.trim();
    if (!addr) return;
    setLocation({ status: 'loading' });
    setGpsMsg('查詢地址中，請稍候...');
    try {
      const c = await geocodeAddress(addr);
      setLocation({ status: 'set', coords: c, label: addr });
      setShowLocationPanel(false);
      setAddressInput('');
    } catch (e) {
      setLocation({ status: 'error', message: e instanceof Error ? e.message : '地址查詢失敗，請再試一次' });
    }
  }

  const isLocLoading = location.status === 'loading';

  return (
    <div>
      {/* ── 我的菜 ＆ 我在哪（並排） ── */}
      <div className="flex gap-3 mb-3">
        {/* 我的菜 */}
        {(preferred.length > 0 || preferAny) ? (
          <div className="relative flex-1 flex items-center justify-center bg-white rounded-2xl px-3 py-3 shadow-sm shadow-orange-900/10">
            <span className="text-sm text-stone-600 font-medium">
              {preferAny ? '🎲 隨便' : preferred.map((c) => CATEGORY_EMOJI[c]).join(' ')}
            </span>
            <button onClick={openPrefPanel} className="absolute right-3 text-xs text-stone-400 hover:text-orange-500 transition-colors">
              編輯
            </button>
          </div>
        ) : (
          <button
            onClick={openPrefPanel}
            className="flex-1 flex items-center justify-center gap-1.5 bg-white rounded-2xl px-3 py-3 shadow-sm shadow-orange-900/10 text-sm text-stone-600 font-medium active:scale-95 transition-transform duration-150"
          >
            <span>❤️</span><span>我的菜</span>
          </button>
        )}

        {/* 我在哪 */}
        {location.status === 'set' ? (
          <div className="flex-1 flex items-center justify-between bg-white rounded-2xl px-3 py-3 shadow-sm shadow-orange-900/10 min-w-0">
            <div className="flex items-center gap-1.5 text-xs text-stone-700 min-w-0 font-medium">
              <span>📍</span>
              <span className="truncate">{location.label}</span>
            </div>
            <button onClick={() => setLocation({ status: 'none' })} className="text-xs text-stone-400 ml-1 flex-shrink-0 hover:text-orange-500 transition-colors">✕</button>
          </div>
        ) : (
          <button
            onClick={() => setShowLocationPanel((v) => !v)}
            className="flex-1 flex items-center justify-center gap-1.5 bg-white rounded-2xl px-3 py-3 shadow-sm shadow-orange-900/10 text-sm text-stone-600 font-medium active:scale-95 transition-transform duration-150"
          >
            <span>📍</span><span>我在哪</span>
          </button>
        )}
      </div>

      {/* 展開的面板（各自獨立） */}
      <div className="mb-4">
        {showPrefPanel && (
          <div className="bg-white rounded-3xl shadow-sm shadow-orange-900/10 p-4 animate-fade-in-up mb-3">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-stone-700">你喜歡吃什麼？</p>
              {!draftAny && <span className="text-xs text-stone-400">已選 {draftPref.length}/{MAX_PREFERENCES}</span>}
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {/* 隨便選項 */}
              <button
                onClick={() => { setDraftAny(true); setDraftPref([]); }}
                className={`flex items-center gap-1 px-3 py-2 rounded-full text-sm font-medium transition-all duration-150 active:scale-95 ${
                  draftAny ? 'bg-orange-500 text-white shadow-sm' : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
                }`}
              >
                <span>🎲</span><span>隨便</span>
              </button>

              {ALL_CATEGORIES.map((cat) => {
                const selected = !draftAny && draftPref.includes(cat);
                const disabled = draftAny || (!selected && draftPref.length >= MAX_PREFERENCES);
                return (
                  <button
                    key={cat}
                    onClick={() => { setDraftAny(false); toggleDraft(cat); }}
                    disabled={disabled}
                    className={`flex items-center gap-1 px-3 py-2 rounded-full text-sm font-medium transition-all duration-150 active:scale-95 ${
                      selected ? 'bg-orange-500 text-white shadow-sm'
                      : disabled ? 'bg-stone-100 text-stone-300 cursor-not-allowed'
                      : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
                    }`}
                  >
                    <span>{CATEGORY_EMOJI[cat]}</span><span>{cat}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowPrefPanel(false)} className="flex-1 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-500 active:scale-95 transition-transform duration-150">取消</button>
              <button onClick={savePref} className="flex-1 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-bold active:scale-95 transition-transform duration-150">儲存</button>
            </div>
          </div>
        )}

        {showLocationPanel && (
          <div className="mt-2 bg-white rounded-3xl shadow-sm shadow-orange-900/10 p-4 flex flex-col gap-3 animate-fade-in-up">
            <button
              onClick={useGps}
              disabled={isLocLoading}
              className="w-full bg-orange-500 text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-transform duration-150 disabled:opacity-70"
            >
              {isLocLoading
                ? <><span className="animate-bounce">🍱</span><span className="text-sm">{gpsMsg}</span></>
                : <><span>📡</span><span>使用 GPS 定位（最準確）</span></>
              }
            </button>
            <div className="flex items-center gap-2 text-xs text-stone-400">
              <div className="flex-1 h-px bg-stone-100" /><span>或手動輸入地址</span><div className="flex-1 h-px bg-stone-100" />
            </div>
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={addressInput}
                onChange={(e) => setAddressInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && useAddress()}
                placeholder="例：台北市信義區信義路五段7號"
                disabled={isLocLoading}
                className="flex-1 border border-stone-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400 disabled:opacity-60"
              />
              <button
                onClick={useAddress}
                disabled={isLocLoading || !addressInput.trim()}
                className="bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-bold active:scale-95 transition-transform duration-150 disabled:opacity-40"
              >確認</button>
            </div>
            {location.status === 'error' && <p className="text-red-400 text-xs">{location.message}</p>}
          </div>
        )}
      </div>

      {/* ── 分類篩選 ── */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 no-scrollbar">
        {FILTER_LABELS.map((label) => (
          <button
            key={label}
            onClick={() => { setActiveCategory(label); setLuckyShop(null); }}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-150 active:scale-95 ${
              activeCategory === label
                ? 'bg-orange-500 text-white shadow-sm'
                : 'bg-white text-orange-700 border border-orange-200 hover:border-orange-400'
            }`}
          >
            {label !== '全部' && <span className="mr-1">{CATEGORY_EMOJI[label as Category]}</span>}
            {label}
          </button>
        ))}
      </div>

      {/* ── 老虎機 / 幸運店家 ── */}
      <div className="mb-5">
        {isRolling ? (
          <div className="bg-orange-500 rounded-3xl px-4 py-5 text-center shadow-sm shadow-orange-900/10">
            <p className="text-white text-xs font-semibold mb-2 opacity-80">命運之輪正在轉動...</p>
            <div key={slotKey} className="animate-slot text-2xl font-black text-white truncate px-2">
              {rollingName}
            </div>
            <div className="flex justify-center gap-1 mt-3">
              {[0,1,2].map((i) => (
                <span key={i} className="w-2 h-2 rounded-full bg-white opacity-60 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        ) : luckyShop ? (
          <div className="bg-orange-500 rounded-3xl px-4 py-5 text-center shadow-sm shadow-orange-900/10 animate-fade-in-up">
            <p className="text-white text-xs font-semibold mb-1 opacity-80">🎯 今天就吃這家！</p>
            <Link
              href={`/shop/${luckyShop.id}`}
              className="block text-2xl font-black text-white mb-1 underline decoration-white/50 active:opacity-70 transition-opacity"
            >
              {luckyShop.name} ›
            </Link>
            <p className="text-orange-100 text-sm mb-3">{luckyShop.deal}</p>
            <button
              onClick={pickRandom}
              className="bg-white text-orange-500 text-sm font-bold px-5 py-2 rounded-full active:scale-95 transition-transform duration-150"
            >
              不滿意，再抽一次 🎲
            </button>
          </div>
        ) : (
          <button
            onClick={pickRandom}
            className="w-full bg-orange-500 text-white font-black py-4 rounded-3xl text-lg flex items-center justify-center gap-2 active:scale-95 transition-transform duration-150 shadow-sm shadow-orange-900/10"
          >
            <span>🎲</span><span>幫我決定！</span>
          </button>
        )}
      </div>

      {/* 口味符合提示 */}
      {!preferAny && preferred.length > 0 && activeCategory === '全部' && sorted.some((s) => preferred.includes(s.category)) && (
        <p className="text-xs text-stone-400 mb-3 px-1">❤️ 你喜歡的口味排在前面</p>
      )}

      {/* ── 店家列表 ── */}
      <div className="flex flex-col gap-4">
        {sorted.map((shop, i) => {
          const dist = coords && shop.lat != null && shop.lng != null
            ? haversineDistance(coords, { lat: shop.lat, lng: shop.lng })
            : null;
          return (
            <ShopCard key={shop.id} shop={shop} distanceKm={dist} isPreferred={preferred.includes(shop.category)} index={i} />
          );
        })}
        {sorted.length === 0 && (
          <div className="text-center text-stone-400 py-16 text-sm">這個分類還沒有特約店家 🍽️</div>
        )}
      </div>
    </div>
  );
}
