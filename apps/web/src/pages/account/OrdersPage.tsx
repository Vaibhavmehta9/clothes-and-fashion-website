import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { formatCurrency, getOrderStatusColor } from '@/lib/utils';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

interface Order {
  _id: string;
  orderNumber: string;
  total: number;
  status: string;
  createdAt: string;
}

const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data } = await api.get('/orders/my-orders');
        setOrders(data.data);
      } catch {
        toast.error('Failed to load orders.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrders();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        {[...Array(3)].map((_, idx) => (
          <div key={idx} className="h-24 bg-muted animate-pulse rounded-2xl"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-display font-bold">My Orders</h2>
      {orders.length === 0 ? (
        <div className="text-center py-12 border border-border rounded-2xl bg-card">
          <p className="text-muted-foreground text-sm mb-4">You have not placed any orders yet.</p>
          <Link to="/products" className="btn-primary rounded-xl text-sm">Shop Now</Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((o) => (
            <div
              key={o._id}
              className="bg-card border border-border p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Order ID</span>
                <span className="font-semibold text-sm">{o.orderNumber}</span>
                <span className="text-xs text-muted-foreground mt-1">
                  Placed on {new Date(o.createdAt).toLocaleDateString('en-IN')}
                </span>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex flex-col sm:items-end gap-1">
                  <span className="text-xs text-muted-foreground">Total Paid</span>
                  <span className="font-bold text-base text-gold">{formatCurrency(o.total)}</span>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${getOrderStatusColor(o.status)}`}>
                  {o.status.replace(/_/g, ' ')}
                </span>
                <Link
                  to={`/account/orders/${o._id}`}
                  className="btn-secondary py-2 px-4 text-xs rounded-xl"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
