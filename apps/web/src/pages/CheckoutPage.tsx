import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '@/store';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';
import { FiCheck, FiGift, FiMapPin, FiCreditCard } from 'react-icons/fi';

interface Address {
  _id: string;
  name: string;
  phone: string;
  addressLine1: string;
  city: string;
  state: string;
  pincode: string;
}

interface Coupon {
  _id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  description: string;
}

const CheckoutPage: React.FC = () => {
  const { cart, clearCart } = useCartStore();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'razorpay'>('cod');
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const { data } = await api.get('/addresses');
        setAddresses(data.data || []);
        if (data.data && data.data.length > 0) {
          setSelectedAddressId(data.data[0]._id);
        }
      } catch {
        toast.error('Failed to load shipping addresses.');
      }
    };

    const fetchCoupons = async () => {
      try {
        const { data } = await api.get('/coupons');
        setAvailableCoupons(data.data || []);
      } catch {
        // Fallback static coupons if endpoint fails
        setAvailableCoupons([
          { _id: '1', code: 'WELCOME20', discountType: 'percentage', discountValue: 20, minOrderAmount: 0, description: '20% off on your first order' },
          { _id: '2', code: 'FREESHIP', discountType: 'fixed', discountValue: 150, minOrderAmount: 999, description: 'Save ₹150 on shipping fee' },
          { _id: '3', code: 'FESTIVE10', discountType: 'percentage', discountValue: 10, minOrderAmount: 1500, description: '10% off for festival shopping' }
        ]);
      }
    };

    fetchAddresses();
    fetchCoupons();
  }, []);

  const handleApplyCoupon = () => {
    if (!couponInput.trim()) return;
    const code = couponInput.trim().toUpperCase();
    const found = availableCoupons.find(c => c.code === code);

    if (!found) {
      toast.error('Invalid coupon code.');
      return;
    }

    if (cart.subtotal < found.minOrderAmount) {
      toast.error(`Minimum order amount to apply this coupon is ${formatCurrency(found.minOrderAmount)}`);
      return;
    }

    setAppliedCoupon(found);
    let calcDiscount = 0;
    if (found.discountType === 'percentage') {
      calcDiscount = (cart.subtotal * found.discountValue) / 100;
    } else {
      calcDiscount = found.discountValue;
    }
    setDiscountAmount(calcDiscount);
    toast.success(`Coupon "${code}" applied successfully! Saved ${formatCurrency(calcDiscount)}`);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
    setCouponInput('');
    toast.success('Coupon removed.');
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAddressId) {
      toast.error('Please select a shipping address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data } = await api.post('/orders', {
        shippingAddressId: selectedAddressId,
        paymentMethod,
        couponCode: appliedCoupon ? appliedCoupon.code : undefined,
      });
      toast.success('Order placed successfully!');
      clearCart();
      navigate('/order-success', { state: { order: data.data } });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to place order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold">Your cart is empty</h2>
          <button onClick={() => navigate('/products')} className="btn-primary mt-4">Shop Now</button>
        </div>
      </div>
    );
  }

  const finalTotal = Math.max(0, cart.subtotal - discountAmount + (cart.shippingFee || 0));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* 🧭 CHECKOUT STEPPER PROGRESS BAR */}
      <div className="mb-12 max-w-xl mx-auto flex items-center justify-between text-xs font-semibold text-charcoal-400">
        <div className="flex flex-col items-center gap-1.5 text-gold">
          <span className="w-8 h-8 rounded-full border-2 border-gold flex items-center justify-center bg-gold/10">1</span>
          <span>Shopping Cart</span>
        </div>
        <div className="flex-1 h-0.5 bg-gold/20 mx-4"></div>
        <div className="flex flex-col items-center gap-1.5 text-gold">
          <span className="w-8 h-8 rounded-full border-2 border-gold flex items-center justify-center bg-gold/10">2</span>
          <span>Shipping & Payment</span>
        </div>
        <div className="flex-1 h-0.5 bg-gold/20 mx-4"></div>
        <div className="flex flex-col items-center gap-1.5">
          <span className="w-8 h-8 rounded-full border-2 border-border flex items-center justify-center">3</span>
          <span>Confirmation</span>
        </div>
      </div>

      <h1 className="text-3xl font-display font-black mb-8 text-charcoal-950 dark:text-white">Secure Checkout</h1>
      <form onSubmit={handlePlaceOrder} className="flex flex-col lg:flex-row gap-12">
        
        {/* SHIPPING & PAYMENT DETAILS */}
        <div className="flex-1 flex flex-col gap-8">
          {/* Shipping Address Section */}
          <div className="bg-card border border-border p-6 rounded-2xl flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <FiMapPin className="text-gold text-lg" />
              <h3 className="font-display font-bold text-lg">1. Delivery Address</h3>
            </div>
            {addresses.length === 0 ? (
              <div className="text-sm text-muted-foreground py-2">
                No addresses found. Please add an address in your account settings.
                <button
                  type="button"
                  onClick={() => navigate('/account/addresses')}
                  className="text-gold font-semibold ml-2 hover:underline"
                >
                  Add Address
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {addresses.map((addr) => (
                  <label
                    key={addr._id}
                    className={`flex flex-col p-4 border rounded-xl cursor-pointer hover:border-gold/50 transition-all ${selectedAddressId === addr._id ? 'border-gold bg-gold/5' : 'border-border'}`}
                  >
                    <div className="flex items-center gap-2 font-semibold text-sm mb-2">
                      <input
                        type="radio"
                        name="address"
                        value={addr._id}
                        checked={selectedAddressId === addr._id}
                        onChange={() => setSelectedAddressId(addr._id)}
                        className="text-gold focus:ring-gold"
                      />
                      {addr.name}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {addr.addressLine1}, {addr.city}, {addr.state} – {addr.pincode}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">Phone: {addr.phone}</p>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Payment Method Section */}
          <div className="bg-card border border-border p-6 rounded-2xl flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <FiCreditCard className="text-gold text-lg" />
              <h3 className="font-display font-bold text-lg">2. Payment Method</h3>
            </div>
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-3 p-4 border border-border rounded-xl cursor-pointer hover:bg-muted/10">
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                  className="text-gold focus:ring-gold"
                />
                <div>
                  <h4 className="font-semibold text-sm">Cash on Delivery (COD)</h4>
                  <p className="text-xs text-muted-foreground">Pay with cash upon delivery</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-4 border border-border rounded-xl cursor-pointer hover:bg-muted/10">
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'razorpay'}
                  onChange={() => setPaymentMethod('razorpay')}
                  className="text-gold focus:ring-gold"
                />
                <div>
                  <h4 className="font-semibold text-sm">Online Payment (Razorpay Mock)</h4>
                  <p className="text-xs text-muted-foreground">Pay securely via Cards, Netbanking, or UPI</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* ORDER REVIEW & SUMMARY */}
        <aside className="w-full lg:w-96 shrink-0 bg-card border border-border p-6 rounded-2xl flex flex-col gap-6 self-start shadow-sm">
          <h3 className="font-display font-bold text-lg border-b border-border pb-4">Review Order</h3>
          
          <div className="flex flex-col gap-4 max-h-60 overflow-y-auto">
            {cart.items.map((item) => (
              <div key={item._id} className="flex gap-3 text-xs">
                <img src={item.product?.thumbnail} alt={item.product?.name} className="w-12 h-16 object-cover rounded-lg bg-muted shrink-0" />
                <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                  <h4 className="font-semibold truncate">{item.product?.name}</h4>
                  <span className="text-muted-foreground">Qty: {item.quantity} | Size: {item.variant?.size}</span>
                  <span className="font-bold">{formatCurrency(item.price * item.quantity)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* 🏷️ ACTIVE COUPONS PANEL */}
          <div className="border-t border-border pt-4 flex flex-col gap-3">
            <div className="flex items-center gap-1.5 text-gold font-semibold text-sm">
              <FiGift />
              <span>Apply Promos</span>
            </div>
            
            {appliedCoupon ? (
              <div className="bg-green-500/10 border border-green-500/30 text-green-700 dark:text-green-400 p-3 rounded-xl flex items-center justify-between text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <FiCheck className="text-base" />
                  <div>
                    <span className="block font-bold">{appliedCoupon.code}</span>
                    <span className="text-[10px] opacity-80">{appliedCoupon.description}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  className="text-red-500 hover:text-red-700 underline font-bold"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter Coupon Code"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  className="flex-1 border border-border bg-transparent rounded-xl px-3 py-2 text-xs outline-none uppercase focus:border-gold"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  className="bg-charcoal-900 text-white dark:bg-white dark:text-charcoal-950 font-bold px-3 py-2 rounded-xl text-xs hover:bg-gold hover:text-charcoal-950 transition-colors"
                >
                  Apply
                </button>
              </div>
            )}

            {/* Quick Apply Available Coupons */}
            {!appliedCoupon && availableCoupons.length > 0 && (
              <div className="flex flex-col gap-1.5 mt-1">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Available Promos</span>
                <div className="flex flex-wrap gap-2">
                  {availableCoupons.slice(0, 3).map(coupon => (
                    <button
                      key={coupon._id}
                      type="button"
                      onClick={() => {
                        setCouponInput(coupon.code);
                        toast.success(`Coupon code ${coupon.code} pasted. Click "Apply" to save!`);
                      }}
                      className="text-[10px] border border-gold/30 hover:border-gold bg-gold/5 px-2 py-1 rounded-full text-gold font-mono font-bold"
                    >
                      {coupon.code}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-border pt-4 flex flex-col gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(cart.subtotal)}</span>
            </div>
            
            {discountAmount > 0 && (
              <div className="flex justify-between text-green-600 font-semibold">
                <span>Discount Applied</span>
                <span>-{formatCurrency(discountAmount)}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span>{cart.shippingFee === 0 ? 'FREE' : formatCurrency(cart.shippingFee)}</span>
            </div>
            <div className="flex justify-between font-bold text-base border-t border-border pt-4 mt-2">
              <span>Total Amount</span>
              <span>{formatCurrency(finalTotal)}</span>
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary py-3.5 rounded-xl text-center w-full mt-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Placing Order...' : 'Place Order'}
          </button>
        </aside>

      </form>
    </div>
  );
};

export default CheckoutPage;
