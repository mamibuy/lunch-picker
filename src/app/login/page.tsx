'use client';
import { useState, useEffect } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { isAllowedEmail, ALLOWED_EMAIL_DOMAIN } from '@/lib/auth/config';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [countdown, setCountdown] = useState(0);
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) router.replace('/');
  }, [user, loading, router]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!isAllowedEmail(trimmed)) {
      setErrorMsg(ALLOWED_EMAIL_DOMAIN
        ? `請使用 @${ALLOWED_EMAIL_DOMAIN} 公司 Email`
        : '請輸入有效的 Email');
      setStatus('error');
      return;
    }
    setStatus('sending');
    setErrorMsg('');
    const supabase = createBrowserClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        shouldCreateUser: true,
      },
    });
    if (error) {
      setErrorMsg(error.message);
      setStatus('error');
    } else {
      setStatus('sent');
      setCountdown(60);
    }
  }

  if (loading) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: '#FDEEDD' }}>
      <div className="w-full max-w-sm">
        {/* Logo 區 */}
        <div className="text-center mb-10">
          <div className="text-6xl mb-3">🍱</div>
          <h1 className="text-3xl font-black text-stone-800 mb-1">上班吃什麼</h1>
          <p className="text-stone-400 text-sm">午休煩惱終結者</p>
        </div>

        {status === 'sent' ? (
          <div className="bg-white rounded-3xl p-6 text-center" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <div className="text-4xl mb-3">📬</div>
            <h2 className="font-black text-stone-800 text-lg mb-2">登入連結已寄出！</h2>
            <p className="text-stone-500 text-sm leading-relaxed mb-1">
              請到 <span className="font-semibold text-stone-700">{email}</span> 的信箱
            </p>
            <p className="text-stone-500 text-sm mb-5">點擊連結即可登入，無需密碼</p>
            <p className="text-xs text-stone-400 mb-4">沒收到？請檢查垃圾信件夾</p>
            <button
              onClick={() => { setStatus('idle'); setCountdown(0); }}
              disabled={countdown > 0}
              className="w-full py-3 rounded-2xl font-bold text-sm transition-all duration-150 active:scale-95 disabled:opacity-40"
              style={{ background: countdown > 0 ? '#EEE' : '#FF7A45', color: countdown > 0 ? '#AAA' : 'white' }}
            >
              {countdown > 0 ? `重新寄送（${countdown}s）` : '重新寄送'}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="bg-white rounded-3xl p-6" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
              <p className="text-stone-600 text-sm text-center mb-5 leading-relaxed">
                輸入 Email，我們寄登入連結給你<br/>
                <span className="text-stone-400 text-xs">不需要記密碼</span>
              </p>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={ALLOWED_EMAIL_DOMAIN ? `your@${ALLOWED_EMAIL_DOMAIN}` : 'your@email.com'}
                required
                autoFocus
                className="w-full border-2 rounded-2xl px-4 py-4 text-base outline-none transition-colors"
                style={{
                  borderColor: status === 'error' ? '#FF5B5B' : email ? '#FF7A45' : '#EEE',
                  fontSize: '16px',
                }}
              />
              {status === 'error' && (
                <p className="text-red-400 text-xs mt-2 px-1">{errorMsg}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={status === 'sending' || !email.trim()}
              className="w-full py-4 rounded-2xl font-black text-white text-base active:scale-95 transition-all duration-150 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #FF7A45 0%, #FF5B5B 100%)', boxShadow: '0 4px 14px rgba(255,122,69,0.4)' }}
            >
              {status === 'sending' ? '寄送中…' : '寄送登入連結'}
            </button>
          </form>
        )}

        <p className="text-center text-xs text-stone-300 mt-8">
          登入即表示同意使用條款與隱私政策
        </p>
      </div>
    </div>
  );
}
