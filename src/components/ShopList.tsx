'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Shop, Category, ALL_CATEGORIES } from '@/lib/shops';
import { LatLng, haversineDistance, geocodeAddress, formatDistance } from '@/lib/geo';
import { loadPreferences, savePreferences, loadPreferAny, savePreferAny, MAX_PREFERENCES } from '@/lib/preferences';
import { CategoryIcon } from './CategoryIcon';
import ShopCard from './ShopCard';

const TinderMode = dynamic(() => import('./TinderMode'), { ssr: false });

const FILTER_LABELS = ['全部', ...ALL_CATEGORIES] as const;
type FilterLabel = (typeof FILTER_LABELS)[number];
type SortMode = 'default' | 'distance' | 'badge';

const BADGE_ORDER: Record<string, number> = { '特約店家': 1, '活動優惠': 2, '附近店家': 3 };
function badgePriority(b: string | undefined) { return BADGE_ORDER[b ?? ''] ?? 4; }

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

function sortShops(shops: Shop[], coords: LatLng | null, preferred: Category[], mode: SortMode): Shop[] {
  const withDist = shops.map((s) => ({
    shop: s,
    dist: coords && s.lat != null && s.lng != null
      ? haversineDistance(coords, { lat: s.lat, lng: s.lng })
      : null,
    isPreferred: preferred.includes(s.category),
  }));

  if (mode === 'distance' && coords) {
    return withDist
      .filter((m) => m.dist != null)
      .sort((a, b) => (a.dist ?? 0) - (b.dist ?? 0))
      .slice(0, 20)
      .map((m) => m.shop);
  }

  if (mode === 'badge' && coords) {
    return withDist
      .filter((m) => m.dist != null)
      .sort((a, b) => (a.dist ?? 0) - (b.dist ?? 0))
      .slice(0, 20)
      .sort((a, b) => badgePriority(a.shop.badgeType) - badgePriority(b.shop.badgeType))
      .map((m) => m.shop);
  }

  return withDist
    .sort((a, b) => {
      if (a.isPreferred !== b.isPreferred) return a.isPreferred ? -1 : 1;
      if (a.dist != null && b.dist != null) return a.dist - b.dist;
      return (a.shop.walkMinutes ?? 99) - (b.shop.walkMinutes ?? 99);
    })
    .map((m) => m.shop);
}

// ── 插畫：翻牌模式卡牌 ──────────────────────────────────────────
function PlayingCardsIllustration() {
  return (
    <svg width="88" height="88" viewBox="0 0 88 88" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Back card - rotated left */}
      <g transform="rotate(-14, 26, 52)">
        <rect x="2" y="18" width="47" height="62" rx="8" fill="white" opacity="0.82"/>
        <rect x="5" y="21" width="41" height="56" rx="6" fill="none" stroke="#FF5B5B" strokeWidth="1.2" opacity="0.3"/>
        <text x="25.5" y="54" textAnchor="middle" fontSize="22" fill="#FF5B5B" opacity="0.45" fontWeight="bold" fontFamily="Georgia, serif">?</text>
      </g>
      {/* Front card */}
      <rect x="30" y="5" width="52" height="70" rx="9" fill="white"/>
      {/* Plate circle */}
      <circle cx="56" cy="36" r="16" fill="#FFF0EB" stroke="#FF7A45" strokeWidth="1.6"/>
      {/* Fork tines */}
      <line x1="50" y1="28" x2="50" y2="33" stroke="#FF7A45" strokeWidth="1.6" strokeLinecap="round"/>
      <line x1="54" y1="28" x2="54" y2="33" stroke="#FF7A45" strokeWidth="1.6" strokeLinecap="round"/>
      <line x1="58" y1="28" x2="58" y2="33" stroke="#FF7A45" strokeWidth="1.6" strokeLinecap="round"/>
      {/* Fork base join */}
      <path d="M50 33 Q54 37 58 33 L58 44 Q54 46 50 44 Z" fill="#FF7A45"/>
      {/* Knife */}
      <line x1="64" y1="28" x2="64" y2="44" stroke="#FF7A45" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M64 28 Q68 30 68 34 Q68 37 64 37" fill="#FF7A45" stroke="none"/>
      {/* Card corner mark */}
      <text x="82" y="20" textAnchor="middle" fontSize="10" fill="#FF5B5B" fontWeight="700" fontFamily="Georgia, serif">?</text>
      {/* Star sparkles around */}
      <path d="M14,8 L15.2,12.2 L19.5,13 L15.2,13.8 L14,18 L12.8,13.8 L8.5,13 L12.8,12.2 Z" fill="white" opacity="0.8"/>
      <path d="M78,60 L79,62.8 L81.8,63.5 L79,64.2 L78,67 L77,64.2 L74.2,63.5 L77,62.8 Z" fill="white" opacity="0.6"/>
      <circle cx="18" cy="60" r="2.5" fill="white" opacity="0.55"/>
      <circle cx="82" cy="12" r="2" fill="white" opacity="0.6"/>
      <circle cx="6" cy="35" r="1.8" fill="white" opacity="0.45"/>
    </svg>
  );
}

