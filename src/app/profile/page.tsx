'use client';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { Shop } from '@/lib/shops';

function AvatarCircle({ name, avatarUrl, size = 80 }: { name: string | null; avatarUrl: string | null; size?: number }) {
  const colors = ['#FF7A45', '#FF5B5B', '#22C55E', '#3B82F6', '#8B5CF6', '#F59E0B'];
  const letter = (name ?? '?')[0].toUpperCase();
  const colorIndex = letter.charCodeAt(0) % colors.length;

  if (avatarUrl) {
    return <img src={avatarUrl} alt={name ?? ''} className="rounded-full object-cover" style={{ width: size, height: size }} />;
  }
  return (
    <div className="rounded-full flex items-center justify-center font-black text-white flex-shrink-0"
      style={{ width: size, height: size, background: colors[colorIndex], fontSize: size * 0.4 }}>
      {letter}
    </div>
  );
}

export default function ProfilePage() {
  const { user, profile, loading, favIds, signOut, migrationDone } = useAuth();
  const router = useRouter();
  const [favShops, setFavShops] = useState<Shop[]>([]);
  const [showMigrationToast, setShowMigrationToast] = useState(false);

  useEffect(() => {
    if (migrationDone) {
      setShowMigrationToast(true);
      const t = setTimeout(() => setShowMigrationToast(false), 4000);
      return () => clearTimeout(t);
    }
  }, [migrationDone]);

  useEffect(() => {
    if (favIds.length === 0) { setFavShops([]); return; }
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL; // just for check
    if (!url) return;
    // Fetch shop data from the sheet for preview (max 3)
    const supabase = createBrowserClient();
    // We store shop IDs from the Google Sheet — fetch partial list for preview
    // Since shops come from Google Sheet (not Supabase), we just show IDs for now
    // The full list is in /favorites
    setFavShops([]); // favorites page shows the full list
  }, [favIds]);

  async function handleSignOut() {
    await signOut();
    router.push('/');
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#FDEEDD' }}>
        <div className="animate-pulse text-2xl">🍱</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: '#FDEEDD' }}>
        <div className="max-w-lg mx-auto w-full px-4 pt-16 pb-8 flex-1 flex flex-col items-center justify-center">
          <div className="text-6xl mb-6">🔒</div>
          <h1 className="text-2xl font-black text-stone-800 mb-2 text-center">登入後解鎖更多功能</h1>
          <p className="text-stone-400 text-sm text-center mb-8 leading-relaxed">
            用公司 Email 登入，免密碼
          </p>

          <div className="w-full bg-white rounded-3xl p-5 mb-6" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.07)' }}>
            {[
              { icon: '❤️', text: '跨裝置同步收藏' },
              { icon: '👥', text: '未來：揪飯友一起吃' },
              { icon: '🛵', text: '未來：求跑腿代買' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3 py-3 border-b last:border-0 border-stone-50">
                <span className="text-xl">{icon}</span>
                <span className="text-stone-700 font-semibold text-sm">{text}</span>
              </div>
            ))}
          </div>

          <Link
            href="/login"
            className="w-full py-4 rounded-2xl font-black text-white text-center text-base active:scale-95 transition-all duration-150 block"
            style={{ background: 'linear-gradient(135deg, #FF7A45 0%, #FF5B5B 100%)', boxShadow: '0 4px 14px rgba(255,122,69,0.4)' }}
          >
            登入
          </Link>

          {favIds.length > 0 && (
            <p className="text-center text-xs text-stone-400 mt-4">
              你有 {favIds.length} 個本機收藏，登入後會自動同步到雲端
            </p>
          )}
        </div>
      </div>
    );
  }

  const displayName = profile?.display_name;
  const department = profile?.department;

  return (
    <div className="min-h-screen" style={{ background: '#FDEEDD' }}>
      {/* 遷移成功提示 */}
      {showMigrationToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-green-500 text-white px-5 py-3 rounded-2xl text-sm font-semibold shadow-lg animate-fade-in-up">
          ✅ 已將收藏同步到雲端
        </div>
      )}

      <div className="max-w-lg mx-auto px-4 pt-8 pb-8">
        {/* 頭像與名稱 */}
        <div className="flex flex-col items-center mb-6">
          <AvatarCircle name={displayName ?? null} avatarUrl={profile?.avatar_url ?? null} size={88} />
          <h1 className="text-xl font-black text-stone-800 mt-3">
            {displayName ?? '點此設定暱稱'}
          </h1>
          {department && <p className="text-sm text-stone-400 mt-0.5">{department}</p>}
          <p className="text-xs text-stone-300 mt-1">{user.email}</p>
        </div>

        {/* 設定提示（沒填名稱） */}
        {!displayName && (
          <Link href="/profile/edit"
            className="block bg-orange-50 border border-orange-200 rounded-2xl px-4 py-3 mb-4 text-sm text-orange-600 font-semibold text-center active:bg-orange-100 transition-colors">
            👋 設定你的暱稱與部門
          </Link>
        )}

        {/* 功能卡片 */}
        <div className="bg-white rounded-3xl divide-y divide-stone-50 mb-4" style={{ boxShadow: '0 2px 14px rgba(0,0,0,0.07)' }}>
          <Link href="/profile/edit" className="flex items-center gap-3 px-4 py-4 active:bg-orange-50 transition-colors">
            <span className="text-xl">✏️</span>
            <span className="flex-1 font-semibold text-stone-700 text-sm">編輯個人資料</span>
            <span className="text-stone-300 text-lg">›</span>
          </Link>
          <Link href="/favorites" className="flex items-center gap-3 px-4 py-4 active:bg-orange-50 transition-colors">
            <span className="text-xl">❤️</span>
            <div className="flex-1">
              <div className="font-semibold text-stone-700 text-sm">我的收藏</div>
              <div className="text-xs text-stone-400">{favIds.length > 0 ? `${favIds.length} 家店` : '尚無收藏'}</div>
            </div>
            <span className="text-stone-300 text-lg">›</span>
          </Link>
        </div>

        {/* 登出 */}
        <button
          onClick={handleSignOut}
          className="w-full bg-white rounded-2xl py-4 text-sm font-bold text-stone-400 active:bg-stone-50 transition-colors"
          style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}
        >
          登出
        </button>
      </div>
    </div>
  );
}
