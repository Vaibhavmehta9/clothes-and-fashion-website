import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { FiGrid, FiPackage, FiShoppingBag, FiSettings, FiLogOut, FiMessageSquare } from 'react-icons/fi';
import { useAuthStore } from '@/store';
import toast from 'react-hot-toast';

const VendorLayout: React.FC = () => {
  const { logout, vendorProfile, user } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully.');
    navigate('/');
  };

  return (
    <div className="min-h-screen flex bg-muted/20">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-card border-r border-border flex flex-col justify-between shrink-0 h-screen sticky top-0">
        <div className="flex flex-col p-6 gap-8">
          <Link to="/" className="text-xl font-display font-black tracking-widest bg-clip-text text-transparent bg-gold-gradient">
            STYLEVERSE
          </Link>
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider px-3">
              Store Dashboard
            </span>
            <NavLink
              to="/vendor/dashboard"
              className={({ isActive }) => `flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-gold/10 text-gold font-semibold' : 'text-muted-foreground hover:bg-muted/30 hover:text-foreground'}`}
            >
              <FiGrid size={16} /> Overview
            </NavLink>
            {user?.role !== 'support' && (
              <NavLink
                to="/vendor/products"
                className={({ isActive }) => `flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-gold/10 text-gold font-semibold' : 'text-muted-foreground hover:bg-muted/30 hover:text-foreground'}`}
              >
                <FiPackage size={16} /> Products
              </NavLink>
            )}
            <NavLink
              to="/vendor/orders"
              className={({ isActive }) => `flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-gold/10 text-gold font-semibold' : 'text-muted-foreground hover:bg-muted/30 hover:text-foreground'}`}
            >
              <FiShoppingBag size={16} /> Orders
            </NavLink>

            {(user?.role === 'admin' || user?.role === 'support') && (
              <>
                <span className="text-[10px] uppercase font-bold text-gold tracking-wider px-3 mt-6">
                  Customer Support
                </span>
                <NavLink
                  to="/vendor/support"
                  className={({ isActive }) => `flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-gold/10 text-gold font-semibold' : 'text-muted-foreground hover:bg-muted/30 hover:text-gold'}`}
                >
                  <FiMessageSquare size={16} /> Enquiries
                </NavLink>
              </>
            )}

            {user?.role === 'admin' && (
              <>
                <span className="text-[10px] uppercase font-bold text-gold tracking-wider px-3 mt-6">
                  Super Admin Panel
                </span>
                <NavLink
                  to="/vendor/admin-console"
                  className={({ isActive }) => `flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-gold/10 text-gold font-semibold' : 'text-muted-foreground hover:bg-muted/30 hover:text-gold'}`}
                >
                  <FiSettings size={16} /> Admin Console
                </NavLink>
              </>
            )}
          </div>
        </div>

        <div className="p-6 flex flex-col gap-2">
          <div className="px-3 pb-4 border-b border-border mb-2">
            <h5 className="font-semibold text-sm truncate">{vendorProfile?.storeName || 'My Store'}</h5>
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
              Status: {vendorProfile?.status}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-3 text-sm text-red-500 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 transition-all text-left"
          >
            <FiLogOut size={16} /> Log Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto h-screen">
        <Outlet />
      </main>
    </div>
  );
};

import { Link } from 'react-router-dom';

export default VendorLayout;
