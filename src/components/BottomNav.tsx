'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

function HomeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
    </svg>
  );
}
function MapIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  );
}
function HeartIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
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
  { href: '/', label: '首頁', icon: <HomeIcon /> },
  { href: '/map', label: '地圖', icon: <MapIcon /> },
  { href: '/favorites', label: '收藏', icon: <HeartIcon /> },
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
              <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-150 ${active ? 'scale-105' : ''}`}
                style={active ? { background: '#FF7A45' } : {}}>
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
