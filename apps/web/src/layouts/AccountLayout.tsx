import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { FiUser, FiPackage, FiMapPin, FiBell } from 'react-icons/fi';

const AccountLayout: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col md:flex-row gap-8">
      {/* Sidebar Nav */}
      <aside className="w-full md:w-64 shrink-0 bg-card border border-border p-6 rounded-2xl flex flex-col gap-2 shadow-sm self-start">
        <h3 className="font-display font-bold text-lg mb-4 px-3">My Account</h3>
        
        <NavLink
          to="/account"
          end
          className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-gold/10 text-gold font-semibold' : 'text-muted-foreground hover:bg-muted/30 hover:text-foreground'}`}
        >
          <FiUser size={16} /> Profile
        </NavLink>
        <NavLink
          to="/account/orders"
          className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-gold/10 text-gold font-semibold' : 'text-muted-foreground hover:bg-muted/30 hover:text-foreground'}`}
        >
          <FiPackage size={16} /> Orders
        </NavLink>
        <NavLink
          to="/account/addresses"
          className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-gold/10 text-gold font-semibold' : 'text-muted-foreground hover:bg-muted/30 hover:text-foreground'}`}
        >
          <FiMapPin size={16} /> Addresses
        </NavLink>
        <NavLink
          to="/account/notifications"
          className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-gold/10 text-gold font-semibold' : 'text-muted-foreground hover:bg-muted/30 hover:text-foreground'}`}
        >
          <FiBell size={16} /> Notifications
        </NavLink>
      </aside>

      {/* Account Views */}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};

export default AccountLayout;
