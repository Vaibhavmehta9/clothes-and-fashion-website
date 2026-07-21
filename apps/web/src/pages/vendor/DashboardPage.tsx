import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface Overview {
  totalRevenue: number;
  totalOrders: number;
  monthRevenue: number;
  monthOrders: number;
  rating: number;
}

interface Product {
  _id: string;
  totalSold: number;
  revenue: number;
  product: {
    name: string;
    thumbnail: string;
  };
}

const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [overview, setOverview] = useState<Overview | null>(null);
  const [topProducts, setTopProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchVendorStats = async () => {
      try {
        const { data } = await api.get('/reports/vendor/analytics');
        setOverview(data.data.overview);
        setTopProducts(data.data.topProducts || []);
      } catch {
        toast.error('Failed to load dashboard analytics.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchVendorStats();
  }, []);

  if (isLoading) {
    return (
      <div className="h-48 bg-muted animate-pulse rounded-2xl"></div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Welcome Banner */}
      <div className="bg-charcoal text-white p-8 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gold-gradient opacity-10 pointer-events-none"></div>
        <div className="relative z-10 flex flex-col gap-1.5">
          <h2 className="text-3xl font-display font-bold">Store Console</h2>
          <p className="text-charcoal-300 text-sm">Monitor sales, manage listings, and fulfill customer orders.</p>
        </div>
        <button
          onClick={() => navigate('/vendor/products/add')}
          className="btn-primary py-3 rounded-xl relative z-10"
        >
          + Add New Product
        </button>
      </div>

      {/* Stats Cards Grid */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="stat-card">
            <span className="stat-label">Total Revenue</span>
            <h3 className="stat-number text-gold mt-1">{formatCurrency(overview.totalRevenue)}</h3>
          </div>
          <div className="stat-card">
            <span className="stat-label">Total Orders</span>
            <h3 className="stat-number mt-1">{overview.totalOrders}</h3>
          </div>
          <div className="stat-card">
            <span className="stat-label">Monthly Revenue</span>
            <h3 className="stat-number mt-1">{formatCurrency(overview.monthRevenue)}</h3>
          </div>
          <div className="stat-card">
            <span className="stat-label">Store Rating</span>
            <h3 className="stat-number text-yellow-500 mt-1">⭐ {overview.rating?.toFixed(1) || 'N/A'}</h3>
          </div>
        </div>
      )}

      {/* Top Products Grid */}
      <div className="bg-card border border-border p-6 rounded-2xl flex flex-col gap-4">
        <h3 className="font-display font-bold text-lg">Top Performing Products</h3>
        {topProducts.length === 0 ? (
          <p className="text-muted-foreground text-sm py-4">No product metrics available.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {topProducts.map((p) => (
              <div key={p._id} className="flex items-center justify-between p-4 border border-border rounded-xl">
                <div className="flex items-center gap-3">
                  <img src={p.product?.thumbnail} className="w-12 h-16 object-cover bg-muted rounded-lg" />
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm">{p.product?.name}</span>
                    <span className="text-xs text-muted-foreground">{p.totalSold} items sold</span>
                  </div>
                </div>
                <span className="font-bold text-sm text-gold">{formatCurrency(p.revenue)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
