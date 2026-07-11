import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { api } from '../api';
import { useAuth } from './AuthContext';

export interface CartItem {
  cart_item_id: string;
  id: string;
  brand_name: string;
  price: number;
  discount_percent: number;
  image_url: string;
  quantity: number;
  requires_prescription: number;
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotal: number;
  refresh: () => Promise<void>;
  addItem: (medicineId: string, quantity?: number) => Promise<void>;
  removeItem: (medicineId: string) => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);

  const refresh = useCallback(async () => {
    if (!user) {
      setItems([]);
      return;
    }
    try {
      const data = await api.get('/api/cart');
      setItems(data.items || []);
    } catch {
      setItems([]);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function addItem(medicineId: string, quantity = 1) {
    await api.post('/api/cart', { medicineId, quantity });
    await refresh();
  }

  async function removeItem(medicineId: string) {
    await api.del(`/api/cart/${medicineId}`);
    await refresh();
  }

  const count = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.price * (1 - i.discount_percent / 100), 0);

  return (
    <CartContext.Provider value={{ items, count, subtotal, refresh, addItem, removeItem }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
