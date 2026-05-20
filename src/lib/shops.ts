export type Category = '便當' | '中餐' | '麵食' | '飲料' | '早午餐' | '異國料理' | '火鍋' | '素食' | '燒肉' | '健康餐' | '其他';
export type PriceRange = '$' | '$$' | '$$$';
export type BadgeType = '特約店家' | '附近店家' | '活動優惠';
export const ALL_BADGE_TYPES: BadgeType[] = ['特約店家', '附近店家', '活動優惠'];

export type Shop = {
  id: string;
  name: string;
  category: Category;
  description?: string;
  address: string;
  mapUrl?: string;
  phone?: string;
  priceRange?: PriceRange;
  deal: string;
  walkMinutes?: number;
  photoUrl?: string;
  photos?: string[];
  tags?: string[];
  visible: boolean;
  lat?: number;
  lng?: number;
  badgeType?: string;
};

export const CATEGORY_EMOJI: Record<Category, string> = {
  '便當': '🍱',
  '中餐': '🥢',
  '麵食': '🍜',
  '飲料': '🧋',
  '早午餐': '🥐',
  '異國料理': '🌏',
  '火鍋': '🍲',
  '素食': '🥗',
  '燒肉': '🥩',
  '健康餐': '🥦',
  '其他': '🍽️',
};

export const ALL_CATEGORIES: Category[] = ['便當', '中餐', '麵食', '飲料', '早午餐', '異國料理', '火鍋', '素食', '燒肉', '健康餐', '其他'];
