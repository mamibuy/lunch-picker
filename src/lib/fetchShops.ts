import { Shop, Category, PriceRange, BadgeType, ALL_CATEGORIES, ALL_BADGE_TYPES } from './shops';

// ── CSV 解析 ──────────────────────────────────────────────────
// 處理 Google Sheets 匯出的 CSV（欄位值如有逗號會被雙引號包住）
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let cells: string[] = [];
  let cur = '';
  let inQuote = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (inQuote && text[i + 1] === '"') { cur += '"'; i++; }
      else inQuote = !inQuote;
    } else if (ch === ',' && !inQuote) {
      cells.push(cur.trim()); cur = '';
    } else if ((ch === '\n' || ch === '\r') && !inQuote) {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      cells.push(cur.trim());
      if (cells.some(c => c)) rows.push(cells);
      cells = []; cur = '';
    } else {
      cur += ch;
    }
  }
  if (cur.trim() || cells.length > 0) {
    cells.push(cur.trim());
    if (cells.some(c => c)) rows.push(cells);
  }
  return rows;
}

function rowToShop(headers: string[], values: string[], rowNum: number): Shop | null {
  const get = (col: string) => (values[headers.indexOf(col)] ?? '').trim();

  const name      = get('店名');
  const category  = get('分類');
  const address   = get('地址');
  // H 欄：支援多種標題名稱（特約內容 / 優惠資訊 / 特約優惠）
  const deal      = get('特約內容') || get('優惠資訊') || get('特約優惠');
  const visible   = get('是否顯示');
  // T 欄：支援多種標題名稱
  const badgeRaw  = get('店家標籤') || get('店家類型') || get('類型') || get('Badge') || get('badge');

  // 「是否顯示」明確填「否」才隱藏；空白或欄位不存在都預設顯示
  if (visible === '否') return null;

  // 必填欄位檢查（特約內容如未填，顯示預設文字，不跳過）
  if (!name || !category || !address) {
    console.warn(`[試算表] 第 ${rowNum} 列缺少必填欄位（店名、分類、地址），已跳過`);
    return null;
  }

  // 分類必須在允許清單內
  if (!(ALL_CATEGORIES as string[]).includes(category)) {
    console.warn(`[試算表] 第 ${rowNum} 列的分類「${category}」不在允許範圍，已跳過`);
    return null;
  }

  const priceRaw = get('價位');
  const lat = parseFloat(get('緯度'));
  const lng = parseFloat(get('經度'));
  const tagsRaw = get('標籤');

  return {
    id: String(rowNum),
    name,
    category: category as Category,
    description:  get('介紹')    || undefined,
    address,
    mapUrl:       get('地圖連結') || undefined,
    phone:        get('電話')     || undefined,
    priceRange:   (['$', '$$', '$$$'].includes(priceRaw) ? priceRaw : undefined) as PriceRange | undefined,
    deal: deal || '（特約內容待補）',
    photos: (() => {
      const list = [
        get('照片1') || get('照片連結'),
        ...Array.from({ length: 9 }, (_, i) => get(`照片${i + 2}`)),
      ].filter(Boolean) as string[];
      return list.length > 0 ? list : undefined;
    })(),
    photoUrl: get('照片1') || get('照片連結') || undefined,
    tags:         tagsRaw ? tagsRaw.split(/[,，、]/).map((t) => t.trim()).filter(Boolean) : undefined,
    visible:      true,
    lat:          isNaN(lat) ? undefined : lat,
    lng:          isNaN(lng) ? undefined : lng,
    badgeType:    badgeRaw || '特約店家',
  };
}

// ── 從 Google Sheet 讀取 ──────────────────────────────────────
async function fetchFromSheet(url: string): Promise<Shop[]> {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const text = await res.text();
  const [headerRow, ...dataRows] = parseCSV(text);
  if (!headerRow) return [];

  const headers = headerRow.map((h) => h.trim());
  console.log('[試算表] 讀取到的欄位標題：', headers.join(' | '));

  const shops: Shop[] = [];

  dataRows.forEach((row, i) => {
    const shop = rowToShop(headers, row, i + 2); // +2 因為第 1 列是標題
    if (shop) {
      console.log(`[試算表] 第 ${i + 2} 列：${shop.name} ／ 分類=${shop.category} ／ 標籤=${shop.badgeType} ／ 優惠=${shop.deal.slice(0, 20)}`);
      shops.push(shop);
    }
  });

  return shops;
}

// ── 假資料（Google Sheet 未設定或讀取失敗時的備援）────────────
function getMockShops(): Shop[] {
  return [
    {
      id: 'mock-1', name: '王記香雞便當', category: '便當',
      description: '滷得入味的雞腿便當，份量超實在',
      address: '台北市信義區忠孝東路五段 123 號',
      mapUrl: 'https://maps.google.com/?q=台北市信義區忠孝東路五段123號',
      phone: '02-2345-6789', priceRange: '$',
      deal: '憑員工證 9 折，加購飲料再折 5 元',
      tags: ['份量大', '快出餐', '有素食便當'],
      lat: 25.0413, lng: 121.5643, visible: true,
    },
    {
      id: 'mock-2', name: '山河日式拉麵', category: '麵食',
      description: '熬煮 12 小時的豬骨湯底，香濃不膩',
      address: '台北市信義區松仁路 56 號',
      mapUrl: 'https://maps.google.com/?q=台北市信義區松仁路56號',
      phone: '02-2765-4321', priceRange: '$$',
      deal: '員工憑識別證，加麵免費',
      tags: ['有冷氣座位', '可外帶'],
      lat: 25.0367, lng: 121.5652, visible: true,
    },
    {
      id: 'mock-3', name: '珍珠老舖', category: '飲料',
      description: '用古早味紅茶、現煮珍珠，喝得到真材實料',
      address: '台北市信義區信義路五段 7 號',
      priceRange: '$', deal: '員工價 8 折，大杯升特大杯不加價',
      tags: ['可微糖', '有冰沙', '等候快'],
      lat: 25.0333, lng: 121.5640, visible: true,
    },
  ];
}

// ── 對外介面 ──────────────────────────────────────────────────
export async function fetchShops(): Promise<Shop[]> {
  const url = process.env.SHEET_CSV_URL;

  if (url) {
    try {
      return await fetchFromSheet(url);
    } catch (e) {
      console.error('[試算表] 讀取失敗，改用備援假資料：', e);
    }
  }

  return getMockShops();
}

export async function fetchShopById(id: string): Promise<Shop | undefined> {
  const shops = await fetchShops();
  return shops.find((s) => s.id === id);
}
