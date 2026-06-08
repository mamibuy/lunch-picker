'use client';
import { useAuth } from '@/components/AuthProvider';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@/lib/supabase/client';

export default function AdminPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [shopCount, setShopCount] = useState<number | null>(null);
  const [memberCount, setMemberCount] = useState<number | null>(null);

  const isAdmin = profile?.is_staff_committee === true && profile?.is_active === true;

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) router.replace('/');
  }, [loading, user, isAdmin, router]);

  useEffect(() => {
    if (!isAdmin) return;
    const supabase = createBrowserClient();
    Promise.all([
      fetch('/api/admin/shops').then(r => r.json()).then(d => setShopCount(Array.isArray(d) ? d.length : null)),
      supabase.from('profiles').select('*', { count: 'exact', head: true })
        .then(({ count }) => setMemberCount(count)),
    ]);
  }, [isAdmin]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#1e293b' }}>
        <div className="animate-bounce text-3xl">⚙️</div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen pb-10" style={{ background: '#1e293b' }}>
      <div className="max-w-2xl mx-auto px-4 pt-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/" className="text-slate-400 hover:text-slate-200 transition-colors text-sm">
            ← 返回 App
          </Link>
        </div>
        <div className="mb-8">
          <h1 className="text-2xl font-black text-white mb-1">福委會後台</h1>
          <p className="text-slate-400 text-sm">你好，{profile?.display_name ?? profile?.email}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-slate-800 rounded-2xl p-5">
            <div className="text-3xl font-black text-white mb-1">
              {shopCount !== null ? shopCount : '…'}
            </div>
            <div className="text-slate-400 text-sm">間店家</div>
          </div>
          <div className="bg-slate-800 rounded-2xl p-5">
            <div className="text-3xl font-black text-white mb-1">
              {memberCount !== null ? memberCount : '…'}
            </div>
            <div className="text-slate-400 text-sm">位成員</div>
          </div>
        </div>

        {/* Navigation cards */}
        <div className="flex flex-col gap-4">
          <Link href="/admin/shops"
            className="bg-slate-800 hover:bg-slate-700 rounded-2xl p-6 flex items-center gap-4 transition-colors group">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
              style={{ background: 'rgba(255,122,69,0.15)' }}>🍽️</div>
            <div className="flex-1">
              <div className="text-white font-bold text-base">店家管理</div>
              <div className="text-slate-400 text-sm mt-0.5">新增、編輯、停用特約店家</div>
            </div>
            <div className="text-slate-500 group-hover:text-slate-300 text-xl">›</div>
          </Link>

          <Link href="/admin/members"
            className="bg-slate-800 hover:bg-slate-700 rounded-2xl p-6 flex items-center gap-4 transition-colors group">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
              style={{ background: 'rgba(99,102,241,0.15)' }}>👥</div>
            <div className="flex-1">
              <div className="text-white font-bold text-base">員工管理</div>
              <div className="text-slate-400 text-sm mt-0.5">查看名單、審核、設定管理員</div>
            </div>
            <div className="text-slate-500 group-hover:text-slate-300 text-xl">›</div>
          </Link>
        </div>
      </div>
    </div>
  );
}
