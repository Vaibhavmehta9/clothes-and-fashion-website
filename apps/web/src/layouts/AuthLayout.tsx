import React from 'react';
import { Outlet } from 'react-router-dom';

const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-12 relative overflow-hidden">
      {/* Background Accent Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-gold/5 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-royal/5 blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10 flex flex-col items-center gap-8">
        {/* StyleVerse Brand Header */}
        <Link to="/" className="text-3xl font-display font-black tracking-widest bg-clip-text text-transparent bg-gold-gradient">
          STYLEVERSE
        </Link>
        <Outlet />
      </div>
    </div>
  );
};

// Inline link helper to avoid dependency cycles or complex paths
import { Link } from 'react-router-dom';

export default AuthLayout;
