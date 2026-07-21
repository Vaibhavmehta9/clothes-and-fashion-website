import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/api';

interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'customer' | 'vendor' | 'admin' | 'support';
  avatar?: string;
  isEmailVerified: boolean;
  wishlist: string[];
}

interface VendorProfile {
  _id: string;
  storeName: string;
  storeSlug: string;
  status: string;
}

interface AuthState {
  user: User | null;
  vendorProfile: VendorProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (data: { name: string; email: string; password: string; phone?: string; role?: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
  refreshUser: () => Promise<void>;
  toggleWishlist: (productId: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      vendorProfile: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post('/auth/login', { email, password });
          const { user, accessToken, refreshToken, vendorProfile } = data.data;
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
          set({ user, accessToken, refreshToken, vendorProfile, isAuthenticated: true });
        } finally {
          set({ isLoading: false });
        }
      },

      register: async (formData) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post('/auth/register', formData);
          const { user, accessToken, refreshToken } = data.data;
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
          set({ user, accessToken, refreshToken, isAuthenticated: true });
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        try {
          const { refreshToken } = get();
          await api.post('/auth/logout', { refreshToken });
        } catch { /* ignore */ }
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        set({ user: null, vendorProfile: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      },

      updateUser: (updates) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        }));
      },

      refreshUser: async () => {
        try {
          const { data } = await api.get('/auth/me');
          set({ user: data.data });
        } catch { /* ignore */ }
      },

      toggleWishlist: (productId) => {
        set((state) => {
          if (!state.user) return state;
          const isWishlisted = state.user.wishlist.includes(productId);
          return {
            user: {
              ...state.user,
              wishlist: isWishlisted
                ? state.user.wishlist.filter((id) => id !== productId)
                : [...state.user.wishlist, productId],
            },
          };
        });
      },
    }),
    {
      name: 'styleverse-auth',
      partialize: (state) => ({
        user: state.user,
        vendorProfile: state.vendorProfile,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// ---- CART STORE ----
interface CartItem {
  _id: string;
  product: {
    _id: string;
    name: string;
    slug: string;
    thumbnail: string;
    vendor: { storeName: string };
  };
  variant: {
    _id: string;
    color: string;
    size: string;
    price: number;
    mrp: number;
    discount: number;
    stock: number;
    images: string[];
  };
  quantity: number;
  price: number;
  mrp: number;
}

interface Cart {
  items: CartItem[];
  subtotal: number;
  discount: number;
  couponDiscount: number;
  shippingFee: number;
  total: number;
  coupon?: { code: string; type: string; value: number };
}

interface CartStore {
  cart: Cart | null;
  isLoading: boolean;
  fetchCart: () => Promise<void>;
  addToCart: (productId: string, variantId: string, quantity?: number) => Promise<void>;
  updateItem: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  applyCoupon: (code: string) => Promise<string>;
  removeCoupon: () => Promise<void>;
}

export const useCartStore = create<CartStore>((set, get) => ({
  cart: null,
  isLoading: false,

  fetchCart: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get('/cart');
      set({ cart: data.data });
    } catch { /* ignore */ } finally {
      set({ isLoading: false });
    }
  },

  addToCart: async (productId, variantId, quantity = 1) => {
    const { data } = await api.post('/cart/add', { productId, variantId, quantity });
    set({ cart: data.data });
  },

  updateItem: async (itemId, quantity) => {
    const { data } = await api.put(`/cart/${itemId}`, { quantity });
    set({ cart: data.data });
  },

  removeItem: async (itemId) => {
    const { data } = await api.delete(`/cart/${itemId}`);
    set({ cart: data.data });
  },

  clearCart: async () => {
    await api.delete('/cart');
    set({ cart: null });
  },

  applyCoupon: async (code) => {
    const { data } = await api.post('/cart/coupon', { code });
    set({ cart: data.data.cart });
    return data.message;
  },

  removeCoupon: async () => {
    const { data } = await api.delete('/cart/coupon/remove');
    set({ cart: data.data });
  },
}));

// ---- UI STORE ----
interface UIStore {
  isMobileMenuOpen: boolean;
  isSearchOpen: boolean;
  isCartOpen: boolean;
  theme: 'light' | 'dark';
  setMobileMenu: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  setCartOpen: (open: boolean) => void;
  toggleTheme: () => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      isMobileMenuOpen: false,
      isSearchOpen: false,
      isCartOpen: false,
      theme: 'light',

      setMobileMenu: (open) => set({ isMobileMenuOpen: open }),
      setSearchOpen: (open) => set({ isSearchOpen: open }),
      setCartOpen: (open) => set({ isCartOpen: open }),
      toggleTheme: () => set((state) => {
        const newTheme = state.theme === 'light' ? 'dark' : 'light';
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
        return { theme: newTheme };
      }),
    }),
    { name: 'styleverse-ui', partialize: (s) => ({ theme: s.theme }) }
  )
);
