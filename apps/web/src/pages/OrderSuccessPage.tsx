import React from 'react';
import { useLocation, Link, Navigate } from 'react-router-dom';
import { formatCurrency } from '@/lib/utils';
import { FiCheckCircle, FiPackage, FiArrowRight } from 'react-icons/fi';

const OrderSuccessPage: React.FC = () => {
  const location = useLocation();
  const order = location.state?.order;

  if (!order) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="max-w-md mx-auto py-20 px-4 text-center flex flex-col items-center gap-6">
      <div className="text-green-500 mb-2">
        <FiCheckCircle size={64} className="mx-auto" />
      </div>
      
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-display font-bold text-charcoal-950 dark:text-white">Order Confirmed!</h1>
        <p className="text-muted-foreground text-sm">
          Thank you for shopping with StyleVerse. Your order has been received and is being processed.
        </p>
      </div>

      <div className="w-full bg-muted/40 border border-border p-6 rounded-2xl flex flex-col gap-4 text-sm text-left my-4">
        <div className="flex justify-between border-b border-border pb-3">
          <span className="text-muted-foreground">Order Number</span>
          <span className="font-semibold">{order.orderNumber}</span>
        </div>
        <div className="flex justify-between border-b border-border pb-3">
          <span className="text-muted-foreground">Total Paid</span>
          <span className="font-semibold text-gold">{formatCurrency(order.total)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Payment Method</span>
          <span className="font-semibold uppercase">{order.paymentMethod}</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full">
        <Link to="/account/orders" className="btn-primary rounded-xl py-3 flex-1 flex items-center justify-center gap-2 text-sm">
          <FiPackage /> View Orders
        </Link>
        <Link to="/products" className="btn-secondary rounded-xl py-3 flex-1 flex items-center justify-center gap-2 text-sm border-charcoal-300 text-charcoal-700 hover:bg-muted">
          Continue Shopping <FiArrowRight />
        </Link>
      </div>
    </div>
  );
};

export default OrderSuccessPage;
