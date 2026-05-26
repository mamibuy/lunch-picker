import { fetchShops } from '@/lib/fetchShops';
import { NextResponse } from 'next/server';

export const revalidate = 300; // 快取 5 分鐘

export async function GET() {
  const shops = await fetchShops();
  return NextResponse.json(shops);
}
