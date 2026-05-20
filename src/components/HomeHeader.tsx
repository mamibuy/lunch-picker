function LeafDecoration() {
  return (
    <svg width="48" height="58" viewBox="0 0 95 115" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M 12 115 C 2 92 -4 65 10 38 C 22 14 55 4 72 22 C 91 40 86 80 63 97 C 44 111 26 118 12 115 Z" fill="#5BB85C"/>
      <path d="M12 115 C 24 90 38 60 58 35" stroke="#3A8B3D" strokeWidth="2.8" fill="none" strokeLinecap="round"/>
      <path d="M36 84 C 48 77 62 72 68 66" stroke="#3A8B3D" strokeWidth="1.6" fill="none" strokeLinecap="round"/>
      <path d="M25 96 C 37 89 52 83 58 77" stroke="#3A8B3D" strokeWidth="1.6" fill="none" strokeLinecap="round"/>
      <path d="M28 52 C 38 38 52 30 63 35 C 52 44 40 53 28 52 Z" fill="#80CC80" opacity="0.42"/>
    </svg>
  );
}

function UtensilsDecoration() {
  return (
    <svg width="130" height="155" viewBox="0 0 130 155" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Fork */}
      <g transform="translate(55, -8) rotate(18, 15, 85)">
        <rect x="11" y="0" width="9" height="105" rx="4.5" fill="#C4956A"/>
        <rect x="6.5" y="0" width="3" height="30" rx="1.5" fill="#9A7050"/>
        <rect x="11.5" y="0" width="3" height="30" rx="1.5" fill="#9A7050"/>
        <rect x="16.5" y="0" width="3" height="30" rx="1.5" fill="#9A7050"/>
        <path d="M6.5 28 Q15.5 36 24.5 28" fill="#B08060"/>
        <rect x="6.5" y="30" width="18" height="6" rx="2.5" fill="#B08060"/>
      </g>
      {/* Spoon */}
      <g transform="translate(85, 0) rotate(8, 15, 80)">
        <rect x="11" y="22" width="9" height="90" rx="4.5" fill="#C4956A"/>
        <ellipse cx="15.5" cy="14" rx="12" ry="16" fill="#D4A880"/>
        <ellipse cx="13" cy="10" rx="6.5" ry="8.5" fill="#EAC89E" opacity="0.48"/>
      </g>
      {/* Bento plate */}
      <g transform="translate(2, 55) rotate(-10, 54, 50)">
        <rect x="4" y="4" width="92" height="82" rx="14" fill="#F5E2C8"/>
        <rect x="4" y="4" width="92" height="20" rx="10" fill="#E3C49A"/>
        <rect x="9" y="27" width="40" height="36" rx="8" fill="#FFE4CC"/>
        <rect x="53" y="27" width="38" height="17" rx="6" fill="#C8E8C0"/>
        <rect x="53" y="46" width="38" height="17" rx="6" fill="#FFE0A8"/>
        <circle cx="29" cy="45" r="12" fill="#FF7A45" opacity="0.62"/>
        <circle cx="25" cy="40" r="5.5" fill="#FFAA7A" opacity="0.72"/>
        <rect x="9" y="66" width="82" height="16" rx="6" fill="#FAFAED"/>
        {/* Cherry decoration */}
        <circle cx="70" cy="44" r="6.5" fill="#FF5B5B"/>
        <path d="M70 37 Q77 27 83 30" stroke="#5CB85C" strokeWidth="2.2" strokeLinecap="round"/>
      </g>
    </svg>
  );
}

export default function HomeHeader() {
  return (
    <div className="relative px-5 pt-14 pb-8 overflow-hidden">
      {/* Leaf - top left */}
      <div className="absolute top-0 left-0 pointer-events-none select-none">
        <LeafDecoration />
      </div>

      {/* Utensils + bento - top right, partially outside */}
      <div className="absolute -top-2 -right-2 pointer-events-none select-none">
        <UtensilsDecoration />
      </div>

      {/* Notification bell */}
      <button className="absolute top-14 right-5 z-10 w-11 h-11 bg-white rounded-full flex items-center justify-center active:scale-95 transition-transform duration-150" style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.10)' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        <span className="absolute -top-1 -right-0.5 w-5 h-5 bg-red-500 rounded-full text-white flex items-center justify-center font-bold leading-none" style={{ fontSize: '10px' }}>2</span>
      </button>

      {/* Title + Subtitle — 放在葉子上層 */}
      <div className="relative" style={{ zIndex: 1 }}>
        <h1 className="font-black leading-none mt-4 tracking-tight" style={{ fontSize: '46px' }}>
          <span style={{ color: '#2D2D2D' }}>上班</span>
          <span style={{ color: '#FF7A45' }}>吃什麼</span>
          <span className="inline-block ml-2 drop-shadow-sm" style={{ fontSize: '38px' }}>😋</span>
        </h1>

        <p className="mt-2.5 text-stone-500 font-medium" style={{ fontSize: '13.5px' }}>
          福委特約店家，{' '}
          <span className="relative inline-block">
            今天午餐輕鬆選
            <svg className="absolute left-0 w-full" style={{ bottom: '-3px', height: '5px' }} viewBox="0 0 80 5" preserveAspectRatio="none">
              <path d="M0 4 Q10 1 20 4 Q30 7 40 4 Q50 1 60 4 Q70 7 80 4" stroke="#FF7A45" strokeWidth="2.4" fill="none" strokeLinecap="round"/>
            </svg>
          </span>
        </p>
      </div>
    </div>
  );
}
