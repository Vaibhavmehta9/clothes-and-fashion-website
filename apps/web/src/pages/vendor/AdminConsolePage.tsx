import React, { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { formatCurrency } from '@/lib/utils';
import {
  FiSliders, FiUsers, FiBriefcase, FiPackage, FiTag, FiCheck, FiX,
  FiPlus, FiTrash2, FiEdit2, FiBarChart2, FiShoppingBag, FiMessageSquare,
  FiGlobe, FiImage, FiFileText, FiTrendingUp, FiDollarSign, FiAlertCircle,
  FiDownload, FiRefreshCw, FiHome, FiPercent, FiMail, FiGift,
} from 'react-icons/fi';
import { useAuthStore } from '@/store';

// ─────────────────────── INTERFACES ───────────────────────
interface VendorType {
  _id: string; storeName: string; storeSlug: string; status: string;
  commissionRate: number; businessEmail: string; businessPhone: string;
  user?: { name: string; email: string }; createdAt: string;
}
interface ProductType {
  _id: string; name: string; slug: string; status: string;
  basePrice: number; thumbnail: string; stock?: number;
  vendor?: { storeName: string }; createdAt: string;
}
interface UserType {
  _id: string; name: string; email: string; role: string;
  isActive: boolean; createdAt: string;
}
interface CouponType {
  _id: string; code: string; description?: string; type: string;
  value: number; minOrderAmount: number; usageLimit: number;
  usedCount: number; expiresAt: string; isActive: boolean;
}
interface SettingsType {
  siteName: string; siteTagline: string; logo: string; favicon: string;
  tax: number; shippingFee: number; freeShippingThreshold: number;
  defaultCommissionRate: number; maintenanceMode: boolean;
  contactEmail: string; contactPhone: string; address: string;
  socialLinks: { facebook?: string; instagram?: string; twitter?: string; youtube?: string; pinterest?: string };
  paymentMethods: { cod: boolean; razorpay: boolean; stripe: boolean; upi: boolean };
}
interface CategoryType {
  _id: string; name: string; slug: string; description?: string;
  image?: string; icon?: string; parent?: { _id: string; name: string };
  isActive: boolean;
}
interface BrandType {
  _id: string; name: string; slug: string; logo?: string;
  description?: string; isFeatured: boolean; isActive: boolean;
}
interface BannerType {
  _id: string; title: string; image: string; link?: string;
  position: number; isActive: boolean;
}
interface CMSPageType {
  _id: string; title: string; slug: string; content: string; isActive: boolean;
}
interface ActivityLogType {
  _id: string; user?: { name: string; email: string; role: string };
  action: string; entity: string; details?: string;
  ipAddress?: string; createdAt: string;
}
interface OrderType {
  _id: string; orderNumber: string; status: string; paymentStatus: string;
  paymentMethod: string; total: number; createdAt: string;
  user?: { name: string; email: string };
  shippingAddress?: { city: string; state: string };
}
interface EnquiryType {
  _id: string; subject: string; status: string; priority: string;
  createdAt: string; user?: { name: string; email: string };
  category?: string; messages?: { content: string }[];
}
interface AnalyticsType {
  overview: {
    totalRevenue: number; monthRevenue: number; revenueGrowth: number;
    totalOrders: number; monthOrders: number; totalUsers: number;
    newUsers: number; totalVendors: number; pendingVendors: number;
    totalProducts: number; pendingProducts: number;
  };
  ordersByStatus: Record<string, number>;
  revenueByMonth: { month: string; revenue: number; orders: number }[];
  topProducts: { product: { name: string; thumbnail: string }; totalSold: number; revenue: number }[];
  topVendors: { vendor: { storeName: string }; revenue: number; orders: number }[];
}

type TabKey = 'dashboard' | 'settings' | 'catalogue' | 'orders' | 'enquiries'
  | 'users' | 'cms' | 'marketing' | 'reports';

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'dashboard',  label: 'Dashboard',      icon: <FiHome /> },
  { key: 'settings',   label: 'Settings',        icon: <FiSliders /> },
  { key: 'catalogue',  label: 'Catalogue',       icon: <FiPackage /> },
  { key: 'orders',     label: 'Orders',          icon: <FiShoppingBag /> },
  { key: 'enquiries',  label: 'Enquiries',       icon: <FiMessageSquare /> },
  { key: 'users',      label: 'Users & Vendors', icon: <FiUsers /> },
  { key: 'cms',        label: 'CMS & Homepage',  icon: <FiGlobe /> },
  { key: 'marketing',  label: 'Marketing',       icon: <FiGift /> },
  { key: 'reports',    label: 'Reports',         icon: <FiBarChart2 /> },
];

// ─────────────────────── HELPERS ───────────────────────
const DEFAULT_SETTINGS: SettingsType = {
  siteName: '', siteTagline: '', logo: '', favicon: '',
  tax: 0, shippingFee: 0, freeShippingThreshold: 0,
  defaultCommissionRate: 10, maintenanceMode: false,
  contactEmail: '', contactPhone: '', address: '',
  socialLinks: {},
  paymentMethods: { cod: true, razorpay: false, stripe: false, upi: false },
};

