import { create } from 'zustand';

export interface CartItem {
  id: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  stock: number;
  barcode?: string;
}

interface CartStore {
  items: CartItem[];
  taxRate: number;
  discount: number;

  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  incrementQuantity: (id: string) => void;
  decrementQuantity: (id: string) => void;
  setDiscount: (discount: number) => void;
  setTaxRate: (rate: number) => void;
  clearCart: () => void;

  get subtotal(): number;
  get tax(): number;
  get total(): number;
  get itemCount(): number;
}

export const useCartStore = create<CartStore>()((set, get) => ({
  items: [],
  taxRate: 0.1,
  discount: 0,

  addItem: (item) =>
    set((state) => {
      const existing = state.items.find((i) => i.id === item.id);
      if (existing) {
        if (existing.quantity < item.stock) {
          return {
            items: state.items.map((i) =>
              i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
            ),
          };
        }
        return state;
      }
      return { items: [...state.items, { ...item, quantity: 1 }] };
    }),

  removeItem: (id) =>
    set((state) => ({
      items: state.items.filter((i) => i.id !== id),
    })),

  updateQuantity: (id, quantity) =>
    set((state) => ({
      items: state.items
        .map((i) => {
          if (i.id === id) {
            if (quantity <= 0) return null;
            if (quantity > i.stock) return i;
            return { ...i, quantity };
          }
          return i;
        })
        .filter(Boolean) as CartItem[],
    })),

  incrementQuantity: (id) => {
    const state = get();
    const item = state.items.find((i) => i.id === id);
    if (item && item.quantity < item.stock) {
      set({
        items: state.items.map((i) =>
          i.id === id ? { ...i, quantity: i.quantity + 1 } : i
        ),
      });
    }
  },

  decrementQuantity: (id) => {
    const state = get();
    const item = state.items.find((i) => i.id === id);
    if (item) {
      if (item.quantity <= 1) {
        set({ items: state.items.filter((i) => i.id !== id) });
      } else {
        set({
          items: state.items.map((i) =>
            i.id === id ? { ...i, quantity: i.quantity - 1 } : i
          ),
        });
      }
    }
  },

  setDiscount: (discount) => set({ discount }),
  setTaxRate: (taxRate) => set({ taxRate }),
  clearCart: () => set({ items: [], discount: 0 }),

  get subtotal() {
    return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  },

  get tax() {
    const state = get();
    return (state.subtotal - state.discount) * state.taxRate;
  },

  get total() {
    const state = get();
    return state.subtotal - state.discount + state.tax;
  },

  get itemCount() {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },
}));
