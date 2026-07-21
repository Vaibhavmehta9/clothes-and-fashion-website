import React from 'react';

const PageLoader: React.FC = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-gold/20 border-t-gold animate-spin"></div>
          <div className="absolute inset-2 rounded-full border-4 border-gold/10 border-b-gold animate-spin-slow"></div>
        </div>
        <span className="text-gold font-display font-semibold tracking-widest text-sm animate-pulse">
          STYLEVERSE
        </span>
      </div>
    </div>
  );
};

export default PageLoader;
