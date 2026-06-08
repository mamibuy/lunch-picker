import { Shop, Category, PriceRange, BadgeType, ALL_CATEGORIES, ALL_BADGE_TYPES } from './shops';
import { extractCoordsFromMapUrl, writeShopCoords } from './coordsWriter';

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
  // D 欄：地址（先試標題，再用位置 index 3 備援）
  const address   = get('地址') || (values[3] ?? '').trim();
  // H 欄：支援多種標題名稱（特約內容 / 優惠資訊 / 特約優惠）
  const deal      = get('特約內容') || get('優惠資訊') || get('特約優惠');
  const visible   = get('是否顯示');
  // T 欄：先試標題名稱，全部找不到就直接讀第 20 欄（T 欄）的值
  const badgeByName = get('店家標籤') || get('店家類型') || get('標籤類型') || get('類型') || get('Badge') || get('badge') || get('type');
  const colT        = (values[19] ?? '').trim();
  // 如果 colT 是 URL（照片連結）就不用；否則當備援
  const badgeRaw    = badgeByName || (colT && !colT.startsWith('http') ? colT : '');

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
  // 先試欄位標題，再用 V（index 21）、W（index 22）位置備援（系統自動填入的座標）
  const latRaw = get('緯度') || get('Lat') || (values[21] ?? '').trim();
  const lngRaw = get('經度') || get('Lng') || (values[22] ?? '').trim();
  const lat = parseFloat(latRaw);
  const lng = parseFloat(lngRaw);
  // W 欄：foodpanda 訂餐連結（先試標題，再用位置 index 22 備援，限 http 開頭）
  const foodpandaUrl = get('foodpanda訂餐連結') || (() => {
    const colW = (values[22] ?? '').trim();
    return colW.startsWith('http') ? colW : '';
  })() || undefined;

  const tagsRaw = get('標籤');
  // U 欄：營業時間（先試標題，再用位置 index 20）
  const hoursRaw = get('營業時間') || get('時間') || get('開放時間') || (() => {
    const colU = (values[20] ?? '').trim();
    return colU && !colU.startsWith('http') ? colU : '';
  })();

  return {
    id: String(rowNum),
    name,
    category: category as Category,
    description:  get('介紹')    || undefined,
    address,
    // E 欄：地圖連結（先試多種標題，再用位置 index 4 備援，限 http 開頭）
    mapUrl: get('地圖連結') || get('Google連結') || get('地標連結') || get('Google地圖') || (() => {
      const colE = (values[4] ?? '').trim();
      return colE.startsWith('http') ? colE : '';
    })() || undefined,
    phone:        get('電話')     || undefined,
    priceRange:   (['$', '$$', '$$$'].includes(priceRaw) ? priceRaw : undefined) as PriceRange | undefined,
    deal: deal || undefined,
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
    hours:        hoursRaw || undefined,
    foodpandaUrl,
    lineUrl: get('LINE@連結') || get('LINE@') || get('line') || undefined,
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
  console.log('[試算表] 所有欄位標題：', headers.map((h, i) => `${String.fromCharCode(65 + i)}欄="${h}"`).join(' | '));
  // 特別印出 T 欄（index 19）實際標題，方便比對
  console.log(`[試算表] T欄標題偵測 → "${headers[19] ?? '（無此欄）'}"`);

  const shops: Shop[] = [];

  dataRows.forEach((row, i) => {
    const shop = rowToShop(headers, row, i + 2); // +2 因為第 1 列是標題
    if (shop) {
      console.log(`[試算表] 第 ${i + 2} 列：${shop.name} ／ 分類=${shop.category} ／ 標籤=${shop.badgeType} ／ 優惠=${(shop.deal ?? '').slice(0, 20)}`);
      shops.push(shop);
    }
  });

  // 對沒有座標但有 Google Maps URL 的店家，server-side 解析座標並寫回 V/W 欄
  const needCoords = shops.filter((s) => s.lat == null && s.lng == null && s.mapUrl);
  if (needCoords.length > 0) {
    console.log(`[試算表] 共 ${needCoords.length} 家店需解析座標...`);
    await Promise.all(
      needCoords.map(async (shop) => {
        const coords = await extractCoordsFromMapUrl(shop.mapUrl!);
        if (coords) {
          shop.lat = coords.lat;
          shop.lng = coords.lng;
          console.log(`[試算表] ${shop.name} → lat=${coords.lat} lng=${coords.lng}`);
          // 寫回試算表 V/W 欄（需設定 GOOGLE_SERVICE_ACCOUNT_EMAIL / PRIVATE_KEY）
          writeShopCoords(url, parseInt(shop.id), coords.lat, coords.lng).catch(() => {});
        }
      })
    );
  }

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

// ── 從 Supabase 讀取 ─────────────────────────────────────────
async function fetchShopsFromSupabase(visibleOnly = true): Promise<Shop[]> {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  let query = supabase.from('shops').select('*').order('name');
  if (visibleOnly) query = query.eq('visible', true);

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id as string,
    name: row.name as string,
    category: row.category as Category,
    description: row.description ?? undefined,
    address: row.address as string,
    mapUrl: row.map_url ?? undefined,
    phone: row.phone ?? undefined,
    priceRange: row.price_range as PriceRange | undefined,
    deal: row.deal ?? undefined,
    tags: (row.tags as string[] | null) ?? undefined,
    photos: (row.photos as string[] | null) ?? undefined,
    photoUrl: row.photo_url ?? undefined,
    badgeType: row.badge_type ?? '附近店家',
    hours: row.hours ?? undefined,
    lat: row.lat ?? undefined,
    lng: row.lng ?? undefined,
    foodpandaUrl: row.foodpanda_url ?? undefined,
    lineUrl: row.line_url ?? undefined,
    walkMinutes: row.walk_minutes ?? undefined,
    visible: row.visible as boolean,
  }));
}

// ── 對外介面 ──────────────────────────────────────────────────
export async function fetchShops(): Promise<Shop[]> {
  // 優先從 Supabase 讀取
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      return await fetchShopsFromSupabase(true);
    } catch (e) {
      console.error('[Supabase] 讀取失敗，改用備援：', e);
    }
  }

  // Fallback: Google Sheets
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

// 後台用：讀取所有店家（含隱藏），需要 service_role key
export async function fetchAllShopsForAdmin(): Promise<Shop[]> {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase.from('shops').select('*').order('name');
  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id as string,
    name: row.name as string,
    category: row.category as Category,
    description: row.description ?? undefined,
    address: row.address as string,
    mapUrl: row.map_url ?? undefined,
    phone: row.phone ?? undefined,
    priceRange: row.price_range as PriceRange | undefined,
    deal: row.deal ?? undefined,
    tags: (row.tags as string[] | null) ?? undefined,
    photos: (row.photos as string[] | null) ?? undefined,
    photoUrl: row.photo_url ?? undefined,
    badgeType: row.badge_type ?? '附近店家',
    hours: row.hours ?? undefined,
    lat: row.lat ?? undefined,
    lng: row.lng ?? undefined,
    foodpandaUrl: row.foodpanda_url ?? undefined,
    lineUrl: row.line_url ?? undefined,
    walkMinutes: row.walk_minutes ?? undefined,
    visible: row.visible as boolean,
  }));
}
