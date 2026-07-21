import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Product {
  _id: string;
  name: string;
  slug: string;
  thumbnail: string;
  basePrice: number;
}

const SearchPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSearch = async () => {
      if (!query.trim()) return;
      setIsLoading(true);
      try {
        const { data } = await api.get(`/products/search?q=${encodeURIComponent(query)}`);
        setProducts(data.data);
      } catch {
        toast.error('Search query failed.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchSearch();
  }, [query]);

  if (!query.trim()) {
    return (
      <div className="max-w-md mx-auto text-center py-24 px-4">
        <h2 className="text-xl font-bold">Please enter a search query.</h2>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-2xl font-display font-bold mb-8">
        Search Results for "{query}" ({products.length})
      </h1>

      {isLoading ? (
        <div className="h-48 bg-muted animate-pulse rounded-2xl"></div>
      ) : products.length === 0 ? (
        <div className="text-center py-24 border border-border rounded-2xl bg-card">
          <p className="text-muted-foreground text-sm">No products matched your search term.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {products.map((p) => (
            <div key={p._id} className="product-card" onClick={() => navigate(`/products/${p.slug}`)}>
              <div className="product-img-wrapper">
                <img src={p.thumbnail} alt={p.name} />
              </div>
              <div className="p-4 flex flex-col gap-2">
                <h4 className="font-semibold text-sm truncate">{p.name}</h4>
                <span className="font-bold text-sm text-gold">{formatCurrency(p.basePrice)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchPage;
