import { fetchShops } from '@/lib/fetchShops';
import ShopList from '@/components/ShopList';
import TinderButton from '@/components/TinderButton';

export default async function HomePage() {
  const shops = await fetchShops();

  return (
    <div className="min-h-screen bg-orange-50">
      <header className="px-4 pt-10 pb-6 bg-orange-100">
        <h1 className="text-3xl font-black tracking-tight text-stone-800">上班吃什麼 🍽️</h1>
        <p className="mt-1 text-sm text-orange-600">今天吃什麼，福委幫你找 🤤</p>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4">
        <TinderButton shops={shops} />
        <ShopList shops={shops} />
      </main>
    </div>
  );
}
