'use client';
import { useAuth } from '@/components/AuthProvider';

export default function PendingGuard({ children }: { children: React.ReactNode }) {
  const { isPending, signOut } = useAuth();

  if (!isPending) return <>{children}</>;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: '#FDEEDD' }}>
      <div className="w-full max-w-sm text-center">
        <div className="text-6xl mb-4">⏳</div>
        <h1 className="text-2xl font-black text-stone-800 mb-2">等待管理員審核</h1>
        <p className="text-stone-400 text-sm leading-relaxed mb-8">
          你的帳號已建立，<br/>請等管理員開通後即可使用
        </p>
        <div className="bg-white rounded-3xl p-5 mb-6 text-left" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <p className="text-stone-500 text-sm">帳號審核通常在 1 個工作日內完成。開通後重新整理此頁面即可登入。</p>
        </div>
        <button
          onClick={signOut}
          className="text-stone-400 text-sm py-2"
        >
          登出
        </button>
      </div>
    </div>
  );
}
