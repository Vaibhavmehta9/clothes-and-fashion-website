import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { formatCurrency, getOrderStatusColor } from '@/lib/utils';
import toast from 'react-hot-toast';

interface OrderItem {
  _id: string;
  name: string;
  color: string;
  size: string;
  quantity: number;
  price: number;
  total: number;
  status: string;
}

interface Order {
  _id: string;
  orderNumber: string;
  items: OrderItem[];
  shippingAddress: {
    name: string;
    city: string;
  };
  total: number;
  status: string;
  createdAt: string;
}

const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get('/orders/vendor/orders');
      setOrders(data.data);
    } catch {
      toast.error('Failed to load vendor orders.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusUpdate = async (orderId: string, itemId: string, status: string) => {
    try {
      await api.put(`/orders/${orderId}/status`, { itemId, status });
      toast.success('Order status updated.');
      fetchOrders();
    } catch {
      toast.error('Failed to update status.');
    }
  };

  if (isLoading) {
    return <div className="h-48 bg-muted animate-pulse rounded-2xl"></div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-display font-bold">Fulfillment Orders ({orders.length})</h2>

      {orders.length === 0 ? (
        <div className="text-center py-12 border border-border rounded-2xl bg-card">
          <p className="text-muted-foreground text-sm">No orders assigned yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((o) => (
            <div key={o._id} className="bg-card border border-border p-6 rounded-2xl flex flex-col gap-4 shadow-sm">
              <div className="flex justify-between items-center border-b border-border pb-4">
                <div>
                  <span className="text-xs text-muted-foreground">Order ID</span>
                  <h4 className="font-semibold text-sm">{o.orderNumber}</h4>
                </div>
                <span className="text-xs text-muted-foreground">
                  Placed on {new Date(o.createdAt).toLocaleDateString('en-IN')}
                </span>
              </div>

              <div className="flex flex-col gap-3">
                {o.items.map((item) => (
                  <div key={item._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-3 last:border-0 last:pb-0">
                    <div>
                      <h5 className="font-semibold text-sm">{item.name}</h5>
                      <span className="text-xs text-muted-foreground">
                        Size: {item.size} | Color: {item.color} | Qty: {item.quantity}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-sm">{formatCurrency(item.price * item.quantity)}</span>
                      <select
                        value={item.status || 'pending'}
                        onChange={(e) => handleStatusUpdate(o._id, item._id, e.target.value)}
                        className="bg-background border border-input rounded-xl px-2.5 py-1 text-xs font-semibold focus:ring-1 focus:ring-gold"
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
