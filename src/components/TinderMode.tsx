'use client';

import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import {
  motion,
  useMotionValue,
  useTransform,
  animate as fmAnimate,
  type PanInfo,
} from 'framer-motion';
import { Shop, CATEGORY_EMOJI } from '@/lib/shops';

// ── 設定 ─────────────────────────────────────────────────────────────────────
const SWIPE_THRESHOLD = 75;
const SWIPE_OUT_X = 650;
const MAX_LIKED = 3;

// ── 幽默副標題 ─────────────────────────────────────────────────────────────────
const SUBTITLES: Record<string, string[]> = {
  便當:   ['罪惡感滿滿的好味道', '份量多到後悔', '媽媽愛心便當的完美替代'],
  中餐:   ['下飯到碗都舔乾淨', '阿嬤的古早味傳承'],
  麵食:   ['湯頭喝完再加水', '一碗吃不飽那就兩碗'],
  飲料:   ['熱量？什麼熱量', '快樂水補充站', '大杯才不虧'],
  早午餐: ['假裝自己在咖啡廳', '每天都是週末感'],
  異國料理:['環遊世界不如外帶上班', '老闆說這才是道地'],
  火鍋:   ['吃到爆才划算', '一個人吃火鍋也很快樂'],
  素食:   ['今天是好人', '吃了可以少一條業障'],
  燒肉:   ['香氣飄到隔壁部門', '烤肉配飲料，人生無憾'],
  健康餐: ['假裝自己有在自律', '吃了下午不用躺'],
  其他:   ['神秘料理，吃了再說', '勇者才敢點的選擇'],
};

function getSubtitle(shop: Shop) {
  const pool = SUBTITLES[shop.category] ?? ['吃就對了'];
  const n = shop.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return pool[n % pool.length];
}

// ── 紙花 ──────────────────────────────────────────────────────────────────────
function Confetti() {
  const items = Array.from({ length: 28 }, (_, i) => ({
    id: i,
    emoji: ['🎉', '🍱', '🍜', '🎊', '✨', '🍔', '🥳', '🎈'][i % 8],
    left: `${(i / 28) * 98 + 1}%`,
    delay: i * 0.055,
    dur: 1.3 + (i % 5) * 0.15,
  }));
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {items.map((p) => (
        <motion.span
          key={p.id}
          className="absolute bottom-0 text-2xl"
          style={{ left: p.left }}
          initial={{ y: 0, opacity: 1, scale: 0.5 }}
          animate={{ y: '-110vh', opacity: [1, 1, 0], scale: [0.5, 1.4, 1] }}
          transition={{ duration: p.dur, delay: p.delay, ease: 'easeOut' }}
        >
          {p.emoji}
        </motion.span>
      ))}
    </div>
  );
}

// ── 單張卡片 ──────────────────────────────────────────────────────────────────
type CardHandle = { swipe: (dir: 'left' | 'right') => void };

