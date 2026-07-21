import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface Product {
  _id: string;
  name: string;
  slug: string;
  thumbnail: string;
  basePrice: number;
}

const WishlistPage: React.FC = () => {
  const { toggleWishlist } = useAuthStore();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWishlist = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get('/wishlist');
      setProducts(data.data);
    } catch {
      toast.error('Failed to load wishlist items.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const handleRemove = async (productId: string) => {
    try {
      await api.post('/wishlist/toggle', { productId });
      toggleWishlist(productId);
      toast.success('Removed from wishlist.');
      fetchWishlist();
    } catch {
      toast.error('Failed to remove item.');
    }
  };

  if (isLoading) {
    return <div className="h-48 bg-muted animate-pulse rounded-2xl"></div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-display font-bold mb-8">My Wishlist</h1>

      {products.length === 0 ? (
        <div className="text-center py-24 border border-border rounded-2xl bg-card">
          <span className="text-4xl mb-4 block">💖</span>
          <p className="text-muted-foreground text-sm mb-4">Your wishlist is currently empty.</p>
          <button onClick={() => navigate('/products')} className="btn-primary rounded-xl">Shop Now</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {products.map((p) => (
            <div key={p._id} className="product-card flex flex-col justify-between">
              <div className="product-img-wrapper" onClick={() => navigate(`/products/${p.slug}`)}>
                <img src={p.thumbnail} alt={p.name} />
              </div>
              <div className="p-4 flex flex-col gap-3">
                <h4 className="font-semibold text-sm truncate">{p.name}</h4>
                <span className="font-bold text-sm text-gold">{formatCurrency(p.basePrice)}</span>
                <button
                  onClick={() => handleRemove(p._id)}
                  className="w-full py-2 border border-red-200 text-red-500 rounded-xl text-xs font-semibold hover:bg-red-50"
                >
                  Remove Item
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WishlistPage;
