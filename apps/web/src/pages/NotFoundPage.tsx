import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <span className="text-8xl mb-4 select-none">🕊️</span>
      <h1 className="text-4xl font-display font-bold mb-2">Page Not Found</h1>
      <p className="text-muted-foreground text-sm max-w-sm mb-6">
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>
      <Link to="/" className="btn-primary rounded-full px-8 py-3">
        Back to Home
      </Link>
    </div>
  );
};

export default NotFoundPage;