const SwipeCard = forwardRef<CardHandle, {
  shop: Shop;
  onSwipe: (dir: 'left' | 'right') => void;
  stackIndex: number;
}>(({ shop, onSwipe, stackIndex }, ref) => {
  const x = useMotionValue(0);
  const rotate   = useTransform(x, [-260, 0, 260], [-22, 0, 22]);
  const likeOp   = useTransform(x, [30, 90],  [0, 1]);
  const nopeOp   = useTransform(x, [-30, -90], [0, 1]);
  const isTop    = stackIndex === 0;

  async function triggerSwipe(dir: 'left' | 'right') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (fmAnimate as any)(x, dir === 'right' ? SWIPE_OUT_X : -SWIPE_OUT_X, { duration: 0.32, ease: 'easeIn' });
    onSwipe(dir);
  }

  useImperativeHandle(ref, () => ({ swipe: triggerSwipe }));

  function onDragEnd(_: unknown, info: PanInfo) {
    if (info.velocity.x > 400 || info.offset.x > SWIPE_THRESHOLD) {
      triggerSwipe('right');
    } else if (info.velocity.x < -400 || info.offset.x < -SWIPE_THRESHOLD) {
      triggerSwipe('left');
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (fmAnimate as any)(x, 0, { type: 'spring', stiffness: 380, damping: 28 });
    }
  }

  if (!isTop) {
    return (
      <motion.div
        className="absolute inset-0 bg-white rounded-3xl shadow-lg shadow-orange-900/10 pointer-events-none"
        style={{ scale: 1 - stackIndex * 0.045, y: stackIndex * 14, zIndex: 10 - stackIndex }}
      />
    );
  }

  return (
    <motion.div
      style={{ x, rotate, zIndex: 20 }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.75}
      onDragEnd={onDragEnd}
      className="absolute inset-0 bg-white rounded-3xl shadow-xl shadow-orange-900/15 cursor-grab active:cursor-grabbing select-none overflow-hidden"
      whileTap={{ scale: 1.02 }}
    >
      {/* 想吃 標籤 */}
      <motion.div
        style={{ opacity: likeOp }}
        className="absolute top-7 right-6 z-10 bg-orange-500 text-white font-black text-base px-4 py-2 rounded-2xl rotate-12 border-[3px] border-white shadow-lg"
      >
        🤤 想吃！
      </motion.div>

      {/* 先不要 標籤 */}
      <motion.div
        style={{ opacity: nopeOp }}
        className="absolute top-7 left-6 z-10 bg-stone-400 text-white font-black text-base px-4 py-2 rounded-2xl -rotate-12 border-[3px] border-white shadow-lg"
      >
        🙅 先不要
      </motion.div>

      {/* 卡片內容 */}
      <div className="flex flex-col items-center justify-center h-full px-8 py-10 text-center gap-3">
        {shop.photoUrl ? (
          <img src={shop.photoUrl} alt={shop.name}
            className="w-36 h-36 object-cover rounded-3xl shadow-md mb-1" loading="lazy" />
        ) : (
          <div className="w-36 h-36 bg-orange-50 rounded-3xl flex items-center justify-center text-7xl shadow-inner mb-1">
            {CATEGORY_EMOJI[shop.category]}
          </div>
        )}

        <span className="text-xs bg-orange-100 text-orange-600 px-3 py-1 rounded-full font-semibold">
          {CATEGORY_EMOJI[shop.category]} {shop.category}
        </span>

        <h2 className="text-2xl font-black text-stone-800 leading-tight">{shop.name}</h2>
        <p className="text-stone-400 text-sm italic leading-relaxed">{getSubtitle(shop)}</p>

        {shop.deal && shop.deal !== '（特約內容待補）' && (
          <div className="bg-orange-50 rounded-2xl px-4 py-2 mt-1">
            <span className="text-xs text-orange-600 font-semibold">🎉 {shop.deal}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
});
SwipeCard.displayName = 'SwipeCard';

// ── 主元件 ────────────────────────────────────────────────────────────────────
type Phase = 'swiping' | 'picking' | 'rolling' | 'done' | 'exhausted';

export default function TinderMode({ shops, onClose }: { shops: Shop[]; onClose: () => void }) {
  const router = useRouter();
  const deck = shops.slice(0, 10);
  const [remaining, setRemaining] = useState<Shop[]>(deck);
  const [liked, setLiked]         = useState<Shop[]>([]);
  const [phase, setPhase]         = useState<Phase>('swiping');
  const [winner, setWinner]       = useState<Shop | null>(null);
  const [rollingShop, setRollingShop] = useState<Shop | null>(null);
  const [confetti, setConfetti]   = useState(false);
  const cardRef = useRef<CardHandle>(null);

  function handleSwipe(dir: 'left' | 'right') {
    const top = remaining[0];
    const nextRemaining = remaining.slice(1);
    const nextLiked = dir === 'right' ? [...liked, top] : liked;
    setRemaining(nextRemaining);
    setLiked(nextLiked);

    if (nextLiked.length >= MAX_LIKED) {
      setConfetti(true);
      setPhase('picking');
      setTimeout(() => setConfetti(false), 2200);
    } else if (nextRemaining.length === 0) {
      setPhase('exhausted');
    }
  }

  function pickWinner() {
    if (liked.length === 0) return;
    setPhase('rolling');
    const win = liked[Math.floor(Math.random() * liked.length)];
    let count = 0;
    const iv = setInterval(() => {
      setRollingShop(liked[Math.floor(Math.random() * liked.length)]);
      count++;
      if (count > 14) {
        clearInterval(iv);
        setRollingShop(win);
        setWinner(win);
        setPhase('done');
      }
    }, 110);
  }

  function reset() {
    setRemaining(deck);
    setLiked([]);
    setPhase('swiping');
    setWinner(null);
    setRollingShop(null);
    setConfetti(false);
  }

  // ── 滑動中 ────────────────────────────────────────────────────────────────
  if (phase === 'swiping') return (
    <div className="fixed inset-0 bg-orange-50 z-40 flex flex-col">
      {confetti && <Confetti />}

      {/* 頂列 */}
      <div className="flex items-center justify-between px-4 pt-10 pb-3">
        <button onClick={onClose} className="text-stone-400 text-sm font-semibold active:opacity-60 transition-opacity">
          ✕ 關閉
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs text-stone-400 font-medium">口袋名單</span>
          <div className="flex gap-1.5">
            {Array.from({ length: MAX_LIKED }).map((_, i) => (
              <motion.button
                key={i}
                onClick={() => i < liked.length && setLiked(liked.filter((__, idx) => idx !== i))}
                className={`w-7 h-7 rounded-full flex items-center justify-center text-sm ${
                  i < liked.length ? 'bg-orange-500 active:scale-90' : 'bg-stone-200'
                }`}
                animate={i < liked.length ? { scale: [1, 1.4, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                {i < liked.length ? '❤️' : ''}
              </motion.button>
            ))}
          </div>
          <span className="text-xs text-stone-400 font-medium">{liked.length}/{MAX_LIKED}</span>
        </div>
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={() => setPhase('picking')}
          disabled={liked.length === 0}
          className="flex items-center gap-1 text-xs font-bold text-orange-500 disabled:opacity-20 active:opacity-60 transition-opacity"
        >
          <span>進入抉擇</span><span>➡️</span>
        </motion.button>
      </div>

      {/* 卡片區 */}
      <div className="flex-1 relative mx-4 my-2">
        {remaining.slice(0, 3).reverse().map((shop, revIdx) => {
          const stackIndex = (Math.min(remaining.length, 3) - 1) - revIdx;
          return (
            <SwipeCard
              key={shop.id}
              ref={stackIndex === 0 ? cardRef : undefined}
              shop={shop}
              onSwipe={handleSwipe}
              stackIndex={stackIndex}
            />
          );
        })}
        {remaining.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-stone-300 text-lg font-bold">
            沒有更多了
          </div>
        )}
      </div>

      {/* 底部按鈕 */}
      <div className="flex flex-col items-center pb-10 pt-2 px-4 gap-3">
        <div className="flex justify-center items-center gap-6">
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => cardRef.current?.swipe('left')}
            disabled={remaining.length === 0}
            className="w-16 h-16 rounded-full bg-white shadow-lg shadow-stone-900/10 flex items-center justify-center text-2xl disabled:opacity-30 border border-stone-100"
          >
            ❌
          </motion.button>

          {/* 星星：直接進入此店頁面 */}
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => { onClose(); router.push(`/shop/${remaining[0].id}`); }}
            disabled={remaining.length === 0}
            className="w-14 h-14 rounded-full bg-orange-400 shadow-lg shadow-orange-400/30 flex items-center justify-center text-2xl disabled:opacity-30"
          >
            ⭐
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => cardRef.current?.swipe('right')}
            disabled={remaining.length === 0 || liked.length >= MAX_LIKED}
            className="w-16 h-16 rounded-full bg-orange-500 shadow-lg shadow-orange-500/30 flex items-center justify-center text-2xl disabled:opacity-30"
          >
            💖
          </motion.button>
        </div>
        <p className="text-xs text-stone-400 font-medium">❌ 跳過 · ⭐ 就是這家 · 💖 加入口袋</p>
      </div>
    </div>
  );

  // ── 選了 3 個，準備抽籤 ───────────────────────────────────────────────────
  if (phase === 'picking' || phase === 'rolling') return (
    <div className="fixed inset-0 bg-orange-50 z-40 flex flex-col px-6">
      {confetti && <Confetti />}

      {/* 頂列 */}
      <div className="flex items-center pt-10 pb-4">
        <button
          onClick={() => setPhase('swiping')}
          disabled={phase === 'rolling'}
          className="flex items-center gap-1 text-xs font-bold text-stone-400 disabled:opacity-30 active:opacity-60 transition-opacity"
        >
          <span>⬅️</span><span>上一步</span>
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm text-center"
      >
        <p className="text-4xl mb-3">🎊</p>
        <h2 className="text-2xl font-black text-stone-800 mb-1">選好了！</h2>
        <p className="text-stone-400 text-sm mb-8">你的口袋名單出爐，讓命運決定最後一個吧！</p>

        {/* 三張候選卡 */}
        <div className="flex gap-3 justify-center mb-8">
          {liked.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.12 }}
              className={`flex-1 bg-white rounded-2xl p-3 shadow-sm shadow-orange-900/10 flex flex-col items-center gap-1 ${
                phase === 'rolling' && rollingShop?.id === s.id ? 'ring-2 ring-orange-400' : ''
              }`}
            >
              <span className="text-3xl">{CATEGORY_EMOJI[s.category]}</span>
              <span className="text-xs font-bold text-stone-700 text-center leading-tight">{s.name}</span>
            </motion.div>
          ))}
        </div>

        {phase === 'picking' && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={pickWinner}
            className="w-full bg-orange-500 text-white font-black text-lg py-4 rounded-3xl shadow-sm shadow-orange-900/20 active:scale-95 transition-transform duration-150"
          >
            🎲 幫我從這{['一', '兩', '三'][liked.length - 1] ?? liked.length}個裡面選一個！
          </motion.button>
        )}

        {phase === 'rolling' && (
          <div className="bg-orange-500 rounded-3xl py-5 px-4 text-center">
            <p className="text-white text-xs font-semibold mb-2 opacity-80">命運之輪轉動中...</p>
            <p className="text-white text-xl font-black">{rollingShop?.name ?? '...'}</p>
            <div className="flex justify-center gap-1 mt-2">
              {[0, 1, 2].map((i) => (
                <span key={i} className="w-2 h-2 rounded-full bg-white opacity-70 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}
      </motion.div>
      </div>
    </div>
  );

  // ── 抽到結果 ──────────────────────────────────────────────────────────────
  if (phase === 'done' && winner) return (
    <div className="fixed inset-0 bg-orange-50 z-40 flex flex-col items-center justify-center px-6">
      <Confetti />
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="w-full max-w-sm text-center"
      >
        <p className="text-5xl mb-4">🎯</p>
        <p className="text-stone-400 text-sm font-medium mb-2">今天中午就吃</p>
        <div className="bg-white rounded-3xl p-6 shadow-xl shadow-orange-900/15 mb-6">
          <div className="w-24 h-24 bg-orange-50 rounded-3xl flex items-center justify-center text-6xl mx-auto mb-4 shadow-inner">
            {winner.photoUrl
              ? <img src={winner.photoUrl} className="w-full h-full object-cover rounded-3xl" alt={winner.name} />
              : CATEGORY_EMOJI[winner.category]}
          </div>
          <h2 className="text-3xl font-black text-stone-800 mb-2">{winner.name}</h2>
          <p className="text-stone-400 text-sm italic mb-4">{getSubtitle(winner)}</p>
          {winner.deal && winner.deal !== '（特約內容待補）' && (
            <div className="bg-orange-50 rounded-2xl px-4 py-2">
              <span className="text-sm text-orange-600 font-semibold">🎉 {winner.deal}</span>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={reset}
            className="flex-1 bg-white text-stone-600 font-bold py-3.5 rounded-2xl shadow-sm border border-stone-200 text-sm"
          >
            🔄 再玩一次
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => { onClose(); router.push(`/shop/${winner.id}`); }}
            className="flex-1 bg-orange-500 text-white font-bold py-3.5 rounded-2xl shadow-sm text-sm"
          >
            ✓ 就這家！
          </motion.button>
        </div>
      </motion.div>
    </div>
  );

  // ── 全部滑完、選不夠 ──────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-orange-50 z-40 flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm text-center"
      >
        <p className="text-5xl mb-4">🤷</p>
        <h2 className="text-2xl font-black text-stone-800 mb-2">你真的很難伺候欸</h2>
        <p className="text-stone-400 text-sm mb-2">
          {liked.length > 0
            ? `${deck.length} 家全看完了，你只選了 ${liked.length} 家。`
            : `${deck.length} 家全看完了，一家都不選？`}
        </p>
        <p className="text-stone-400 text-sm mb-8">要不要再來一輪？</p>

        {liked.length > 0 && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => { setPhase('picking'); }}
            className="w-full bg-orange-500 text-white font-black text-base py-4 rounded-3xl mb-3 shadow-sm"
          >
            💖 就從已選的 {liked.length} 家裡抽一個
          </motion.button>
        )}

        <div className="flex gap-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={reset}
            className="flex-1 bg-white text-stone-600 font-bold py-3.5 rounded-2xl shadow-sm border border-stone-200 text-sm"
          >
            🔄 重新來過
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="flex-1 bg-stone-200 text-stone-600 font-bold py-3.5 rounded-2xl text-sm"
          >
            回列表
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
