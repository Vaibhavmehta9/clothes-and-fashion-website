import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '@/store';
import { formatCurrency } from '@/lib/utils';
import { FiTrash2, FiShoppingBag, FiArrowRight } from 'react-icons/fi';
import toast from 'react-hot-toast';

const CartPage: React.FC = () => {
  const { cart, fetchCart, updateItem, removeItem, clearCart } = useCartStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const handleQtyChange = async (itemId: string, currentQty: number, change: number) => {
    const newQty = currentQty + change;
    if (newQty < 1) return;
    try {
      await updateItem(itemId, newQty);
      toast.success('Cart updated.');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Stock limit reached.');
    }
  };

  const handleRemove = async (itemId: string) => {
    try {
      await removeItem(itemId);
      toast.success('Item removed.');
    } catch {
      toast.error('Failed to remove item.');
    }
  };

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-md mx-auto text-center py-24 px-4 flex flex-col items-center gap-6">
        <div className="w-20 h-20 bg-gold/10 rounded-full flex items-center justify-center text-gold mb-2">
          <FiShoppingBag size={36} />
        </div>
        <h2 className="text-2xl font-display font-bold">Your Cart is Empty</h2>
        <p className="text-muted-foreground text-sm">
          Browse through our premium collections and add products to start your luxury fashion journey.
        </p>
        <Link to="/products" className="btn-primary rounded-full px-8 py-3">
          Explore Products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col lg:flex-row gap-8">
      {/* ITEMS COLUMN */}
      <div className="flex-1 flex flex-col gap-6">
        <h1 className="text-2xl font-display font-bold mb-2">Shopping Bag ({cart.items.length})</h1>
        
        <div className="flex flex-col gap-4">
          {cart.items.map((item) => (
            <div
              key={item._id}
              className="flex items-center gap-4 bg-card border border-border p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
            >
              <img
                src={item.product?.thumbnail}
                alt={item.product?.name}
                className="w-20 h-24 object-cover rounded-xl bg-muted shrink-0"
              />
              <div className="flex-1 min-w-0 flex flex-col gap-1">
                <span className="text-[10px] text-gold uppercase tracking-wider font-semibold">
                  {item.product?.vendor?.storeName}
                </span>
                <h3 className="font-semibold text-sm line-clamp-1">
                  {item.product?.name}
                </h3>
                <span className="text-xs text-muted-foreground">
                  Size: {item.variant?.size} | Color: {item.variant?.color}
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-bold text-sm">{formatCurrency(item.price)}</span>
                  {item.mrp > item.price && (
                    <span className="text-xs text-muted-foreground line-through">{formatCurrency(item.mrp)}</span>
                  )}
                </div>
              </div>

              {/* Quantity selectors */}
              <div className="flex items-center border border-border rounded-xl px-2.5 py-1 bg-muted/20">
                <button
                  onClick={() => handleQtyChange(item._id, item.quantity, -1)}
                  className="px-1.5 font-bold text-sm hover:text-gold"
                >
                  -
                </button>
                <span className="px-3 font-semibold text-xs">{item.quantity}</span>
                <button
                  onClick={() => handleQtyChange(item._id, item.quantity, 1)}
                  className="px-1.5 font-bold text-sm hover:text-gold"
                >
                  +
                </button>
              </div>

              {/* Remove button */}
              <button
                onClick={() => handleRemove(item._id)}
                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-colors shrink-0"
                title="Remove item"
              >
                <FiTrash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={clearCart}
          className="text-xs text-red-500 font-semibold self-start hover:underline"
        >
          Clear Shopping Bag
        </button>
      </div>

      {/* SUMMARY SIDEBAR */}
      <aside className="w-full lg:w-96 shrink-0 bg-card border border-border p-6 rounded-2xl flex flex-col gap-6 self-start shadow-sm">
        <h3 className="font-display font-bold text-lg border-b border-border pb-4">Order Summary</h3>
        
        <div className="flex flex-col gap-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Bag Subtotal</span>
            <span>{formatCurrency(cart.subtotal)}</span>
          </div>
          {cart.discount > 0 && (
            <div className="flex justify-between text-green-600 font-medium">
              <span>Catalog Discount</span>
              <span>-{formatCurrency(cart.discount)}</span>
            </div>
          )}
          {cart.couponDiscount > 0 && (
            <div className="flex justify-between text-green-600 font-medium">
              <span>Coupon Discount</span>
              <span>-{formatCurrency(cart.couponDiscount)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Shipping Fee</span>
            <span>{cart.shippingFee === 0 ? 'FREE' : formatCurrency(cart.shippingFee)}</span>
          </div>
          <div className="flex justify-between font-bold text-base border-t border-border pt-4 mt-2">
            <span>Estimated Total</span>
            <span>{formatCurrency(cart.total)}</span>
          </div>
        </div>

        <button
          onClick={() => navigate('/checkout')}
          className="btn-primary py-3.5 rounded-xl flex items-center justify-center gap-2 mt-2"
        >
          Checkout <FiArrowRight />
        </button>
      </aside>
    </div>
  );
};

export default CartPage;
