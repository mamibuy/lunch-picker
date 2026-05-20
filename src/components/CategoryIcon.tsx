type Props = { className?: string };
const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export function BentoIcon({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <rect x="2" y="5" width="20" height="15" rx="3"/>
      <line x1="12" y1="5" x2="12" y2="20"/>
      <line x1="2" y1="12.5" x2="12" y2="12.5"/>
      <circle cx="7" cy="9" r="2" fill="currentColor" stroke="none"/>
    </svg>
  );
}

export function ChopsticksIcon({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M7 3 L6 21"/>
      <path d="M17 3 L18 21"/>
      <path d="M6.5 11 Q12 9 17.5 11"/>
    </svg>
  );
}

export function NoodleIcon({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M4 9 Q12 5 20 9"/>
      <path d="M4 9 L5 18 Q12 21 19 18 L20 9"/>
      <path d="M8 7 Q10 4 12 7"/>
      <path d="M12 7 Q14 4 16 7"/>
    </svg>
  );
}

export function DrinkIcon({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M6 9 L8 20 Q12 22 16 20 L18 9 Z"/>
      <line x1="5" y1="9" x2="19" y2="9"/>
      <line x1="15" y1="4" x2="15" y2="17"/>
      <circle cx="15" cy="3.5" r="1.5" fill="currentColor" stroke="none"/>
    </svg>
  );
}

export function BrunchIcon({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="13" r="7"/>
      <line x1="5" y1="5" x2="5" y2="9"/>
      <path d="M3 5 L7 5"/>
      <path d="M19 5 Q21 7 19 9"/>
    </svg>
  );
}

export function GlobeIcon({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="9"/>
      <path d="M3 12 Q7 9 12 12 Q17 15 21 12"/>
      <path d="M12 3 Q9 7 12 12 Q15 17 12 21"/>
    </svg>
  );
}

export function HotpotIcon({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M5 11 L6 19 Q12 22 18 19 L19 11 Z"/>
      <line x1="4" y1="11" x2="20" y2="11"/>
      <path d="M9 5 Q8 7 9 9" strokeLinecap="round"/>
      <path d="M15 5 Q14 7 15 9" strokeLinecap="round"/>
      <line x1="8" y1="19" x2="8" y2="22"/>
      <line x1="16" y1="19" x2="16" y2="22"/>
    </svg>
  );
}

export function LeafIcon({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M12 21 C 12 21 4 15 4 9 C 4 5 8 3 12 5 C 16 3 20 5 20 9 C 20 15 12 21 12 21 Z"/>
      <line x1="12" y1="5" x2="11" y2="21"/>
    </svg>
  );
}

export function FlameIcon({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M8 21 C 4 17 4 12 7 8 C 8 11 10 12 10 12 C 10 12 9 8 12 4 C 14 8 16 8 16 14 C 17 12 18 10 17 7 C 20 10 20 16 17 20 C 15 22 10 22 8 21 Z"/>
    </svg>
  );
}

export function HealthIcon({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      <path d="M12 8 Q12 14 10 18" strokeWidth="1.2"/>
    </svg>
  );
}

export function DotsIcon({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <circle cx="5" cy="12" r="2" fill="currentColor" stroke="none"/>
      <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/>
      <circle cx="19" cy="12" r="2" fill="currentColor" stroke="none"/>
    </svg>
  );
}

import { Category } from '@/lib/shops';

export function CategoryIcon({ category, className }: { category: Category; className?: string }) {
  switch (category) {
    case '便當': return <BentoIcon className={className}/>;
    case '中餐': return <ChopsticksIcon className={className}/>;
    case '麵食': return <NoodleIcon className={className}/>;
    case '飲料': return <DrinkIcon className={className}/>;
    case '早午餐': return <BrunchIcon className={className}/>;
    case '異國料理': return <GlobeIcon className={className}/>;
    case '火鍋': return <HotpotIcon className={className}/>;
    case '素食': return <LeafIcon className={className}/>;
    case '燒肉': return <FlameIcon className={className}/>;
    case '健康餐': return <HealthIcon className={className}/>;
    default: return <DotsIcon className={className}/>;
  }
}
