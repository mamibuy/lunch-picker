'use client';
import { useState, useEffect } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) router.replace('/');
  }, [user, loading, router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');
    const supabase = createBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) {
      setErrorMsg('Email 或密碼錯誤');
      setStatus('error');
    } else {
      router.replace('/');
    }
  }

  if (loading) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: '#FDEEDD' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="text-6xl mb-3">🍱</div>
          <h1 className="text-3xl font-black text-stone-800 mb-1">上班吃什麼</h1>
          <p className="text-stone-400 text-sm">午休煩惱終結者</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="bg-white rounded-3xl p-6" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <div className="flex flex-col gap-3">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Email"
                required
                autoFocus
                className="w-full border-2 rounded-2xl px-4 py-4 text-base outline-none transition-colors"
                style={{
                  borderColor: status === 'error' ? '#FF5B5B' : email ? '#FF7A45' : '#EEE',
                  fontSize: '16px',
                }}
              />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="密碼"
                required
                className="w-full border-2 rounded-2xl px-4 py-4 text-base outline-none transition-colors"
                style={{
                  borderColor: status === 'error' ? '#FF5B5B' : password ? '#FF7A45' : '#EEE',
                  fontSize: '16px',
                }}
              />
              {status === 'error' && (
                <p className="text-red-400 text-xs px-1">{errorMsg}</p>
              )}
            </div>
          </div>
          <button
            type="submit"
            disabled={status === 'loading' || !email.trim() || !password}
            className="w-full py-4 rounded-2xl font-black text-white text-base active:scale-95 transition-all duration-150 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #FF7A45 0%, #FF5B5B 100%)', boxShadow: '0 4px 14px rgba(255,122,69,0.4)' }}
          >
            {status === 'loading' ? '登入中…' : '登入'}
          </button>
        </form>
      </div>
    </div>
  );
}
