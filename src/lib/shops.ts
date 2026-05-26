export type FoodCategory = '便當' | '中餐' | '麵食' | '飲料' | '早午餐' | '異國料理' | '火鍋' | '素食' | '燒肉' | '健康餐' | '其他';
export type ServiceCategory = '美髮' | '美甲' | '美睫' | '按摩' | '美容' | '美體' | '紓壓' | '體驗服務';
export type Category = FoodCategory | ServiceCategory;
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
  deal?: string;
  walkMinutes?: number;
  photoUrl?: string;
  photos?: string[];
  tags?: string[];
  visible: boolean;
  lat?: number;
  lng?: number;
  badgeType?: string;
  hours?: string;
  foodpandaUrl?: string;
  lineUrl?: string;
};

export const FOOD_CATEGORIES: FoodCategory[] = ['便當', '中餐', '麵食', '飲料', '早午餐', '異國料理', '火鍋', '素食', '燒肉', '健康餐', '其他'];
export const SERVICE_CATEGORIES: ServiceCategory[] = ['美髮', '美甲', '美睫', '按摩', '美容', '美體', '紓壓', '體驗服務'];
export const ALL_CATEGORIES: Category[] = [...FOOD_CATEGORIES, ...SERVICE_CATEGORIES];

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
  '美髮': '💇',
  '美甲': '💅',
  '美睫': '👁️',
  '按摩': '💆',
  '美容': '✨',
  '美體': '🌿',
  '紓壓': '🛁',
  '體驗服務': '🎁',
};
