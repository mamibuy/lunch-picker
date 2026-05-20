export type LatLng = { lat: number; lng: number };

// 計算兩個座標之間的直線距離（公里），使用 Haversine 公式
export function haversineDistance(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const sin2 =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(sin2));
}

const NOMINATIM_HEADERS = { 'Accept-Language': 'zh-TW,zh;q=0.9', 'User-Agent': 'lunch-picker-app/1.0' };

async function nominatimQuery(q: string, extra?: Record<string, string>): Promise<LatLng | null> {
  const url = 'https://nominatim.openstreetmap.org/search?' +
    new URLSearchParams({ q, format: 'json', limit: '1', ...extra });
  const res = await fetch(url, { headers: NOMINATIM_HEADERS });
  if (!res.ok) return null;
  const data: { lat: string; lon: string }[] = await res.json();
  return data.length ? { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) } : null;
}

// 把地址文字轉換成座標（最多兩次請求，每次間隔 1.2s）
export async function geocodeAddress(address: string): Promise<LatLng> {
  // 去掉門牌號（Nominatim 對台灣門牌號比對率極低，只留路名效果更好）
  const noNum = address.replace(/\d+之?\d*號.*$/, '').trim();

  // 第一次：去門牌版本（最有效），加台灣前綴 + 限定 tw
  const r1 = await nominatimQuery(`台灣 ${noNum || address}`, { countrycodes: 'tw' });
  if (r1) return r1;

  // 第二次：完整地址（不限 countrycodes），間隔 1.2s 避免速率限制
  await new Promise(r => setTimeout(r, 1200));
  const r2 = await nominatimQuery(`台灣 ${address}`);
  if (r2) return r2;

  throw new Error('找不到這個地址，可以試著輸入較短的地址，例如「板橋區裕民街」');
}

// 距離格式化：100 公尺以下顯示公尺，以上顯示公里
export function formatDistance(km: number): string {
  if (km < 0.1) return `${Math.round(km * 1000)} 公尺`;
  return `${km.toFixed(1)} 公里`;
}

// 直線距離換算步行分鐘（市區路徑係數 1.3、步行速度 5 km/h）
export function toWalkMinutes(distanceKm: number): number {
  return Math.max(1, Math.round(distanceKm * 1.3 * 12));
}

// 批次查詢店家座標用：最多送兩次請求，回傳 null 代表找不到，不拋例外
export async function geocodeAddressOnce(address: string): Promise<LatLng | null> {
  try {
    const noNum = address.replace(/\d+之?\d*號.*$/, '').trim();
    // 第一次：去門牌版本（通常最有效）
    const r1 = await nominatimQuery(`台灣 ${noNum || address}`, { countrycodes: 'tw' });
    if (r1) return r1;

    // 第二次：完整地址（間隔 1.2s）
    if (!noNum || noNum === address) return null;
    await new Promise(r => setTimeout(r, 1200));
    return await nominatimQuery(`台灣 ${address}`, { countrycodes: 'tw' });
  } catch { return null; }
}
