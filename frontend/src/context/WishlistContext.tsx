import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { api } from '../api';
import { useAuth } from './AuthContext';

interface WishlistContextValue {
  items: any[];
  ids: Set<string>;
  refresh: () => Promise<void>;
  toggle: (medicineId: string) => Promise<void>;
  isInWishlist: (medicineId: string) => boolean;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [ids, setIds] = useState<Set<string>>(new Set());

  const refresh = useCallback(async () => {
    if (!user) { setItems([]); setIds(new Set()); return; }
    try {
      const data = await api.get('/api/wishlist');
      setItems(data.items || []);
      setIds(new Set((data.items || []).map((i: any) => i.id)));
    } catch { setItems([]); setIds(new Set()); }
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  async function toggle(medicineId: string) {
    if (ids.has(medicineId)) {
      await api.del(`/api/wishlist/${medicineId}`);
    } else {
      await api.post('/api/wishlist', { medicineId });
    }
    await refresh();
  }

  function isInWishlist(medicineId: string) { return ids.has(medicineId); }

  return (
    <WishlistContext.Provider value={{ items, ids, refresh, toggle, isInWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
}
