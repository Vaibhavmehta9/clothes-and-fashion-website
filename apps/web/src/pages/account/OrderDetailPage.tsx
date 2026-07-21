import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { formatCurrency, getOrderStatusColor, getPaymentStatusColor } from '@/lib/utils';
import toast from 'react-hot-toast';
import { FiDownload, FiRotateCcw, FiCheckCircle } from 'react-icons/fi';

interface OrderItem {
  _id: string;
  name: string;
  thumbnail: string;
  color: string;
  size: string;
  quantity: number;
  price: number;
  total: number;
  status: string;
  returnRequested?: boolean;
  returnReason?: string;
}

interface OrderDetail {
  _id: string;
  orderNumber: string;
  items: OrderItem[];
  shippingAddress: {
    name: string;
    phone: string;
    addressLine1: string;
    city: string;
    state: string;
    pincode: string;
  };
  subtotal: number;
  discount: number;
  shippingFee: number;
  tax: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  createdAt: string;
}

const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState<string | null>(null); // item id
  const [returnReason, setReturnReason] = useState('');

  const fetchOrder = async () => {
    try {
      const { data } = await api.get(`/orders/${id}`);
      setOrder(data.data);
    } catch {
      toast.error('Failed to load order details.');
      navigate('/account/orders');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleDownloadInvoice = async () => {
    if (!order) return;
    setIsDownloading(true);
    try {
      const response = await api.get(`/orders/${order._id}/invoice`, {
        responseType: 'blob',
      });
      // Trigger download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${order.orderNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Invoice downloaded successfully.');
    } catch {
      toast.error('Failed to download invoice.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleRequestReturnSubmit = async () => {
    if (!showReturnModal || !order) return;
    try {
      await api.put(`/orders/${order._id}/return-request`, {
        itemId: showReturnModal,
        reason: returnReason,
      });
      toast.success('Return request submitted successfully.');
      setShowReturnModal(null);
      setReturnReason('');
      fetchOrder();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit return request.');
    }
  };

  if (isLoading || !order) {
    return (
      <div className="h-48 bg-muted animate-pulse rounded-2xl"></div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-3xl">
      <div className="flex justify-between items-center border-b border-border pb-4">
        <div>
          <h2 className="text-2xl font-display font-bold">Order Details</h2>
          <span className="text-xs text-muted-foreground">ID: {order.orderNumber}</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadInvoice}
            disabled={isDownloading}
            className="flex items-center gap-2 bg-gold/10 text-gold hover:bg-gold/20 font-semibold px-4 py-2 rounded-xl text-xs transition-all disabled:opacity-50"
          >
            <FiDownload /> {isDownloading ? 'Downloading...' : 'Download Invoice'}
          </button>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${getOrderStatusColor(order.status)}`}>
            {order.status.replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Shipping address details */}
        <div className="bg-card border border-border p-6 rounded-2xl flex flex-col gap-2">
          <h4 className="font-semibold text-sm uppercase tracking-wider text-gold mb-1">Shipping Address</h4>
          <p className="font-medium text-sm">{order.shippingAddress.name}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {order.shippingAddress.addressLine1}, {order.shippingAddress.city}, {order.shippingAddress.state} – {order.shippingAddress.pincode}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Phone: {order.shippingAddress.phone}</p>
        </div>

        {/* Payment summary */}
        <div className="bg-card border border-border p-6 rounded-2xl flex flex-col gap-2">
          <h4 className="font-semibold text-sm uppercase tracking-wider text-gold mb-1">Payment Method</h4>
          <p className="font-medium text-sm uppercase">{order.paymentMethod}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-muted-foreground">Payment Status:</span>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getPaymentStatusColor(order.paymentStatus)}`}>
              {order.paymentStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Item list */}
      <div className="flex flex-col gap-4">
        <h3 className="font-display font-bold text-lg">Order Items</h3>
        <div className="flex flex-col gap-4">
          {order.items.map((item) => (
            <div key={item._id} className="flex gap-4 p-4 border border-border bg-card rounded-2xl relative">
              <img src={item.thumbnail} alt={item.name} className="w-16 h-20 object-cover bg-muted rounded-xl shrink-0" />
              <div className="flex-1 min-w-0 flex flex-col gap-1">
                <h4 className="font-semibold text-sm truncate">{item.name}</h4>
                <span className="text-xs text-muted-foreground">
                  Size: {item.size} | Color: {item.color} | Qty: {item.quantity}
                </span>
                <span className="font-bold text-sm text-gold mt-1">{formatCurrency(item.price * item.quantity)}</span>
              </div>
              
              {/* Return Buttons */}
              <div className="absolute right-4 bottom-4">
                {item.returnRequested ? (
                  <span className="flex items-center gap-1.5 text-xs text-yellow-600 font-semibold bg-yellow-50 dark:bg-yellow-950/20 px-3 py-1 rounded-full">
                    <FiCheckCircle /> Return Requested
                  </span>
                ) : (
                  item.status === 'delivered' && (
                    <button
                      onClick={() => setShowReturnModal(item._id)}
                      className="flex items-center gap-1 bg-red-50 text-red-500 hover:bg-red-100 font-semibold px-3 py-1.5 rounded-xl text-xs transition-all"
                    >
                      <FiRotateCcw size={12} /> Return Item
                    </button>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary costs breakdown */}
      <div className="border-t border-border pt-6 flex flex-col gap-3 text-sm max-w-sm self-end w-full">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{formatCurrency(order.subtotal)}</span>
        </div>
        {order.discount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Discount</span>
            <span>-{formatCurrency(order.discount)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-muted-foreground">Shipping</span>
          <span>{order.shippingFee === 0 ? 'FREE' : formatCurrency(order.shippingFee)}</span>
        </div>
        <div className="flex justify-between font-bold text-base border-t border-border pt-4 mt-2">
          <span>Grand Total</span>
          <span>{formatCurrency(order.total)}</span>
        </div>
      </div>

      {/* Return Request Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border p-6 rounded-3xl shadow-xl w-full max-w-md flex flex-col gap-4">
            <h3 className="text-lg font-bold">Request Return</h3>
            <p className="text-sm text-muted-foreground">Please tell us why you are returning this item. Our support team will process it shortly.</p>
            <textarea
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              placeholder="e.g. Size is too small, or fabric quality does not match description."
              className="bg-background border border-input rounded-xl px-3 py-2 text-sm focus:ring-1 focus:ring-gold h-24 resize-none"
              required
            />
            <div className="flex gap-3 justify-end mt-2">
              <button
                onClick={() => { setShowReturnModal(null); setReturnReason(''); }}
                className="bg-muted/50 hover:bg-muted text-foreground font-semibold px-4 py-2 rounded-xl text-sm transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestReturnSubmit}
                className="bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-all shadow-sm"
              >
                Submit Return
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetailPage;
