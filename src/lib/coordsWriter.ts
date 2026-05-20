import { google } from 'googleapis';

// ── Google Maps URL 解析 ──────────────────────────────────────
// 支援短網址（maps.app.goo.gl）和完整網址，server-side 無 CORS 問題
export async function extractCoordsFromMapUrl(
  url: string
): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(5000),
    });
    const finalUrl = res.url;
    // /@lat,lng,zoom 格式（最常見）
    const m = finalUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)[,z]/);
    if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
    // ?q=lat,lng 格式
    const q = new URL(finalUrl).searchParams.get('q') ?? '';
    const qm = q.match(/^(-?\d+\.\d+),(-?\d+\.\d+)$/);
    if (qm) return { lat: parseFloat(qm[1]), lng: parseFloat(qm[2]) };
  } catch {}
  return null;
}

// ── 寫回 Google Sheet V（緯度）、W（經度）欄 ─────────────────
export async function writeShopCoords(
  csvUrl: string,
  rowNum: number,
  lat: number,
  lng: number
): Promise<void> {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  const sheetName = process.env.GOOGLE_SHEET_NAME ?? '工作表1';

  if (!email || !rawKey) return; // 未設定 Service Account，靜默跳過

  const spreadsheetId = csvUrl.match(/\/d\/([a-zA-Z0-9_-]+)/)?.[1];
  if (!spreadsheetId) return;

  try {
    const auth = new google.auth.JWT({
      email,
      key: rawKey.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const sheets = google.sheets({ version: 'v4', auth });
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!V${rowNum}:W${rowNum}`,
      valueInputOption: 'RAW',
      requestBody: { values: [[lat, lng]] },
    });
    console.log(`[試算表] 已寫入座標 row=${rowNum} lat=${lat} lng=${lng}`);
  } catch (e) {
    console.error(`[試算表] 寫入座標失敗 row=${rowNum}:`, e);
  }
}