const statusBadge = (s: string, color: string) => (
  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${color}`}>{s}</span>
);

const orderStatusColor: Record<string, string> = {
  pending:   'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  shipped:   'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  returned:  'bg-orange-100 text-orange-800',
};

// ─────────────────────── MAIN COMPONENT ───────────────────────
const AdminConsolePage: React.FC = () => {
  const { accessToken, user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  const [loadedTabs, setLoadedTabs] = useState<Set<string>>(new Set());

  // Data states
  const [analytics, setAnalytics] = useState<AnalyticsType | null>(null);
  const [settings, setSettings] = useState<SettingsType>(DEFAULT_SETTINGS);
  const [vendors, setVendors] = useState<VendorType[]>([]);
  const [products, setProducts] = useState<ProductType[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [coupons, setCoupons] = useState<CouponType[]>([]);
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [brands, setBrands] = useState<BrandType[]>([]);
  const [banners, setBanners] = useState<BannerType[]>([]);
  const [cmsPages, setCmsPages] = useState<CMSPageType[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLogType[]>([]);
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [enquiries, setEnquiries] = useState<EnquiryType[]>([]);

  // Order filter
  const [orderFilter, setOrderFilter] = useState('all');

  // Form states
  const [newCoupon, setNewCoupon] = useState({ code: '', description: '', type: 'percentage', value: 10, minOrderAmount: 0, usageLimit: 100, expiresAt: '' });
  const [newCategory, setNewCategory] = useState({ name: '', description: '', image: '', icon: '', parent: '' });
  const [newBrand, setNewBrand] = useState({ name: '', description: '', logo: '', isFeatured: false });
  const [newBanner, setNewBanner] = useState({ title: '', image: '', link: '', position: 1 });
  const [newCMSPage, setNewCMSPage] = useState({ title: '', slug: '', content: '' });

  // ── Data fetchers ──
  const fetchDashboard = useCallback(async () => {
    try {
      const res = await api.get('/reports/admin/overview');
      setAnalytics(res.data.data);
    } catch { toast.error('Failed to load dashboard analytics'); }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await api.get('/settings');
      setSettings({ ...DEFAULT_SETTINGS, ...(res.data.data || {}) });
    } catch { toast.error('Failed to load settings'); }
  }, []);

  const fetchVendors = useCallback(async () => {
    try {
      const res = await api.get('/vendors');
      setVendors(res.data.data || []);
    } catch { toast.error('Failed to load vendors'); }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      // data is a direct array (not wrapped in .products)
      const res = await api.get('/products?limit=100&status=all');
      const raw = res.data.data;
      setProducts(Array.isArray(raw) ? raw : raw?.products || []);
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Failed to load products'); }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data.data || []);
    } catch { toast.error('Failed to load users'); }
  }, []);

  const fetchCoupons = useCallback(async () => {
    try {
      const res = await api.get('/coupons');
      setCoupons(res.data.data || []);
    } catch { toast.error('Failed to load coupons'); }
  }, []);

  const fetchCatalogue = useCallback(async () => {
    try {
      const [catRes, brandRes] = await Promise.all([
        api.get('/categories/all'),
        api.get('/brands'),
      ]);
      setCategories(catRes.data.data || []);
      setBrands(brandRes.data.data || []);
    } catch { toast.error('Failed to load catalogue data'); }
  }, []);

  const fetchCMS = useCallback(async () => {
    try {
      // /banners/all – admin endpoint shows all banners
      // /pages – returns active pages; admin sees all via this same endpoint
      const [bannerRes, pageRes] = await Promise.all([
        api.get('/banners/all'),
        api.get('/pages'),
      ]);
      setBanners(bannerRes.data.data || []);
      setCmsPages(pageRes.data.data || []);
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Failed to load CMS data'); }
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      // Admin GET /orders returns { data: Order[] } directly
      const res = await api.get('/orders?limit=100');
      const raw = res.data.data;
      setOrders(Array.isArray(raw) ? raw : []);
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Failed to load orders'); }
  }, []);

  const fetchEnquiries = useCallback(async () => {
    try {
      const res = await api.get('/support-tickets?limit=100');
      const raw = res.data.data;
      setEnquiries(Array.isArray(raw) ? raw : []);
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Failed to load enquiries'); }
  }, []);

  const fetchReports = useCallback(async () => {
    try {
      const res = await api.get('/reports/activity-logs?limit=50');
      const raw = res.data.data;
      setActivityLogs(Array.isArray(raw) ? raw : []);
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Failed to load activity logs'); }
  }, []);

  // ── Tab switching logic ──
  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    if (loadedTabs.has(tab)) return;

    setLoadedTabs(prev => new Set([...prev, tab]));
    setIsLoading(true);
    const loadMap: Record<TabKey, () => Promise<void>> = {
      dashboard: fetchDashboard,
      settings:  fetchSettings,
      catalogue: async () => { await Promise.all([fetchCatalogue(), fetchProducts()]); },
      orders:    fetchOrders,
      enquiries: fetchEnquiries,
      users:     async () => { await Promise.all([fetchUsers(), fetchVendors()]); },
      cms:       fetchCMS,
      marketing: fetchCoupons,
      reports:   fetchReports,
    };
    loadMap[tab]().finally(() => setIsLoading(false));
  };

  useEffect(() => { handleTabChange('dashboard'); }, []);

  // ── Action handlers ──
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put('/settings', settings);
      toast.success('Settings saved successfully!');
    } catch { toast.error('Failed to save settings'); }
  };

  const handleApproveVendor = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await api.put(`/vendors/${id}/approve`, { status });
      toast.success(`Vendor ${status}!`);
      setVendors(v => v.map(x => x._id === id ? { ...x, status } : x));
    } catch { toast.error('Failed to update vendor status'); }
  };

  const handleApproveProduct = async (id: string, status: 'active' | 'rejected') => {
    try {
      // Correct endpoint is PUT /products/:id/approve
      await api.put(`/products/${id}/approve`, { status });
      toast.success(`Product ${status}!`);
      setProducts(p => p.map(x => x._id === id ? { ...x, status } : x));
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Failed to update product status'); }
  };

  const handleToggleUser = async (id: string, isActive: boolean) => {
    try {
      await api.put(`/users/${id}/toggle-status`);
      toast.success(`User ${isActive ? 'deactivated' : 'activated'}`);
      setUsers(u => u.map(x => x._id === id ? { ...x, isActive: !isActive } : x));
    } catch { toast.error('Failed to toggle user status'); }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/coupons', newCoupon);
      setCoupons(c => [res.data.data, ...c]);
      setNewCoupon({ code: '', description: '', type: 'percentage', value: 10, minOrderAmount: 0, usageLimit: 100, expiresAt: '' });
      toast.success('Coupon created!');
    } catch { toast.error('Failed to create coupon'); }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm('Delete this coupon?')) return;
    try {
      await api.delete(`/coupons/${id}`);
      setCoupons(c => c.filter(x => x._id !== id));
      toast.success('Coupon deleted');
    } catch { toast.error('Failed to delete coupon'); }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/categories', newCategory);
      setCategories(c => [res.data.data, ...c]);
      setNewCategory({ name: '', description: '', image: '', icon: '', parent: '' });
      toast.success('Category created!');
    } catch { toast.error('Failed to create category'); }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Delete this category?')) return;
    try {
      await api.delete(`/categories/${id}`);
      setCategories(c => c.filter(x => x._id !== id));
      toast.success('Category deleted');
    } catch { toast.error('Failed to delete category'); }
  };

  const handleCreateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/brands', newBrand);
      setBrands(b => [res.data.data, ...b]);
      setNewBrand({ name: '', description: '', logo: '', isFeatured: false });
      toast.success('Brand created!');
    } catch { toast.error('Failed to create brand'); }
  };

  const handleDeleteBrand = async (id: string) => {
    if (!confirm('Delete this brand?')) return;
    try {
      await api.delete(`/brands/${id}`);
      setBrands(b => b.filter(x => x._id !== id));
      toast.success('Brand deleted');
    } catch { toast.error('Failed to delete brand'); }
  };

  const handleCreateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/banners', newBanner);
      setBanners(b => [res.data.data, ...b]);
      setNewBanner({ title: '', image: '', link: '', position: 1 });
      toast.success('Banner created!');
    } catch { toast.error('Failed to create banner'); }
  };

  const handleDeleteBanner = async (id: string) => {
    if (!confirm('Delete this banner?')) return;
    try {
      await api.delete(`/banners/${id}`);
      setBanners(b => b.filter(x => x._id !== id));
      toast.success('Banner deleted');
    } catch { toast.error('Failed to delete banner'); }
  };

  const handleCreateCMSPage = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/pages', newCMSPage);
      setCmsPages(p => [res.data.data, ...p]);
      setNewCMSPage({ title: '', slug: '', content: '' });
      toast.success('Page created!');
    } catch { toast.error('Failed to create page'); }
  };

  const handleDeleteCMSPage = async (id: string) => {
    if (!confirm('Delete this page?')) return;
    try {
      await api.delete(`/pages/${id}`);
      setCmsPages(p => p.filter(x => x._id !== id));
      toast.success('Page deleted');
    } catch { toast.error('Failed to delete page'); }
  };

  const handleUpdateOrderStatus = async (id: string, status: string) => {
    try {
      await api.put(`/orders/${id}/status`, { status });
      setOrders(o => o.map(x => x._id === id ? { ...x, status } : x));
      toast.success('Order status updated');
    } catch { toast.error('Failed to update order status'); }
  };

  const handleUpdateEnquiryStatus = async (id: string, status: string) => {
    try {
      await api.put(`/support-tickets/${id}`, { status });
      setEnquiries(e => e.map(x => x._id === id ? { ...x, status } : x));
      toast.success('Enquiry status updated');
    } catch { toast.error('Failed to update enquiry'); }
  };

  const handleExportCSV = () => {
    const t = accessToken || localStorage.getItem('accessToken') || '';
    window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/v1/reports/export/orders?token=${t}`, '_blank');
  };

  // ── Filtered orders ──
  const filteredOrders = orderFilter === 'all'
    ? orders
    : orders.filter(o => o.status === orderFilter);

  // ═══════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════
  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl border p-8 max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-3xl mx-auto">
            🚫
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Access Denied</h2>
          <p className="text-gray-500 text-sm">
            This console is reserved exclusively for Super Administrators. Your account role is <strong>{user?.role || 'unknown'}</strong>.
          </p>
          <div className="pt-2">
            <a href="/" className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors">
              Return to Storefront
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-800 text-white px-6 py-8">
        <h1 className="text-3xl font-bold">🛡️ Super Admin Console</h1>
        <p className="text-indigo-300 mt-1">Manage every aspect of your marketplace</p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-20 overflow-x-auto">
        <div className="flex min-w-max">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`flex items-center gap-2 px-5 py-4 text-sm font-medium border-b-2 transition-all whitespace-nowrap
                ${activeTab === tab.key
                  ? 'border-indigo-600 text-indigo-700 bg-indigo-50'
                  : 'border-transparent text-gray-600 hover:text-indigo-600 hover:bg-gray-50'}`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* ════════ TAB: DASHBOARD ════════ */}
        {!isLoading && activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">Dashboard Overview</h2>
              <button onClick={() => { setLoadedTabs(new Set()); handleTabChange('dashboard'); }}
                className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800">
                <FiRefreshCw className="w-4 h-4" /> Refresh
              </button>
            </div>

            {analytics && (
              <>
                {/* KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Revenue', value: formatCurrency(analytics.overview.totalRevenue), icon: <FiDollarSign className="w-6 h-6" />, color: 'from-green-500 to-emerald-600', sub: `This month: ${formatCurrency(analytics.overview.monthRevenue)}` },
                    { label: 'Total Orders', value: analytics.overview.totalOrders, icon: <FiShoppingBag className="w-6 h-6" />, color: 'from-blue-500 to-cyan-600', sub: `This month: ${analytics.overview.monthOrders}` },
                    { label: 'Total Vendors', value: analytics.overview.totalVendors, icon: <FiBriefcase className="w-6 h-6" />, color: 'from-purple-500 to-violet-600', sub: `Pending: ${analytics.overview.pendingVendors}` },
                    { label: 'Total Customers', value: analytics.overview.totalUsers, icon: <FiUsers className="w-6 h-6" />, color: 'from-orange-500 to-red-500', sub: `New this month: ${analytics.overview.newUsers}` },
                  ].map(card => (
                    <div key={card.label} className={`bg-gradient-to-br ${card.color} text-white rounded-xl p-5 shadow-lg`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-white/80 text-sm">{card.label}</p>
                          <p className="text-2xl font-bold mt-1">{card.value}</p>
                          <p className="text-white/70 text-xs mt-1">{card.sub}</p>
                        </div>
                        <div className="bg-white/20 rounded-lg p-2">{card.icon}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Revenue Growth */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-xl p-5 shadow border col-span-1">
                    <h3 className="font-semibold text-gray-700 mb-4">Revenue Growth</h3>
                    <div className={`text-3xl font-bold ${analytics.overview.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {analytics.overview.revenueGrowth >= 0 ? '+' : ''}{analytics.overview.revenueGrowth}%
                    </div>
                    <p className="text-sm text-gray-500 mt-1">vs last month</p>
                  </div>
                  <div className="bg-white rounded-xl p-5 shadow border col-span-1">
                    <h3 className="font-semibold text-gray-700 mb-4">Products</h3>
                    <div className="text-3xl font-bold text-blue-600">{analytics.overview.totalProducts}</div>
                    <p className="text-sm text-orange-500 mt-1">{analytics.overview.pendingProducts} pending approval</p>
                  </div>
                  <div className="bg-white rounded-xl p-5 shadow border col-span-1">
                    <h3 className="font-semibold text-gray-700 mb-4">Orders by Status</h3>
                    <div className="space-y-1">
                      {Object.entries(analytics.ordersByStatus).map(([s, c]) => (
                        <div key={s} className="flex justify-between text-sm">
                          <span className="capitalize text-gray-600">{s}</span>
                          <span className="font-semibold">{c}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Monthly Revenue Table */}
                <div className="bg-white rounded-xl shadow border p-5">
                  <h3 className="font-semibold text-gray-700 mb-4">Monthly Revenue (This Year)</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="bg-gray-50">
                        <th className="p-3 text-left text-gray-600">Month</th>
                        <th className="p-3 text-right text-gray-600">Revenue</th>
                        <th className="p-3 text-right text-gray-600">Orders</th>
                      </tr></thead>
                      <tbody>
                        {analytics.revenueByMonth.map(row => (
                          <tr key={row.month} className="border-t hover:bg-gray-50">
                            <td className="p-3 font-medium">{row.month}</td>
                            <td className="p-3 text-right text-green-600">{formatCurrency(row.revenue)}</td>
                            <td className="p-3 text-right">{row.orders}</td>
                          </tr>
                        ))}
                        {analytics.revenueByMonth.length === 0 && (
                          <tr><td colSpan={3} className="p-6 text-center text-gray-400">No data yet</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Top Products & Vendors */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl shadow border p-5">
                    <h3 className="font-semibold text-gray-700 mb-4">Top Products</h3>
                    <div className="space-y-3">
                      {analytics.topProducts.slice(0, 5).map((p, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold">{i + 1}</span>
                          {p.product.thumbnail && <img src={p.product.thumbnail} alt="" className="w-8 h-8 rounded object-cover" />}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{p.product.name}</p>
                            <p className="text-xs text-gray-500">{p.totalSold} sold</p>
                          </div>
                          <span className="text-sm font-semibold text-green-600">{formatCurrency(p.revenue)}</span>
                        </div>
                      ))}
                      {analytics.topProducts.length === 0 && <p className="text-gray-400 text-sm">No data yet</p>}
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow border p-5">
                    <h3 className="font-semibold text-gray-700 mb-4">Top Vendors</h3>
                    <div className="space-y-3">
                      {analytics.topVendors.slice(0, 5).map((v, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-bold">{i + 1}</span>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{v.vendor.storeName}</p>
                            <p className="text-xs text-gray-500">{v.orders} orders</p>
                          </div>
                          <span className="text-sm font-semibold text-green-600">{formatCurrency(v.revenue)}</span>
                        </div>
                      ))}
                      {analytics.topVendors.length === 0 && <p className="text-gray-400 text-sm">No data yet</p>}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ════════ TAB: SETTINGS ════════ */}
        {!isLoading && activeTab === 'settings' && (
          <form onSubmit={handleSaveSettings} className="space-y-6">
            <h2 className="text-xl font-bold text-gray-800">Website Settings</h2>

            {/* Identity */}
            <div className="bg-white rounded-xl shadow border p-6">
              <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2"><FiGlobe /> Site Identity</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: 'Site Name', field: 'siteName' as const, placeholder: 'StyleVerse' },
                  { label: 'Site Tagline', field: 'siteTagline' as const, placeholder: 'Fashion for Everyone' },
                  { label: 'Logo URL', field: 'logo' as const, placeholder: 'https://...' },
                  { label: 'Favicon URL', field: 'favicon' as const, placeholder: 'https://...' },
                  { label: 'Contact Email', field: 'contactEmail' as const, placeholder: 'admin@styleverse.com' },
                  { label: 'Contact Phone', field: 'contactPhone' as const, placeholder: '+91 9999999999' },
                ].map(({ label, field, placeholder }) => (
                  <div key={field}>
                    <label className="block text-sm text-gray-600 mb-1">{label}</label>
                    <input
                      value={(settings as any)[field] || ''}
                      onChange={e => setSettings(s => ({ ...s, [field]: e.target.value }))}
                      placeholder={placeholder}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
                    />
                  </div>
                ))}
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-600 mb-1">Business Address</label>
                  <textarea
                    value={settings.address || ''}
                    onChange={e => setSettings(s => ({ ...s, address: e.target.value }))}
                    rows={2}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
                    placeholder="123 Market Street, Mumbai, India"
                  />
                </div>
              </div>
            </div>

            {/* Financial */}
            <div className="bg-white rounded-xl shadow border p-6">
              <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2"><FiPercent /> Tax, Shipping & Commission</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: 'Tax Rate (%)', field: 'tax' as const },
                  { label: 'Default Shipping Fee (₹)', field: 'shippingFee' as const },
                  { label: 'Free Shipping Threshold (₹)', field: 'freeShippingThreshold' as const },
                  { label: 'Default Commission Rate (%)', field: 'defaultCommissionRate' as const },
                ].map(({ label, field }) => (
                  <div key={field}>
                    <label className="block text-sm text-gray-600 mb-1">{label}</label>
                    <input
                      type="number" min="0" step="0.1"
                      value={(settings as any)[field] ?? 0}
                      onChange={e => setSettings(s => ({ ...s, [field]: parseFloat(e.target.value) }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Methods */}
            <div className="bg-white rounded-xl shadow border p-6">
              <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2"><FiDollarSign /> Payment Methods</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(['cod', 'razorpay', 'stripe', 'upi'] as const).map(method => (
                  <label key={method} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={settings.paymentMethods[method]}
                      onChange={e => setSettings(s => ({ ...s, paymentMethods: { ...s.paymentMethods, [method]: e.target.checked } }))}
                      className="w-4 h-4 rounded text-indigo-600"
                    />
                    <span className="text-sm font-medium capitalize">{method === 'cod' ? 'Cash on Delivery' : method === 'upi' ? 'UPI' : method.charAt(0).toUpperCase() + method.slice(1)}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Social Links */}
            <div className="bg-white rounded-xl shadow border p-6">
              <h3 className="font-semibold text-gray-700 mb-4">Social Links</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(['facebook', 'instagram', 'twitter', 'youtube', 'pinterest'] as const).map(social => (
                  <div key={social}>
                    <label className="block text-sm text-gray-600 mb-1 capitalize">{social}</label>
                    <input
                      value={settings.socialLinks[social] || ''}
                      onChange={e => setSettings(s => ({ ...s, socialLinks: { ...s.socialLinks, [social]: e.target.value } }))}
                      placeholder={`https://${social}.com/...`}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Maintenance Mode */}
            <div className="bg-white rounded-xl shadow border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-700">Maintenance Mode</h3>
                  <p className="text-sm text-gray-500">When enabled, the site shows a maintenance page to visitors.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer"
                    checked={settings.maintenanceMode}
                    onChange={e => setSettings(s => ({ ...s, maintenanceMode: e.target.checked }))}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-checked:bg-indigo-600 rounded-full transition-colors" />
                  <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform" />
                </label>
              </div>
            </div>

            <button type="submit" className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
              Save Settings
            </button>
          </form>
        )}

        {/* ════════ TAB: CATALOGUE ════════ */}
        {!isLoading && activeTab === 'catalogue' && (
          <div className="space-y-8">
            <h2 className="text-xl font-bold text-gray-800">Catalogue Management</h2>

            {/* Categories */}
            <div className="bg-white rounded-xl shadow border p-6">
              <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2"><FiTag /> Categories</h3>
              <form onSubmit={handleCreateCategory} className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
                <input required value={newCategory.name} onChange={e => setNewCategory(c => ({ ...c, name: e.target.value }))}
                  placeholder="Category name *" className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400" />
                <input value={newCategory.description} onChange={e => setNewCategory(c => ({ ...c, description: e.target.value }))}
                  placeholder="Description" className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400" />
                <input value={newCategory.image} onChange={e => setNewCategory(c => ({ ...c, image: e.target.value }))}
                  placeholder="Image URL" className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400" />
                <button type="submit" className="bg-indigo-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-indigo-700 flex items-center gap-1 justify-center">
                  <FiPlus /> Add Category
                </button>
              </form>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="bg-gray-50">
                    <th className="p-3 text-left text-gray-600">Name</th>
                    <th className="p-3 text-left text-gray-600">Slug</th>
                    <th className="p-3 text-left text-gray-600">Parent</th>
                    <th className="p-3 text-left text-gray-600">Status</th>
                    <th className="p-3 text-center text-gray-600">Action</th>
                  </tr></thead>
                  <tbody>
                    {categories.map(cat => (
                      <tr key={cat._id} className="border-t hover:bg-gray-50">
                        <td className="p-3 font-medium">{cat.name}</td>
                        <td className="p-3 text-gray-500">{cat.slug}</td>
                        <td className="p-3 text-gray-500">{cat.parent?.name || '—'}</td>
                        <td className="p-3">
                          {cat.isActive
                            ? statusBadge('Active', 'bg-green-100 text-green-700')
                            : statusBadge('Inactive', 'bg-gray-100 text-gray-600')}
                        </td>
                        <td className="p-3 text-center">
                          <button onClick={() => handleDeleteCategory(cat._id)} className="text-red-500 hover:text-red-700 p-1">
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {categories.length === 0 && (
                      <tr><td colSpan={5} className="p-6 text-center text-gray-400">No categories found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Brands */}
            <div className="bg-white rounded-xl shadow border p-6">
              <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2"><FiBriefcase /> Brands</h3>
              <form onSubmit={handleCreateBrand} className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
                <input required value={newBrand.name} onChange={e => setNewBrand(b => ({ ...b, name: e.target.value }))}
                  placeholder="Brand name *" className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400" />
                <input value={newBrand.description} onChange={e => setNewBrand(b => ({ ...b, description: e.target.value }))}
                  placeholder="Description" className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400" />
                <input value={newBrand.logo} onChange={e => setNewBrand(b => ({ ...b, logo: e.target.value }))}
                  placeholder="Logo URL" className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400" />
                <button type="submit" className="bg-purple-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-purple-700 flex items-center gap-1 justify-center">
                  <FiPlus /> Add Brand
                </button>
              </form>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="bg-gray-50">
                    <th className="p-3 text-left text-gray-600">Brand</th>
                    <th className="p-3 text-left text-gray-600">Slug</th>
                    <th className="p-3 text-left text-gray-600">Featured</th>
                    <th className="p-3 text-center text-gray-600">Action</th>
                  </tr></thead>
                  <tbody>
                    {brands.map(brand => (
                      <tr key={brand._id} className="border-t hover:bg-gray-50">
                        <td className="p-3 font-medium flex items-center gap-2">
                          {brand.logo && <img src={brand.logo} alt="" className="w-6 h-6 rounded object-cover" />}
                          {brand.name}
                        </td>
                        <td className="p-3 text-gray-500">{brand.slug}</td>
                        <td className="p-3">{brand.isFeatured ? <FiCheck className="text-green-500" /> : <FiX className="text-gray-300" />}</td>
                        <td className="p-3 text-center">
                          <button onClick={() => handleDeleteBrand(brand._id)} className="text-red-500 hover:text-red-700 p-1">
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {brands.length === 0 && (
                      <tr><td colSpan={4} className="p-6 text-center text-gray-400">No brands found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Products Approval */}
            <div className="bg-white rounded-xl shadow border p-6">
              <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2"><FiPackage /> Product Approval</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="bg-gray-50">
                    <th className="p-3 text-left text-gray-600">Product</th>
                    <th className="p-3 text-left text-gray-600">Vendor</th>
                    <th className="p-3 text-right text-gray-600">Price</th>
                    <th className="p-3 text-left text-gray-600">Status</th>
                    <th className="p-3 text-center text-gray-600">Actions</th>
                  </tr></thead>
                  <tbody>
                    {products.map(product => (
                      <tr key={product._id} className="border-t hover:bg-gray-50">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            {product.thumbnail && <img src={product.thumbnail} alt="" className="w-8 h-8 rounded object-cover" />}
                            <span className="font-medium max-w-xs truncate">{product.name}</span>
                          </div>
                        </td>
                        <td className="p-3 text-gray-500">{product.vendor?.storeName || '—'}</td>
                        <td className="p-3 text-right">{formatCurrency(product.basePrice)}</td>
                        <td className="p-3">
                          {statusBadge(product.status,
                            product.status === 'active' ? 'bg-green-100 text-green-700'
                            : product.status === 'pending' ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700')}
                        </td>
                        <td className="p-3 text-center">
                          {product.status === 'pending' && (
                            <div className="flex items-center gap-2 justify-center">
                              <button onClick={() => handleApproveProduct(product._id, 'active')}
                                className="bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1 rounded text-xs font-medium flex items-center gap-1">
                                <FiCheck className="w-3 h-3" /> Approve
                              </button>
                              <button onClick={() => handleApproveProduct(product._id, 'rejected')}
                                className="bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1 rounded text-xs font-medium flex items-center gap-1">
                                <FiX className="w-3 h-3" /> Reject
                              </button>
                            </div>
                          )}
                          {product.status !== 'pending' && <span className="text-gray-400 text-xs">—</span>}
                        </td>
                      </tr>
                    ))}
                    {products.length === 0 && (
                      <tr><td colSpan={5} className="p-6 text-center text-gray-400">No products found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ════════ TAB: ORDERS ════════ */}
        {!isLoading && activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-3 items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">Orders & Payments</h2>
              <button onClick={handleExportCSV}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                <FiDownload /> Export CSV
              </button>
            </div>

            {/* Status filters */}
            <div className="flex flex-wrap gap-2">
              {['all', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'returned'].map(s => (
                <button key={s} onClick={() => setOrderFilter(s)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-all
                    ${orderFilter === s ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {s}
                </button>
              ))}
            </div>

            <div className="bg-white rounded-xl shadow border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="bg-gray-50">
                    <th className="p-3 text-left text-gray-600">Order #</th>
                    <th className="p-3 text-left text-gray-600">Customer</th>
                    <th className="p-3 text-left text-gray-600">Date</th>
                    <th className="p-3 text-right text-gray-600">Total</th>
                    <th className="p-3 text-left text-gray-600">Payment</th>
                    <th className="p-3 text-left text-gray-600">Status</th>
                    <th className="p-3 text-center text-gray-600">Update Status</th>
                  </tr></thead>
                  <tbody>
                    {filteredOrders.map(order => (
                      <tr key={order._id} className="border-t hover:bg-gray-50">
                        <td className="p-3 font-mono text-xs">{order.orderNumber}</td>
                        <td className="p-3">{order.user?.name || '—'}</td>
                        <td className="p-3 text-gray-500">{new Date(order.createdAt).toLocaleDateString('en-IN')}</td>
                        <td className="p-3 text-right font-semibold">{formatCurrency(order.total)}</td>
                        <td className="p-3">
                          {statusBadge(order.paymentStatus,
                            order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700'
                            : order.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700')}
                        </td>
                        <td className="p-3">
                          {statusBadge(order.status, orderStatusColor[order.status] || 'bg-gray-100 text-gray-700')}
                        </td>
                        <td className="p-3 text-center">
                          <select
                            value={order.status}
                            onChange={e => handleUpdateOrderStatus(order._id, e.target.value)}
                            className="border rounded px-2 py-1 text-xs focus:ring-2 focus:ring-indigo-400 outline-none"
                          >
                            {['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned'].map(s => (
                              <option key={s} value={s} className="capitalize">{s.replace('_', ' ')}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                    {filteredOrders.length === 0 && (
                      <tr><td colSpan={7} className="p-6 text-center text-gray-400">No orders found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ════════ TAB: ENQUIRIES ════════ */}
        {!isLoading && activeTab === 'enquiries' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-800">Enquiries & Support Tickets</h2>
            <div className="bg-white rounded-xl shadow border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="bg-gray-50">
                    <th className="p-3 text-left text-gray-600">Subject</th>
                    <th className="p-3 text-left text-gray-600">Customer</th>
                    <th className="p-3 text-left text-gray-600">Category</th>
                    <th className="p-3 text-left text-gray-600">Priority</th>
                    <th className="p-3 text-left text-gray-600">Status</th>
                    <th className="p-3 text-left text-gray-600">Date</th>
                    <th className="p-3 text-center text-gray-600">Update</th>
                  </tr></thead>
                  <tbody>
                    {enquiries.map(enq => (
                      <tr key={enq._id} className="border-t hover:bg-gray-50">
                        <td className="p-3 font-medium max-w-xs truncate">{enq.subject}</td>
                        <td className="p-3 text-gray-600">{enq.user?.name || '—'}</td>
                        <td className="p-3 text-gray-500 capitalize">{enq.category || '—'}</td>
                        <td className="p-3">
                          {statusBadge(enq.priority,
                            enq.priority === 'urgent' ? 'bg-red-100 text-red-700'
                            : enq.priority === 'high' ? 'bg-orange-100 text-orange-700'
                            : 'bg-blue-100 text-blue-700')}
                        </td>
                        <td className="p-3">
                          {statusBadge(enq.status,
                            enq.status === 'resolved' ? 'bg-green-100 text-green-700'
                            : enq.status === 'open' ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-600')}
                        </td>
                        <td className="p-3 text-gray-500">{new Date(enq.createdAt).toLocaleDateString('en-IN')}</td>
                        <td className="p-3 text-center">
                          <select
                            value={enq.status}
                            onChange={e => handleUpdateEnquiryStatus(enq._id, e.target.value)}
                            className="border rounded px-2 py-1 text-xs focus:ring-2 focus:ring-indigo-400 outline-none"
                          >
                            {['open', 'in_progress', 'resolved', 'closed'].map(s => (
                              <option key={s} value={s}>{s.replace('_', ' ')}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                    {enquiries.length === 0 && (
                      <tr><td colSpan={7} className="p-6 text-center text-gray-400">No enquiries found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ════════ TAB: USERS & VENDORS ════════ */}
        {!isLoading && activeTab === 'users' && (
          <div className="space-y-8">
            <h2 className="text-xl font-bold text-gray-800">Users & Vendors Management</h2>

            {/* Vendors */}
            <div className="bg-white rounded-xl shadow border p-6">
              <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2"><FiBriefcase /> Vendors</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="bg-gray-50">
                    <th className="p-3 text-left text-gray-600">Store Name</th>
                    <th className="p-3 text-left text-gray-600">Owner</th>
                    <th className="p-3 text-left text-gray-600">Email</th>
                    <th className="p-3 text-left text-gray-600">Commission</th>
                    <th className="p-3 text-left text-gray-600">Status</th>
                    <th className="p-3 text-center text-gray-600">Actions</th>
                  </tr></thead>
                  <tbody>
                    {vendors.map(vendor => (
                      <tr key={vendor._id} className="border-t hover:bg-gray-50">
                        <td className="p-3 font-medium">{vendor.storeName}</td>
                        <td className="p-3 text-gray-600">{vendor.user?.name || '—'}</td>
                        <td className="p-3 text-gray-500">{vendor.businessEmail}</td>
                        <td className="p-3">{vendor.commissionRate}%</td>
                        <td className="p-3">
                          {statusBadge(vendor.status,
                            vendor.status === 'approved' ? 'bg-green-100 text-green-700'
                            : vendor.status === 'pending' ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700')}
                        </td>
                        <td className="p-3 text-center">
                          {vendor.status === 'pending' && (
                            <div className="flex items-center gap-2 justify-center">
                              <button onClick={() => handleApproveVendor(vendor._id, 'approved')}
                                className="bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1 rounded text-xs font-medium flex items-center gap-1">
                                <FiCheck className="w-3 h-3" /> Approve
                              </button>
                              <button onClick={() => handleApproveVendor(vendor._id, 'rejected')}
                                className="bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1 rounded text-xs font-medium flex items-center gap-1">
                                <FiX className="w-3 h-3" /> Reject
                              </button>
                            </div>
                          )}
                          {vendor.status !== 'pending' && <span className="text-gray-400 text-xs capitalize">{vendor.status}</span>}
                        </td>
                      </tr>
                    ))}
                    {vendors.length === 0 && (
                      <tr><td colSpan={6} className="p-6 text-center text-gray-400">No vendors found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Users */}
            <div className="bg-white rounded-xl shadow border p-6">
              <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2"><FiUsers /> All Users</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="bg-gray-50">
                    <th className="p-3 text-left text-gray-600">Name</th>
                    <th className="p-3 text-left text-gray-600">Email</th>
                    <th className="p-3 text-left text-gray-600">Role</th>
                    <th className="p-3 text-left text-gray-600">Joined</th>
                    <th className="p-3 text-left text-gray-600">Status</th>
                    <th className="p-3 text-center text-gray-600">Toggle</th>
                  </tr></thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user._id} className="border-t hover:bg-gray-50">
                        <td className="p-3 font-medium">{user.name}</td>
                        <td className="p-3 text-gray-500">{user.email}</td>
                        <td className="p-3">
                          {statusBadge(user.role,
                            user.role === 'admin' ? 'bg-purple-100 text-purple-700'
                            : user.role === 'vendor' ? 'bg-blue-100 text-blue-700'
                            : user.role === 'support' ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-600')}
                        </td>
                        <td className="p-3 text-gray-500">{new Date(user.createdAt).toLocaleDateString('en-IN')}</td>
                        <td className="p-3">
                          {user.isActive
                            ? statusBadge('Active', 'bg-green-100 text-green-700')
                            : statusBadge('Blocked', 'bg-red-100 text-red-700')}
                        </td>
                        <td className="p-3 text-center">
                          <button onClick={() => handleToggleUser(user._id, user.isActive)}
                            className={`px-3 py-1 rounded text-xs font-medium ${user.isActive ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
                            {user.isActive ? 'Block' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr><td colSpan={6} className="p-6 text-center text-gray-400">No users found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ════════ TAB: CMS & HOMEPAGE ════════ */}
        {!isLoading && activeTab === 'cms' && (
          <div className="space-y-8">
            <h2 className="text-xl font-bold text-gray-800">CMS Pages & Homepage Banners</h2>

            {/* Banners */}
            <div className="bg-white rounded-xl shadow border p-6">
              <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2"><FiImage /> Banners & Hero Content</h3>
              <form onSubmit={handleCreateBanner} className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
                <input required value={newBanner.title} onChange={e => setNewBanner(b => ({ ...b, title: e.target.value }))}
                  placeholder="Banner title *" className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400" />
                <input required value={newBanner.image} onChange={e => setNewBanner(b => ({ ...b, image: e.target.value }))}
                  placeholder="Image URL *" className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400" />
                <input value={newBanner.link} onChange={e => setNewBanner(b => ({ ...b, link: e.target.value }))}
                  placeholder="Link URL" className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400" />
                <button type="submit" className="bg-indigo-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-indigo-700 flex items-center gap-1 justify-center">
                  <FiPlus /> Add Banner
                </button>
              </form>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {banners.map(banner => (
                  <div key={banner._id} className="border rounded-lg overflow-hidden">
                    {banner.image && (
                      <img src={banner.image} alt={banner.title} className="w-full h-32 object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    )}
                    <div className="p-3 flex justify-between items-center">
                      <div>
                        <p className="font-medium text-sm">{banner.title}</p>
                        <p className="text-xs text-gray-500">Position: {banner.position}</p>
                      </div>
                      <button onClick={() => handleDeleteBanner(banner._id)} className="text-red-500 hover:text-red-700 p-1">
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {banners.length === 0 && <p className="text-gray-400 text-sm col-span-3">No banners found</p>}
              </div>
            </div>

            {/* CMS Pages */}
            <div className="bg-white rounded-xl shadow border p-6">
              <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2"><FiFileText /> CMS Pages</h3>

              {/* Quick slugs reference */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-sm">
                <p className="font-medium text-blue-800 mb-1">Standard CMS Pages (by slug):</p>
                <div className="flex flex-wrap gap-2">
                  {['about-us', 'contact', 'faqs', 'privacy-policy', 'terms-conditions', 'refund-policy', 'shipping-policy', 'marketplace-guidelines'].map(slug => (
                    <code key={slug} className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">{slug}</code>
                  ))}
                </div>
              </div>

              <form onSubmit={handleCreateCMSPage} className="space-y-3 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input required value={newCMSPage.title} onChange={e => setNewCMSPage(p => ({ ...p, title: e.target.value }))}
                    placeholder="Page title *" className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400" />
                  <input required value={newCMSPage.slug} onChange={e => setNewCMSPage(p => ({ ...p, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
                    placeholder="Slug (e.g. about-us) *" className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
                <textarea required value={newCMSPage.content} onChange={e => setNewCMSPage(p => ({ ...p, content: e.target.value }))}
                  rows={4} placeholder="Page content (HTML supported) *"
                  className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400" />
                <button type="submit" className="bg-indigo-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-indigo-700 flex items-center gap-1">
                  <FiPlus /> Create Page
                </button>
              </form>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="bg-gray-50">
                    <th className="p-3 text-left text-gray-600">Title</th>
                    <th className="p-3 text-left text-gray-600">Slug</th>
                    <th className="p-3 text-left text-gray-600">Status</th>
                    <th className="p-3 text-center text-gray-600">Action</th>
                  </tr></thead>
                  <tbody>
                    {cmsPages.map(page => (
                      <tr key={page._id} className="border-t hover:bg-gray-50">
                        <td className="p-3 font-medium">{page.title}</td>
                        <td className="p-3"><code className="bg-gray-100 px-2 py-0.5 rounded text-xs">{page.slug}</code></td>
                        <td className="p-3">
                          {page.isActive
                            ? statusBadge('Active', 'bg-green-100 text-green-700')
                            : statusBadge('Draft', 'bg-gray-100 text-gray-600')}
                        </td>
                        <td className="p-3 text-center">
                          <button onClick={() => handleDeleteCMSPage(page._id)} className="text-red-500 hover:text-red-700 p-1">
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {cmsPages.length === 0 && (
                      <tr><td colSpan={4} className="p-6 text-center text-gray-400">No CMS pages found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ════════ TAB: MARKETING ════════ */}
        {!isLoading && activeTab === 'marketing' && (
          <div className="space-y-8">
            <h2 className="text-xl font-bold text-gray-800">Marketing & Promotions</h2>

            {/* Create Coupon */}
            <div className="bg-white rounded-xl shadow border p-6">
              <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2"><FiPercent /> Coupons & Offers</h3>
              <form onSubmit={handleCreateCoupon} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Coupon Code *</label>
                  <input required value={newCoupon.code} onChange={e => setNewCoupon(c => ({ ...c, code: e.target.value.toUpperCase() }))}
                    placeholder="SUMMER20" className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400 font-mono" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Type</label>
                  <select value={newCoupon.type} onChange={e => setNewCoupon(c => ({ ...c, type: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400">
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                    <option value="free_shipping">Free Shipping</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Value</label>
                  <input type="number" min="0" value={newCoupon.value} onChange={e => setNewCoupon(c => ({ ...c, value: parseFloat(e.target.value) }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Min Order Amount (₹)</label>
                  <input type="number" min="0" value={newCoupon.minOrderAmount} onChange={e => setNewCoupon(c => ({ ...c, minOrderAmount: parseFloat(e.target.value) }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Usage Limit</label>
                  <input type="number" min="1" value={newCoupon.usageLimit} onChange={e => setNewCoupon(c => ({ ...c, usageLimit: parseInt(e.target.value) }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Expires At</label>
                  <input type="date" value={newCoupon.expiresAt} onChange={e => setNewCoupon(c => ({ ...c, expiresAt: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">Description</label>
                  <input value={newCoupon.description} onChange={e => setNewCoupon(c => ({ ...c, description: e.target.value }))}
                    placeholder="Description for this coupon" className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
                <div className="flex items-end">
                  <button type="submit" className="w-full bg-indigo-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-indigo-700 flex items-center gap-1 justify-center">
                    <FiPlus /> Create Coupon
                  </button>
                </div>
              </form>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="bg-gray-50">
                    <th className="p-3 text-left text-gray-600">Code</th>
                    <th className="p-3 text-left text-gray-600">Type</th>
                    <th className="p-3 text-right text-gray-600">Value</th>
                    <th className="p-3 text-right text-gray-600">Min Order</th>
                    <th className="p-3 text-right text-gray-600">Used / Limit</th>
                    <th className="p-3 text-left text-gray-600">Expires</th>
                    <th className="p-3 text-left text-gray-600">Status</th>
                    <th className="p-3 text-center text-gray-600">Del</th>
                  </tr></thead>
                  <tbody>
                    {coupons.map(coupon => (
                      <tr key={coupon._id} className="border-t hover:bg-gray-50">
                        <td className="p-3 font-mono font-bold text-indigo-700">{coupon.code}</td>
                        <td className="p-3 capitalize text-gray-600">{coupon.type.replace('_', ' ')}</td>
                        <td className="p-3 text-right">{coupon.type === 'percentage' ? `${coupon.value}%` : coupon.type === 'free_shipping' ? 'Free' : formatCurrency(coupon.value)}</td>
                        <td className="p-3 text-right">{formatCurrency(coupon.minOrderAmount)}</td>
                        <td className="p-3 text-right">{coupon.usedCount} / {coupon.usageLimit}</td>
                        <td className="p-3 text-gray-500">{coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString('en-IN') : '—'}</td>
                        <td className="p-3">
                          {coupon.isActive
                            ? statusBadge('Active', 'bg-green-100 text-green-700')
                            : statusBadge('Inactive', 'bg-gray-100 text-gray-600')}
                        </td>
                        <td className="p-3 text-center">
                          <button onClick={() => handleDeleteCoupon(coupon._id)} className="text-red-500 hover:text-red-700 p-1">
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {coupons.length === 0 && (
                      <tr><td colSpan={8} className="p-6 text-center text-gray-400">No coupons found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Info cards for other marketing features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { title: 'Featured Products', desc: 'Feature products on homepage from the Catalogue tab. Mark products as featured during editing.', icon: <FiTrendingUp className="w-5 h-5" /> },
                { title: 'Newsletter Subscribers', desc: 'Subscribers are stored in the database. Export via Reports CSV.', icon: <FiMail className="w-5 h-5" /> },
                { title: 'Homepage Banners', desc: 'Manage hero banners, offer sections from the CMS & Homepage tab.', icon: <FiImage className="w-5 h-5" /> },
              ].map(card => (
                <div key={card.title} className="bg-white rounded-xl shadow border p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-indigo-100 text-indigo-600 p-2 rounded-lg">{card.icon}</div>
                    <h4 className="font-semibold text-gray-700">{card.title}</h4>
                  </div>
                  <p className="text-sm text-gray-500">{card.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ════════ TAB: REPORTS ════════ */}
        {!isLoading && activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-3 items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">Reports & Logs</h2>
              <button onClick={handleExportCSV}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium">
                <FiDownload /> Export Orders CSV
              </button>
            </div>

            {/* Quick report links */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { label: 'Sales Report', desc: 'Revenue, orders, monthly trends', color: 'from-green-500 to-emerald-600', link: '#', action: handleExportCSV },
                { label: 'Vendor Report', desc: 'Top vendors, commission earned', color: 'from-blue-500 to-cyan-600', link: '#', action: () => {} },
                { label: 'Product Report', desc: 'Top products, stock, approvals', color: 'from-purple-500 to-violet-600', link: '#', action: () => {} },
                { label: 'Enquiry Report', desc: 'Support tickets, resolution rate', color: 'from-orange-500 to-red-500', link: '#', action: () => {} },
                { label: 'Stock Report', desc: 'Low stock alerts, inventory', color: 'from-yellow-500 to-orange-500', link: '#', action: () => {} },
                { label: 'Customer Report', desc: 'New customers, active buyers', color: 'from-pink-500 to-rose-600', link: '#', action: () => {} },
              ].map(r => (
                <div key={r.label} className={`bg-gradient-to-br ${r.color} text-white rounded-xl p-5 shadow`}>
                  <FiBarChart2 className="w-5 h-5 mb-2 opacity-80" />
                  <h4 className="font-semibold">{r.label}</h4>
                  <p className="text-white/70 text-xs mt-1 mb-3">{r.desc}</p>
                  <button onClick={r.action}
                    className="bg-white/20 hover:bg-white/30 text-white text-xs px-3 py-1.5 rounded font-medium transition-colors flex items-center gap-1">
                    <FiDownload className="w-3 h-3" /> Export CSV
                  </button>
                </div>
              ))}
            </div>

            {/* Activity Logs */}
            <div className="bg-white rounded-xl shadow border p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-700 flex items-center gap-2"><FiAlertCircle /> System Activity Logs</h3>
                <button onClick={() => { setLoadedTabs(prev => { const s = new Set(prev); s.delete('reports'); return s; }); handleTabChange('reports'); }}
                  className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                  <FiRefreshCw className="w-4 h-4" /> Refresh
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="bg-gray-50">
                    <th className="p-3 text-left text-gray-600">Time</th>
                    <th className="p-3 text-left text-gray-600">User</th>
                    <th className="p-3 text-left text-gray-600">Action</th>
                    <th className="p-3 text-left text-gray-600">Entity</th>
                    <th className="p-3 text-left text-gray-600">Details</th>
                  </tr></thead>
                  <tbody>
                    {activityLogs.map(log => (
                      <tr key={log._id} className="border-t hover:bg-gray-50">
                        <td className="p-3 text-gray-500 whitespace-nowrap text-xs">
                          {new Date(log.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="p-3">
                          <p className="font-medium text-xs">{log.user?.name || 'System'}</p>
                          <p className="text-gray-400 text-xs">{log.user?.role}</p>
                        </td>
                        <td className="p-3">
                          <code className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs">{log.action}</code>
                        </td>
                        <td className="p-3 text-gray-600 capitalize text-xs">{log.entity}</td>
                        <td className="p-3 text-gray-500 text-xs max-w-xs truncate">{log.details || '—'}</td>
                      </tr>
                    ))}
                    {activityLogs.length === 0 && (
                      <tr><td colSpan={5} className="p-6 text-center text-gray-400">No activity logs found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminConsolePage;
