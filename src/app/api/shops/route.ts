import { fetchShops } from '@/lib/fetchShops';
import { NextResponse } from 'next/server';

export async function GET() {
  const shops = await fetchShops();
  return NextResponse.json(shops);
}
