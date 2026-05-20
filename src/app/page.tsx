import { fetchShops } from '@/lib/fetchShops';
import ShopList from '@/components/ShopList';
import HomeHeader from '@/components/HomeHeader';
import BottomNav from '@/components/BottomNav';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const shops = await fetchShops();

  return (
    <div className="min-h-screen pb-24" style={{ background: 'linear-gradient(180deg, #FFF4E0 0%, #FFEBC8 60%, #FFE8C0 100%)' }}>
      <div className="max-w-lg mx-auto">
        <HomeHeader />
        <main className="px-4">
          <ShopList shops={shops} />
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
