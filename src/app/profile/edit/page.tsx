'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { createBrowserClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ProfileEditPage() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const router = useRouter();

  const [displayName, setDisplayName] = useState('');
  const [department, setDepartment] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [commonAddress, setCommonAddress] = useState('');
  const [birthdayMd, setBirthdayMd] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? '');
      setDepartment(profile.department ?? '');
      setCompanyName(profile.company_name ?? '');
      setPhone(profile.phone ?? '');
      setCommonAddress(profile.common_address ?? '');
      setBirthdayMd(profile.birthday_md ?? '');
    }
  }, [profile]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!displayName.trim()) {
      setSaveMsg('error:暱稱為必填');
      return;
    }
    setSaving(true);
    setSaveMsg('');
    const supabase = createBrowserClient();
    const { error } = await supabase.from('profiles').update({
      display_name: displayName.trim(),
      department: department.trim() || null,
      company_name: companyName.trim() || null,
      phone: phone.trim() || null,
      common_address: commonAddress.trim() || null,
      birthday_md: birthdayMd.trim() || null,
    }).eq('id', user.id);

    if (error) {
      setSaveMsg('error:儲存失敗，請再試一次');
    } else {
      await refreshProfile();
      setSaveMsg('ok');
      setTimeout(() => router.push('/profile'), 800);
    }
    setSaving(false);
  }

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center" style={{ background: '#FDEEDD' }}><div className="animate-pulse text-2xl">🍱</div></div>;
  }

  return (
    <div className="min-h-screen" style={{ background: '#FDEEDD' }}>
      {/* 頂部列 */}
      <div className="sticky top-0 z-10 px-4 py-3 flex items-center gap-3" style={{ background: '#FDEEDD' }}>
        <Link href="/profile" className="text-stone-500 text-sm font-semibold active:opacity-60 transition-opacity">
          ← 返回
        </Link>
        <h1 className="font-black text-stone-800 text-lg flex-1 text-center pr-10">編輯個人資料</h1>
      </div>

      <form onSubmit={handleSave} className="max-w-lg mx-auto px-4 pb-10">
        {/* 必填區 */}
        <div className="bg-white rounded-3xl p-5 mb-4" style={{ boxShadow: '0 2px 14px rgba(0,0,0,0.07)' }}>
          <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-4">基本資料</p>

          <div className="mb-4">
            <label className="block text-sm font-bold text-stone-700 mb-1.5">
              暱稱 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="輸入你的暱稱"
              className="w-full border-2 rounded-2xl px-4 py-3 text-base outline-none transition-colors"
              style={{ borderColor: displayName ? '#FF7A45' : '#EEE', fontSize: '16px' }}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-bold text-stone-700 mb-1.5">
              部門 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={department}
              onChange={e => setDepartment(e.target.value)}
              placeholder="例：行銷部、工程部"
              className="w-full border-2 rounded-2xl px-4 py-3 text-base outline-none transition-colors"
              style={{ borderColor: department ? '#FF7A45' : '#EEE', fontSize: '16px' }}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-stone-700 mb-1.5">公司名稱</label>
            <input
              type="text"
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              placeholder="例：媽咪買股份有限公司"
              className="w-full border-2 rounded-2xl px-4 py-3 text-base outline-none transition-colors"
              style={{ borderColor: companyName ? '#FF7A45' : '#EEE', fontSize: '16px' }}
            />
          </div>
        </div>

        {/* 選填區 */}
        <div className="bg-white rounded-3xl p-5 mb-5" style={{ boxShadow: '0 2px 14px rgba(0,0,0,0.07)' }}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">選填資料</p>
            <span className="text-xs text-stone-300 bg-stone-50 px-2 py-0.5 rounded-full">不填不影響使用</span>
          </div>

          {[
            {
              label: '電話', value: phone, onChange: setPhone,
              placeholder: '09XX-XXX-XXX',
              type: 'tel',
              desc: '用於緊急聯絡或未來求跑腿確認；不會被其他同事看到',
            },
            {
              label: '常用地址', value: commonAddress, onChange: setCommonAddress,
              placeholder: '例：台北市信義區…',
              type: 'text',
              desc: '用於未來求跑腿外送；不會被其他同事看到',
            },
            {
              label: '生日（月-日）', value: birthdayMd, onChange: setBirthdayMd,
              placeholder: '例：03-15',
              type: 'text',
              desc: '用於未來生日小驚喜；僅記錄月日，不記錄年份',
            },
          ].map(({ label, value, onChange, placeholder, type, desc }) => (
            <div key={label} className="mb-5">
              <label className="block text-sm font-bold text-stone-700 mb-0.5">
                {label} <span className="text-stone-300 font-normal text-xs">選填</span>
              </label>
              <p className="text-xs text-stone-400 mb-2 leading-relaxed">{desc}</p>
              <input
                type={type}
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full border-2 rounded-2xl px-4 py-3 text-base outline-none transition-colors"
                style={{ borderColor: value ? '#FF7A45' : '#EEE', fontSize: '16px' }}
              />
            </div>
          ))}
        </div>

        {/* 儲存結果提示 */}
        {saveMsg === 'ok' && (
          <p className="text-green-500 text-sm font-semibold text-center mb-3">✅ 已儲存！</p>
        )}
        {saveMsg.startsWith('error:') && (
          <p className="text-red-400 text-sm text-center mb-3">{saveMsg.slice(6)}</p>
        )}

        <button
          type="submit"
          disabled={saving || !displayName.trim()}
          className="w-full py-4 rounded-2xl font-black text-white text-base active:scale-95 transition-all duration-150 disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #FF7A45 0%, #FF5B5B 100%)', boxShadow: '0 4px 14px rgba(255,122,69,0.4)' }}
        >
          {saving ? '儲存中…' : '儲存'}
        </button>
      </form>
    </div>
  );
}
