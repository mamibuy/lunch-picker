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

// 把地址文字轉換成座標，透過 OpenStreetMap Nominatim（免費，不需金鑰）
export async function geocodeAddress(address: string): Promise<LatLng> {
  async function query(params: Record<string, string>) {
    const url = 'https://nominatim.openstreetmap.org/search?' + new URLSearchParams(params);
    const res = await fetch(url, {
      headers: { 'Accept-Language': 'zh-TW,zh;q=0.9', 'User-Agent': 'lunch-picker-app/1.0' },
    });
    if (!res.ok) throw new Error('地址查詢失敗');
    return res.json();
  }

  // 把「80號」之後（含）的門牌號去掉，只留到路/街名，讓 Nominatim 容易比對
  const noNum = address.replace(/\d+之?\d*號.*$/, '').trim();

  // 依序嘗試不同格式，遇到有結果立刻回傳
  const candidates: Record<string, string>[] = [
    { q: address,           format: 'json', limit: '1', countrycodes: 'tw' },
    { q: `台灣 ${address}`, format: 'json', limit: '1' },
    ...(noNum !== address ? [
      { q: `台灣 ${noNum}`, format: 'json', limit: '1', countrycodes: 'tw' },
      { q: noNum,           format: 'json', limit: '1', countrycodes: 'tw' },
    ] : []),
    { q: address,           format: 'json', limit: '1' },
  ];

  for (const params of candidates) {
    const data = await query(params);
    if (data.length) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
  }

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
