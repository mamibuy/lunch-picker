import { fetchShops } from '@/lib/fetchShops';
import ShopList from '@/components/ShopList';
import HomeHeader from '@/components/HomeHeader';
import { FOOD_CATEGORIES } from '@/lib/shops';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const allShops = await fetchShops();
  const shops = allShops.filter(s => (FOOD_CATEGORIES as string[]).includes(s.category));

  return (
    <div className="min-h-screen" style={{ background: '#FDEEDD' }}>
      <div className="max-w-lg mx-auto">
        <HomeHeader />
        <main className="px-4">
          <ShopList shops={shops} />
        </main>
      </div>
    </div>
  );
}
