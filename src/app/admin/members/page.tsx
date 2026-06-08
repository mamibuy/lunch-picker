'use client';
import { useAuth } from '@/components/AuthProvider';
import { createBrowserClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Profile } from '@/components/AuthProvider';

export default function AdminMembersPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [members, setMembers] = useState<Profile[]>([]);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editingMember, setEditingMember] = useState<Profile | null>(null);

  const isAdmin = profile?.is_staff_committee === true && profile?.is_active === true;

  useEffect(() => {
    if (!loading && user && profile && !isAdmin) router.replace('/');
    if (!loading && !user) router.replace('/');
  }, [loading, user, profile, isAdmin, router]);

  useEffect(() => {
    if (!isAdmin) return;
    fetchMembers();
  }, [isAdmin]);

  async function fetchMembers() {
    const supabase = createBrowserClient();
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at' as never, { ascending: false });
    setMembers((data ?? []) as Profile[]);
    setFetching(false);
  }

  async function toggleActive(memberId: string, current: boolean) {
    setSaving(memberId);
    const supabase = createBrowserClient();
    await supabase.from('profiles').update({ is_active: !current }).eq('id', memberId);
    setMembers(prev => prev.map(m => m.id === memberId ? { ...m, is_active: !current } : m));
    setSaving(null);
  }

  if (loading || fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#FDEEDD' }}>
        <div className="animate-bounce text-4xl">🍱</div>
      </div>
    );
  }

  if (!isAdmin) return null;

  const pending = members.filter(m => !m.is_active);
  const active = members.filter(m => m.is_active);

  return (
    <div className="min-h-screen" style={{ background: '#FDEEDD' }}>
      <div className="max-w-2xl mx-auto px-4 pt-8 pb-24">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <a href="/admin" className="text-stone-400 hover:text-stone-600 text-sm">← 後台</a>
            <span className="text-stone-200">|</span>
            <div>
              <h1 className="text-xl font-black text-stone-800">員工管理</h1>
              <p className="text-xs text-stone-400">共 {members.length} 人</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 rounded-2xl font-bold text-white text-sm active:scale-95 transition-all"
            style={{ background: 'linear-gradient(135deg, #FF7A45 0%, #FF5B5B 100%)' }}
          >
            + 新增帳號
          </button>
        </div>

        {showCreate && (
          <CreateUserForm
            onClose={() => setShowCreate(false)}
            onCreated={() => { setShowCreate(false); fetchMembers(); }}
          />
        )}

        {editingMember && (
          <EditMemberForm
            member={editingMember}
            onClose={() => setEditingMember(null)}
            onSaved={(updated) => {
              setMembers(prev => prev.map(m => m.id === updated.id ? updated : m));
              setEditingMember(null);
            }}
          />
        )}

        {pending.length > 0 && (
          <section className="mb-6">
            <h2 className="text-sm font-bold text-orange-500 mb-2 px-1">待審核（{pending.length}）</h2>
            <div className="bg-white rounded-3xl divide-y divide-stone-50" style={{ boxShadow: '0 2px 14px rgba(0,0,0,0.07)' }}>
              {pending.map(m => (
                <MemberRow key={m.id} member={m} saving={saving === m.id} onToggle={toggleActive} onEdit={setEditingMember} />
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="text-sm font-bold text-stone-400 mb-2 px-1">已啟用（{active.length}）</h2>
          <div className="bg-white rounded-3xl divide-y divide-stone-50" style={{ boxShadow: '0 2px 14px rgba(0,0,0,0.07)' }}>
            {active.length === 0 && (
              <p className="text-center text-stone-300 text-sm py-6">尚無已啟用帳號</p>
            )}
            {active.map(m => (
              <MemberRow key={m.id} member={m} saving={saving === m.id} onToggle={toggleActive} onEdit={setEditingMember} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function CreateUserForm({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [department, setDepartment] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'success'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');
    const res = await fetch('/api/admin/create-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, display_name: displayName, department }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErrorMsg(data.error ?? '建立失敗');
      setStatus('error');
    } else {
      onCreated();
    }
  }

  return (
    <div className="bg-white rounded-3xl p-5 mb-6" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
      <h2 className="font-black text-stone-800 mb-4">新增帳號</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="email" value={email} onChange={e => setEmail(e.target.value)}
          placeholder="Email *" required
          className="w-full border-2 border-stone-100 rounded-2xl px-4 py-3 text-sm outline-none focus:border-orange-300"
        />
        <input
          type="password" value={password} onChange={e => setPassword(e.target.value)}
          placeholder="臨時密碼 *" required minLength={6}
          className="w-full border-2 border-stone-100 rounded-2xl px-4 py-3 text-sm outline-none focus:border-orange-300"
        />
        <input
          type="text" value={displayName} onChange={e => setDisplayName(e.target.value)}
          placeholder="暱稱（選填）"
          className="w-full border-2 border-stone-100 rounded-2xl px-4 py-3 text-sm outline-none focus:border-orange-300"
        />
        <input
          type="text" value={department} onChange={e => setDepartment(e.target.value)}
          placeholder="部門（選填）"
          className="w-full border-2 border-stone-100 rounded-2xl px-4 py-3 text-sm outline-none focus:border-orange-300"
        />
        {status === 'error' && <p className="text-red-400 text-xs px-1">{errorMsg}</p>}
        <div className="flex gap-3 mt-1">
          <button type="button" onClick={onClose}
            className="flex-1 py-3 rounded-2xl text-stone-400 text-sm font-semibold bg-stone-50">
            取消
          </button>
          <button type="submit" disabled={status === 'loading'}
            className="flex-1 py-3 rounded-2xl text-white text-sm font-bold disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #FF7A45 0%, #FF5B5B 100%)' }}>
            {status === 'loading' ? '建立中…' : '建立帳號'}
          </button>
        </div>
      </form>
    </div>
  );
}

function MemberRow({ member, saving, onToggle, onEdit }: {
  member: Profile;
  saving: boolean;
  onToggle: (id: string, current: boolean) => void;
  onEdit: (member: Profile) => void;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-4">
      <div className="w-9 h-9 rounded-full flex items-center justify-center font-black text-white text-sm flex-shrink-0"
        style={{ background: member.is_active ? '#FF7A45' : '#D1D5DB' }}>
        {(member.display_name ?? member.email ?? '?')[0].toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-stone-700 text-sm truncate">
            {member.display_name ?? '（未填暱稱）'}
          </span>
          {member.is_staff_committee && (
            <span className="text-xs bg-orange-100 text-orange-500 px-1.5 py-0.5 rounded-lg font-bold flex-shrink-0">管理員</span>
          )}
        </div>
        <div className="text-xs text-stone-400 truncate">{member.email}</div>
        {member.department && <div className="text-xs text-stone-300">{member.department}</div>}
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onEdit(member)}
          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-stone-100 text-stone-500 active:scale-95 transition-all"
        >
          編輯
        </button>
        <button
          onClick={() => onToggle(member.id, member.is_active)}
          disabled={saving}
          className="flex flex-col items-center gap-0.5 disabled:opacity-50"
        >
          <div className={`w-11 h-6 rounded-full transition-colors duration-200 ${member.is_active ? 'bg-green-400' : 'bg-stone-200'}`}>
            <div className={`w-5 h-5 bg-white rounded-full shadow mt-0.5 transition-transform duration-200 ${member.is_active ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </div>
          <span className={`text-[10px] font-bold ${member.is_active ? 'text-green-500' : 'text-stone-400'}`}>
            {saving ? '…' : member.is_active ? '已開通' : '未啟用'}
          </span>
        </button>
      </div>
    </div>
  );
}

function EditMemberForm({ member, onClose, onSaved }: {
  member: Profile;
  onClose: () => void;
  onSaved: (updated: Profile) => void;
}) {
  const [displayName, setDisplayName] = useState(member.display_name ?? '');
  const [department, setDepartment] = useState(member.department ?? '');
  const [companyName, setCompanyName] = useState(member.company_name ?? '');
  const [isAdmin, setIsAdmin] = useState(member.is_staff_committee);
  const [newPassword, setNewPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');
    const supabase = createBrowserClient();
    const updates: Partial<Profile> = {
      display_name: displayName || null,
      department: department || null,
      company_name: companyName || null,
      is_staff_committee: isAdmin,
    };
    const { error } = await supabase.from('profiles').update(updates).eq('id', member.id);
    if (error) {
      setErrorMsg('儲存失敗：' + error.message);
      setStatus('error');
      return;
    }
    if (newPassword.length >= 6) {
      const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: member.id, password: newPassword }),
      });
      if (!res.ok) {
        const d = await res.json();
        setErrorMsg('密碼更新失敗：' + (d.error ?? ''));
        setStatus('error');
        return;
      }
    }
    onSaved({ ...member, ...updates });
  }

  return (
    <div className="bg-white rounded-3xl p-5 mb-6" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-black text-stone-800">編輯帳號</h2>
        <p className="text-xs text-stone-400">{member.email}</p>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="text" value={displayName} onChange={e => setDisplayName(e.target.value)}
          placeholder="暱稱"
          className="w-full border-2 border-stone-100 rounded-2xl px-4 py-3 text-sm outline-none focus:border-orange-300"
        />
        <input
          type="text" value={department} onChange={e => setDepartment(e.target.value)}
          placeholder="部門"
          className="w-full border-2 border-stone-100 rounded-2xl px-4 py-3 text-sm outline-none focus:border-orange-300"
        />
        <input
          type="text" value={companyName} onChange={e => setCompanyName(e.target.value)}
          placeholder="公司名稱"
          className="w-full border-2 border-stone-100 rounded-2xl px-4 py-3 text-sm outline-none focus:border-orange-300"
        />
        <input
          type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
          placeholder="重設密碼（留空則不修改）" minLength={6}
          className="w-full border-2 border-stone-100 rounded-2xl px-4 py-3 text-sm outline-none focus:border-orange-300"
        />
        <label className="flex items-center gap-3 px-1 cursor-pointer">
          <div
            onClick={() => setIsAdmin(!isAdmin)}
            className={`w-11 h-6 rounded-full transition-colors flex-shrink-0 ${isAdmin ? 'bg-orange-400' : 'bg-stone-200'}`}
          >
            <div className={`w-5 h-5 bg-white rounded-full shadow mt-0.5 transition-transform ${isAdmin ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </div>
          <span className="text-sm font-semibold text-stone-700">管理員權限</span>
        </label>
        {status === 'error' && <p className="text-red-400 text-xs px-1">{errorMsg}</p>}
        <div className="flex gap-3 mt-1">
          <button type="button" onClick={onClose}
            className="flex-1 py-3 rounded-2xl text-stone-400 text-sm font-semibold bg-stone-50">
            取消
          </button>
          <button type="submit" disabled={status === 'loading'}
            className="flex-1 py-3 rounded-2xl text-white text-sm font-bold disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #FF7A45 0%, #FF5B5B 100%)' }}>
            {status === 'loading' ? '儲存中…' : '儲存'}
          </button>
        </div>
      </form>
    </div>
  );
}
