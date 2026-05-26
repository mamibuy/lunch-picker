'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

function UtensilsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {/* Fork: 3 tines + handle */}
      <line x1="4" y1="2" x2="4" y2="6"/>
      <line x1="7" y1="2" x2="7" y2="6"/>
      <line x1="10" y1="2" x2="10" y2="6"/>
      <path d="M4 6 Q7 10 10 6"/>
      <line x1="7" y1="9.5" x2="7" y2="22"/>
      {/* Knife: curved blade + straight back */}
      <path d="M15 2 Q20 5 20 9 L15 9"/>
      <line x1="15" y1="2" x2="15" y2="22"/>
    </svg>
  );
}

function MassageIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 11V6a2 2 0 0 0-4 0"/>
      <path d="M14 10V4a2 2 0 0 0-4 0v2"/>
      <path d="M10 10.5V6a2 2 0 0 0-4 0v8"/>
      <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>
    </svg>
  );
}

function CartIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1"/>
      <circle cx="20" cy="21" r="1"/>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 1.99 1.61h9.72a2 2 0 0 0 1.99-1.61L23 6H6"/>
    </svg>
  );
}

function BagIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  );
}

const TABS = [
  { href: '/', label: '吃飯', icon: <UtensilsIcon /> },
  { href: '/map', label: '快樂', icon: <MassageIcon /> },
  { href: '/daigou', label: '代購', icon: <BagIcon /> },
  { href: '/favorites', label: '蝦拼', icon: <CartIcon /> },
  { href: '/profile', label: '我的', icon: <UserIcon /> },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50" style={{ background: 'white', borderTop: '1px solid #F0EDE8', boxShadow: '0 -4px 16px rgba(0,0,0,0.06)' }}>
      <div className="max-w-lg mx-auto flex pb-safe">
        {TABS.map(({ href, label, icon }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href} className="flex-1 flex flex-col items-center py-2 gap-0.5">
              <div
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-150 ${active ? 'scale-105' : ''}`}
                style={active ? { background: '#FF7A45' } : {}}
              >
                <span style={{ color: active ? 'white' : '#999' }}>{icon}</span>
              </div>
              <span className="text-xs font-semibold" style={{ color: active ? '#FF7A45' : '#999', fontSize: '10px' }}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