// ── 插畫：幫我決定骰子 ──────────────────────────────────────────
function DiceIllustration() {
  return (
    <svg width="88" height="88" viewBox="0 0 88 88" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Top face */}
      <polygon points="44,8 76,26 44,44 12,26" fill="#FFE566"/>
      {/* Top face highlight */}
      <polygon points="44,8 60,17 44,26 28,17" fill="#FFF5A0" opacity="0.55"/>
      {/* Left face */}
      <polygon points="12,26 44,44 44,78 12,60" fill="#E49020"/>
      {/* Left face highlight */}
      <polygon points="12,26 28,35 28,52 12,43" fill="#F0A832" opacity="0.5"/>
      {/* Right face */}
      <polygon points="76,26 44,44 44,78 76,60" fill="#F5A828"/>
      {/* Edge highlights */}
      <polyline points="44,8 76,26 44,44 12,26 44,8" stroke="white" strokeWidth="1.2" opacity="0.45" fill="none"/>
      <line x1="44" y1="44" x2="44" y2="78" stroke="white" strokeWidth="1" opacity="0.28"/>
      <line x1="12" y1="26" x2="12" y2="60" stroke="white" strokeWidth="1" opacity="0.28"/>
      <line x1="76" y1="26" x2="76" y2="60" stroke="white" strokeWidth="1" opacity="0.28"/>
      {/* Top face dots (2) */}
      <circle cx="35" cy="25" r="3.5" fill="white" opacity="0.92"/>
      <circle cx="53" cy="29" r="3.5" fill="white" opacity="0.92"/>
      {/* Right face dots (3) */}
      <circle cx="62" cy="50" r="3" fill="#B07010" opacity="0.72"/>
      <circle cx="66" cy="58" r="3" fill="#B07010" opacity="0.72"/>
      <circle cx="62" cy="66" r="3" fill="#B07010" opacity="0.72"/>
      {/* Left face dot (1) */}
      <circle cx="28" cy="53" r="3" fill="#C88010" opacity="0.65"/>
      {/* Top edge shine */}
      <line x1="44" y1="8" x2="76" y2="26" stroke="white" strokeWidth="2.5" opacity="0.55" strokeLinecap="round"/>
      {/* Sparkles */}
      <path d="M10,14 L11.2,17.8 L15,18.5 L11.2,19.2 L10,23 L8.8,19.2 L5,18.5 L8.8,17.8 Z" fill="white" opacity="0.8"/>
      <path d="M80,56 L81,58.5 L83.5,59 L81,59.5 L80,62 L79,59.5 L76.5,59 L79,58.5 Z" fill="white" opacity="0.6"/>
      <circle cx="82" cy="16" r="2.5" fill="white" opacity="0.6"/>
      <circle cx="8" cy="62" r="2" fill="white" opacity="0.5"/>
      <circle cx="22" cy="10" r="1.5" fill="white" opacity="0.45"/>
    </svg>
  );
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

  const [tinderOpen, setTinderOpen] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>('default');
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPreferred(loadPreferences());
    setPreferAny(loadPreferAny());
  }, []);

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

  const categorised = activeCategory === '全部' ? shops : shops.filter((s) => s.category === activeCategory);
  const coords = location.status === 'set' ? location.coords : null;
  const sorted = sortShops(categorised, coords, preferAny ? [] : preferred, sortMode);

  function activateSortMode(mode: SortMode) {
    if (mode !== 'default' && location.status !== 'set') {
      setShowLocationPanel(true);
      return;
    }
    setSortMode(mode);
  }

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
      {/* ── 雙主功能卡 ── */}
      <div className="flex gap-3 mb-4">
        {/* 翻牌模式 */}
        <button
          onClick={() => setTinderOpen(true)}
          className="flex-1 relative rounded-[26px] overflow-hidden text-left active:scale-95 transition-transform duration-150"
          style={{
            boxShadow: '0 10px 28px rgba(255,91,91,0.48), 0 3px 8px rgba(255,91,91,0.28), inset 0 1px 0 rgba(255,255,255,0.35)',
          }}
        >
          {/* Gradient bg */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(145deg, #FF6B6B 0%, #FF5B5B 40%, #FF7A50 100%)' }}/>
          {/* Inner highlight */}
          <div className="absolute inset-x-0 top-0 h-14 pointer-events-none" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.22) 0%, transparent 100%)' }}/>
          {/* Content */}
          <div className="relative p-4">
            {/* Capsule label */}
            <span className="inline-block text-xs font-black px-3 py-1 rounded-full mb-2.5" style={{ background: '#FFE566', color: '#7A5800', fontSize: '11px' }}>
              一起來玩!
            </span>
            <h3 className="text-white font-black text-xl leading-none mb-1" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.15)' }}>
              翻牌模式
            </h3>
            <p className="text-xs mb-3" style={{ color: 'rgba(255,255,255,0.75)' }}>滑卡選出心儀<br/>餐廳</p>
            {/* Illustration + arrow */}
            <div className="flex items-end justify-between">
              <PlayingCardsIllustration />
              <span className="w-9 h-9 rounded-full bg-white flex items-center justify-center font-bold text-base flex-shrink-0 mb-1" style={{ color: '#FF5B5B', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
                →
              </span>
            </div>
          </div>
        </button>

        {/* 幫我決定 */}
        <button
          onClick={pickRandom}
          disabled={isRolling}
          className="flex-1 relative rounded-[26px] overflow-hidden text-left active:scale-95 transition-transform duration-150 disabled:opacity-85"
          style={{
            boxShadow: '0 10px 28px rgba(255,160,32,0.48), 0 3px 8px rgba(255,144,0,0.28), inset 0 1px 0 rgba(255,255,255,0.35)',
          }}
        >
          <div className="absolute inset-0" style={{ background: 'linear-gradient(145deg, #FFBE55 0%, #FFB030 40%, #FF9020 100%)' }}/>
          <div className="absolute inset-x-0 top-0 h-14 pointer-events-none" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.22) 0%, transparent 100%)' }}/>
          <div className="relative p-4">
            <span className="inline-block text-xs font-black px-3 py-1 rounded-full mb-2.5" style={{ background: 'rgba(255,255,255,0.35)', color: 'white', backdropFilter: 'blur(4px)', fontSize: '11px' }}>
              讓我幫你選!
            </span>
            <h3 className="text-white font-black text-xl leading-none mb-1" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.12)' }}>
              幫我決定
            </h3>
            <p className="text-xs mb-3" style={{ color: 'rgba(255,255,255,0.75)' }}>{isRolling ? '轉動中...' : '隨機推薦今日'}<br/>{isRolling ? '' : '午餐'}</p>
            <div className="flex items-end justify-between">
              <DiceIllustration />
              <span className="w-9 h-9 rounded-full bg-white flex items-center justify-center font-bold text-base flex-shrink-0 mb-1" style={{ color: '#FF9020', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
                {isRolling ? '⏳' : '→'}
              </span>
            </div>
          </div>
        </button>
      </div>

      {/* ── 老虎機結果 ── */}
      {(isRolling || luckyShop) && (
        <div className="mb-4">
          {isRolling ? (
            <div className="rounded-[20px] px-4 py-5 text-center" style={{ background: 'linear-gradient(145deg, #FFBE55 0%, #FF9020 100%)', boxShadow: '0 6px 20px rgba(255,144,32,0.35)' }}>
              <p className="text-white text-xs font-semibold mb-2 opacity-80">命運之輪正在轉動...</p>
              <div key={slotKey} className="animate-slot text-2xl font-black text-white truncate px-2">{rollingName}</div>
              <div className="flex justify-center gap-1 mt-3">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="w-2 h-2 rounded-full bg-white opacity-60 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          ) : luckyShop ? (
            <div className="rounded-[20px] px-4 py-5 text-center animate-fade-in-up" style={{ background: 'linear-gradient(145deg, #FFBE55 0%, #FF9020 100%)', boxShadow: '0 6px 20px rgba(255,144,32,0.35)' }}>
              <p className="text-white text-xs font-semibold mb-1 opacity-80">🎯 今天就吃這家！</p>
              <Link href={`/shop/${luckyShop.id}`} className="block text-2xl font-black text-white mb-1 underline decoration-white/50 active:opacity-70 transition-opacity">
                {luckyShop.name} ›
              </Link>
              <p className="text-orange-100 text-sm mb-3 whitespace-pre-line">{luckyShop.deal}</p>
              <button onClick={pickRandom} className="bg-white text-sm font-bold px-5 py-2 rounded-full active:scale-95 transition-transform duration-150" style={{ color: '#FF9020' }}>
                不滿意，再抽一次 🎲
              </button>
            </div>
          ) : null}
        </div>
      )}

      {/* ── 次要功能列 ── */}
      <div className="flex gap-3 mb-4">
        {/* 我的收藏 */}
        <button onClick={openPrefPanel} className="flex-1 bg-white rounded-[20px] px-3 py-3 flex items-center gap-2.5 active:scale-95 transition-transform duration-150" style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.07)' }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#FFF0F0' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#FF5B5B">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </div>
          <div className="flex-1 text-left min-w-0">
            <div className="font-bold text-stone-800 text-sm">我的收藏</div>
            <div className="text-stone-400 truncate" style={{ fontSize: '11px' }}>
              {preferAny ? '隨便都好 🎲' : preferred.length > 0 ? preferred.join('、') : '設定口味偏好'}
            </div>
          </div>
          <span className="text-stone-300 flex-shrink-0" style={{ fontSize: '18px' }}>›</span>
        </button>

        {/* 我在哪 */}
        <button onClick={() => setShowLocationPanel((v) => !v)} className="flex-1 bg-white rounded-[20px] px-3 py-3 flex items-center gap-2.5 active:scale-95 transition-transform duration-150" style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.07)' }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#F0FAF0' }}>
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" fill="#34C759"/>
              <circle cx="12" cy="10" r="3.5" fill="white"/>
            </svg>
          </div>
          <div className="flex-1 text-left min-w-0">
            <div className="font-bold text-stone-800 text-sm">我在哪</div>
            <div className="text-stone-400 truncate" style={{ fontSize: '11px' }}>
              {location.status === 'set' ? location.label : '定位獲取距離'}
            </div>
          </div>
          {location.status === 'set' ? (
            <button onClick={(e) => { e.stopPropagation(); setLocation({ status: 'none' }); }} className="text-stone-300 text-sm hover:text-red-400 transition-colors flex-shrink-0 p-1">✕</button>
          ) : (
            <span className="text-stone-300 flex-shrink-0" style={{ fontSize: '18px' }}>›</span>
          )}
        </button>
      </div>

      {/* ── 偏好面板 ── */}
      {showPrefPanel && (
        <div className="bg-white rounded-[24px] p-4 mb-4 animate-fade-in-up" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.09)' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-stone-700">你喜歡吃什麼？</p>
            {!draftAny && <span className="text-xs text-stone-400">已選 {draftPref.length}/{MAX_PREFERENCES}</span>}
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => { setDraftAny(true); setDraftPref([]); }}
              className="flex items-center gap-1 px-3 py-2 rounded-full text-sm font-semibold transition-all duration-150 active:scale-95"
              style={draftAny ? { background: '#FF7A45', color: 'white' } : { background: '#FFF0E8', color: '#FF7A45' }}
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
                  className="flex items-center gap-1 px-3 py-2 rounded-full text-sm font-semibold transition-all duration-150 active:scale-95"
                  style={
                    selected ? { background: '#FF7A45', color: 'white' }
                    : disabled ? { background: '#F0F0F0', color: '#CCC' }
                    : { background: '#FFF0E8', color: '#FF7A45' }
                  }
                >
                  <CategoryIcon category={cat} className="w-3.5 h-3.5"/>
                  <span>{cat}</span>
                </button>
              );
            })}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowPrefPanel(false)} className="flex-1 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-500 active:scale-95 transition-transform duration-150">取消</button>
            <button onClick={savePref} className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold active:scale-95 transition-transform duration-150" style={{ background: '#FF7A45' }}>儲存</button>
          </div>
        </div>
      )}

      {/* ── 定位面板 ── */}
      {showLocationPanel && (
        <div className="bg-white rounded-[24px] p-4 mb-4 flex flex-col gap-3 animate-fade-in-up" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.09)' }}>
          <button
            onClick={useGps}
            disabled={isLocLoading}
            className="w-full text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-transform duration-150 disabled:opacity-70"
            style={{ background: '#FF7A45' }}
          >
            {isLocLoading
              ? <><span className="animate-bounce">🍱</span><span className="text-sm">{gpsMsg}</span></>
              : <><span>📡</span><span>使用 GPS 定位（最準確）</span></>
            }
          </button>
          <div className="flex items-center gap-2 text-xs text-stone-400">
            <div className="flex-1 h-px bg-stone-100"/><span>或手動輸入地址</span><div className="flex-1 h-px bg-stone-100"/>
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
              className="text-white px-4 py-2 rounded-xl text-sm font-bold active:scale-95 transition-transform duration-150 disabled:opacity-40"
              style={{ background: '#FF7A45' }}
            >確認</button>
          </div>
          {location.status === 'error' && <p className="text-red-400 text-xs">{location.message}</p>}
        </div>
      )}

      {/* ── 分類篩選 ── */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 no-scrollbar">
        <button
          onClick={() => { setActiveCategory('全部'); setLuckyShop(null); }}
          className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all duration-150 active:scale-95"
          style={activeCategory === '全部'
            ? { background: '#FF7A45', color: 'white', boxShadow: '0 2px 8px rgba(255,122,69,0.35)' }
            : { background: 'white', color: '#666', border: '1.5px solid #EEE' }}
        >
          全部
        </button>
        {ALL_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => { setActiveCategory(cat); setLuckyShop(null); }}
            className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all duration-150 active:scale-95"
            style={activeCategory === cat
              ? { background: '#FF7A45', color: 'white', boxShadow: '0 2px 8px rgba(255,122,69,0.35)' }
              : { background: 'white', color: '#666', border: '1.5px solid #EEE' }}
          >
            <CategoryIcon category={cat} className="w-3.5 h-3.5 flex-shrink-0"/>
            <span>{cat}</span>
          </button>
        ))}
      </div>

      {/* ── 排序下拉 ── */}
      <div className="relative flex items-center justify-between mb-3">
        <span className="text-xs text-stone-400">{sorted.length} 家</span>
        <button
          onClick={() => setShowSortDropdown((v) => !v)}
          className="flex items-center gap-1 px-2 py-1 rounded-lg active:bg-stone-100 transition-colors"
        >
          <span className="text-xs font-semibold" style={{ color: sortMode !== 'default' ? '#FF7A45' : '#888' }}>
            {sortMode === 'distance' ? '📍 距離排序' : sortMode === 'badge' ? '🏷️ 店家屬性' : '排序'}
          </span>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={sortMode !== 'default' ? '#FF7A45' : '#AAA'} strokeWidth="2.5" strokeLinecap="round">
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </button>

        {showSortDropdown && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowSortDropdown(false)}/>
            <div className="absolute right-0 top-full mt-1 bg-white rounded-2xl z-20 overflow-hidden" style={{ minWidth: '160px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
              {([
                { mode: 'default'  as SortMode, label: '預設排序' },
                { mode: 'distance' as SortMode, label: '📍 距離排序' },
                { mode: 'badge'    as SortMode, label: '🏷️ 店家屬性' },
              ]).map(({ mode, label }) => (
                <button
                  key={mode}
                  onClick={() => { activateSortMode(mode); setShowSortDropdown(false); }}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold transition-colors active:bg-orange-50"
                  style={{ color: sortMode === mode ? '#FF7A45' : '#333', borderBottom: '1px solid #F5F5F5' }}
                >
                  <span>{label}</span>
                  {sortMode === mode && <span style={{ color: '#FF7A45' }}>✓</span>}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* 口味符合提示 */}
      {sortMode === 'default' && !preferAny && preferred.length > 0 && activeCategory === '全部' && sorted.some((s) => preferred.includes(s.category)) && (
        <p className="text-xs text-stone-400 mb-3 px-1">❤️ 你喜歡的口味排在前面</p>
      )}

      {/* ── 店家列表 ── */}
      <div className="flex flex-col gap-3 pb-4">
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

      {tinderOpen && <TinderMode shops={shops} onClose={() => setTinderOpen(false)} />}
    </div>
  );
}
