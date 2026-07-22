import React, { useEffect, useState } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore, useCartStore, useUIStore } from '@/store';
import { FiShoppingBag, FiHeart, FiUser, FiSearch, FiMenu, FiX, FiLogOut, FiLayers } from 'react-icons/fi';
import toast from 'react-hot-toast';

const StorefrontLayout: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { cart, fetchCart } = useCartStore();
  const { theme, toggleTheme } = useUIStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    }
  }, [isAuthenticated, fetchCart]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully.');
    navigate('/');
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[72px] flex items-center justify-between gap-6">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-1 shrink-0">
            <span className="text-[22px] font-black italic tracking-tighter text-pink-600">
              STYLEVERSE
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-5 shrink-0 text-[15px] font-semibold text-gray-800">
            <Link to="/products?category=women" className="hover:text-pink-600 transition-colors">Women</Link>
            <Link to="/products?category=men" className="hover:text-pink-600 transition-colors">Men</Link>
            <Link to="/products?category=kids" className="hover:text-pink-600 transition-colors">Kids</Link>
            <Link to="/" className="hover:text-pink-600 transition-colors">Home</Link>
            <Link to="/products" className="hover:text-pink-600 transition-colors">All Brands</Link>
            <Link to="/blogs" className="hover:text-pink-600 transition-colors">More</Link>
          </nav>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="hidden md:flex items-center flex-1 max-w-xl relative">
            <FiSearch className="absolute left-3 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search for products, styles, brands"
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border border-transparent rounded focus:outline-none focus:border-gray-300 focus:bg-white text-[13px] text-gray-800 transition-all placeholder:text-gray-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>

          {/* Actions */}
          <div className="flex items-center gap-6 shrink-0">
            
            {/* User Account / Login */}
            {isAuthenticated ? (
              <div className="hidden sm:flex relative group flex-col items-center cursor-pointer hover:text-pink-600 text-gray-700">
                <Link to="/account" className="flex flex-col items-center">
                  <FiUser size={22} className="mb-0.5" />
                  <span className="text-[11px] font-medium leading-none">{user?.name.split(' ')[0] || 'Account'}</span>
                </Link>
                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-100 rounded shadow-lg py-2 hidden group-hover:block transition-all z-50">
                  {user?.role === 'vendor' && (
                    <Link to="/vendor/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      Vendor Dashboard
                    </Link>
                  )}
                  {user?.role === 'customer' && (
                    <Link to="/vendor/register" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      Sell on StyleVerse
                    </Link>
                  )}
                  <Link to="/account" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    My Profile
                  </Link>
                  <Link to="/account/orders" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    My Orders
                  </Link>
                  {user?.role === 'customer' && (
                    <Link to="/account/support" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      Support Enquiries
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <FiLogOut size={14} /> Log Out
                  </button>
                </div>
              </div>
            ) : (
              <Link to="/auth/login" className="hidden sm:flex flex-col items-center hover:text-pink-600 text-gray-700 transition-colors">
                <FiUser size={22} className="mb-0.5" />
                <span className="text-[11px] font-medium leading-none">Account</span>
              </Link>
            )}

            {/* Wishlist */}
            <Link to="/wishlist" className="hidden sm:flex flex-col items-center relative hover:text-pink-600 text-gray-700 transition-colors">
              <FiHeart size={22} className="mb-0.5" />
              <span className="text-[11px] font-medium leading-none">Wishlist</span>
              {isAuthenticated && user?.wishlist && user.wishlist.length > 0 && (
                <span className="absolute -top-1 -right-2 bg-pink-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {user.wishlist.length}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Link to="/cart" className="flex flex-col items-center relative hover:text-pink-600 text-gray-700 transition-colors">
              <FiShoppingBag size={22} className="mb-0.5" />
              <span className="text-[11px] font-medium leading-none">Cart</span>
              {cart && cart.items && cart.items.length > 0 && (
                <span className="absolute -top-1 -right-2 bg-pink-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cart.items.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </Link>
            
            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden flex flex-col items-center text-gray-700 hover:text-pink-600 ml-2"
            >
              {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-border bg-white dark:bg-charcoal-950 py-4 px-6 flex flex-col gap-4">
            <form onSubmit={handleSearch} className="relative flex items-center">
              <input
                type="text"
                placeholder="Search..."
                className="w-full px-4 py-2 pl-10 rounded-full border border-input bg-muted/50 focus:outline-none focus:ring-2 focus:ring-gold text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <FiSearch className="absolute left-3.5 text-muted-foreground" size={16} />
            </form>
            
            <div className="flex flex-col gap-2">
              <Link to="/products" className="text-lg font-medium py-2 border-b border-border" onClick={() => setIsMobileMenuOpen(false)}>Shop</Link>
              <Link to="/products?isNewArrival=true" className="text-lg font-medium py-2 border-b border-border" onClick={() => setIsMobileMenuOpen(false)}>New Arrivals</Link>
              <Link to="/products?isOnSale=true" className="text-lg font-medium py-2 border-b border-border" onClick={() => setIsMobileMenuOpen(false)}>Sale</Link>
              <Link to="/blogs" className="text-lg font-medium py-2" onClick={() => setIsMobileMenuOpen(false)}>Editorial</Link>
            </div>

            {/* Mobile-only additional navigation actions */}
            <div className="flex flex-col gap-1 pt-4 border-t border-border">
              <Link to="/wishlist" className="flex items-center gap-3 text-base font-medium py-2 text-muted-foreground hover:text-foreground" onClick={() => setIsMobileMenuOpen(false)}>
                <FiHeart size={18} /> Wishlist
              </Link>
              <Link to="/compare" className="flex items-center gap-3 text-base font-medium py-2 text-muted-foreground hover:text-foreground" onClick={() => setIsMobileMenuOpen(false)}>
                <FiLayers size={18} /> Compare Products
              </Link>
              
              <button 
                onClick={() => { toggleTheme(); setIsMobileMenuOpen(false); }} 
                className="flex items-center gap-3 text-base font-medium py-2 text-muted-foreground hover:text-foreground"
              >
                {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
              </button>

              {isAuthenticated ? (
                <>
                  <Link to="/account" className="flex items-center gap-3 text-base font-medium py-2 text-muted-foreground hover:text-foreground" onClick={() => setIsMobileMenuOpen(false)}>
                    <FiUser size={18} /> My Account
                  </Link>
                  <button 
                    onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }} 
                    className="flex items-center gap-3 text-base font-medium text-red-500 py-2 mt-2"
                  >
                    <FiLogOut size={18} /> Log Out
                  </button>
                </>
              ) : (
                <Link to="/auth/login" className="btn-primary mt-4 py-2.5 rounded-xl text-center text-sm" onClick={() => setIsMobileMenuOpen(false)}>
                  Sign In / Register
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* FOOTER */}
      <footer className="bg-charcoal-950 text-white border-t border-charcoal-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="flex flex-col gap-4">
            <span className="text-2xl font-display font-black tracking-widest bg-clip-text text-transparent bg-gold-gradient">
              STYLEVERSE
            </span>
            <p className="text-charcoal-400 text-sm">
              India's premier multi-vendor fashion marketplace. Discover and shop the best in design, elegance, and curated style.
            </p>
          </div>
          <div>
            <h4 className="text-gold font-display font-semibold mb-4">Shop Categories</h4>
            <ul className="space-y-2 text-sm text-charcoal-400">
              <li><Link to="/products?category=men" className="hover:text-white transition-colors">Men's Collection</Link></li>
              <li><Link to="/products?category=women" className="hover:text-white transition-colors">Women's Collection</Link></li>
              <li><Link to="/products?category=footwear" className="hover:text-white transition-colors">Footwear</Link></li>
              <li><Link to="/products?category=accessories" className="hover:text-white transition-colors">Accessories</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-gold font-display font-semibold mb-4">Customer Care</h4>
            <ul className="space-y-2 text-sm text-charcoal-400">
              <li><Link to="/pages/about-us" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="/pages/shipping-policy" className="hover:text-white transition-colors">Shipping & Delivery</Link></li>
              <li><Link to="/pages/refund-policy" className="hover:text-white transition-colors">Returns & Refunds</Link></li>
              <li><Link to="/pages/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-gold font-display font-semibold mb-4">Newsletter</h4>
            <p className="text-charcoal-400 text-sm mb-4">Subscribe to receive updates, access to exclusive deals, and more.</p>
            <form className="flex gap-2">
              <input
                type="email"
                placeholder="Enter email address"
                className="px-4 py-2 rounded-xl bg-charcoal-900 border border-charcoal-800 text-sm focus:outline-none focus:ring-1 focus:ring-gold flex-1"
              />
              <button type="submit" className="btn-primary py-2 px-4 rounded-xl text-sm">Join</button>
            </form>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-charcoal-900 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-charcoal-500">
          <p>© 2026 StyleVerse. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-white transition-colors">Instagram</a>
            <a href="#" className="hover:text-white transition-colors">Facebook</a>
            <a href="#" className="hover:text-white transition-colors">Twitter</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default StorefrontLayout;
