'use client';
import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { migrateLocalData } from '@/lib/auth/migrateLocalData';
import type { User } from '@supabase/supabase-js';

export type Profile = {
  id: string;
  email: string;
  display_name: string | null;
  department: string | null;
  avatar_url: string | null;
  phone: string | null;
  common_address: string | null;
  birthday_md: string | null;
  is_staff_committee: boolean;
  is_active: boolean;
};

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  favIds: string[];
  migrationDone: boolean;
  toggleFav: (shopId: string) => void;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null, profile: null, loading: true,
  favIds: [], migrationDone: false,
  toggleFav: () => {}, signOut: async () => {}, refreshProfile: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

const FAV_KEY = 'lp-fav-shops';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [favIds, setFavIds] = useState<string[]>([]);
  const [migrationDone, setMigrationDone] = useState(false);

  // refs to avoid stale closures in toggleFav
  const userRef = useRef<User | null>(null);
  const favIdsRef = useRef<string[]>([]);
  useEffect(() => { userRef.current = user; }, [user]);
  useEffect(() => { favIdsRef.current = favIds; }, [favIds]);

  const supabase = createBrowserClient();

  async function fetchProfile(userId: string) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    setProfile(data ?? null);
  }

  async function loadFavorites(userId: string | null) {
    if (!userId) {
      try { setFavIds(JSON.parse(localStorage.getItem(FAV_KEY) ?? '[]')); } catch { setFavIds([]); }
      return;
    }
    const { data } = await supabase.from('favorites').select('shop_id').eq('user_id', userId);
    setFavIds((data ?? []).map((r: { shop_id: string }) => r.shop_id));
  }

  async function refreshProfile() {
    if (userRef.current) await fetchProfile(userRef.current.id);
  }

  function toggleFav(shopId: string) {
    const currentIds = favIdsRef.current;
    const isCurrentlyFav = currentIds.includes(shopId);
    const newIds = isCurrentlyFav
      ? currentIds.filter(id => id !== shopId)
      : [...currentIds, shopId];

    // 樂觀更新 UI
    setFavIds(newIds);

    // 背景同步
    const currentUser = userRef.current;
    (async () => {
      try {
        if (!currentUser) {
          localStorage.setItem(FAV_KEY, JSON.stringify(newIds));
        } else if (isCurrentlyFav) {
          await supabase.from('favorites').delete()
            .eq('user_id', currentUser.id).eq('shop_id', shopId);
        } else {
          await supabase.from('favorites').insert({ user_id: currentUser.id, shop_id: shopId });
        }
      } catch {
        setFavIds(currentIds); // rollback
      }
    })();
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) fetchProfile(user.id);
      loadFavorites(user?.id ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const newUser = session?.user ?? null;
      setUser(newUser);
      if (newUser) {
        fetchProfile(newUser.id);
        if (event === 'SIGNED_IN') {
          const didMigrate = await migrateLocalData(newUser.id);
          if (didMigrate) setMigrationDone(true);
        }
        await loadFavorites(newUser.id);
      } else {
        setProfile(null);
        loadFavorites(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    loadFavorites(null);
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, favIds, migrationDone, toggleFav, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
