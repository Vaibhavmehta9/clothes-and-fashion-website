import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';

interface Product {
  _id: string;
  name: string;
  basePrice: number;
  baseMrp: number;
  status: string;
  thumbnail: string;
}

const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get('/products');
      // For simplicity, vendor routes on the backend return user-scoped products when role is vendor
      setProducts(data.data);
    } catch {
      toast.error('Failed to load listings.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success('Listing deleted.');
      fetchProducts();
    } catch {
      toast.error('Could not delete listing.');
    }
  };

  if (isLoading) {
    return <div className="h-48 bg-muted animate-pulse rounded-2xl"></div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-display font-bold">Catalog Listings ({products.length})</h2>

      {products.length === 0 ? (
        <div className="text-center py-12 border border-border rounded-2xl bg-card">
          <p className="text-muted-foreground text-sm">No products listed yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {products.map((p) => (
            <div key={p._id} className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between">
              <div className="aspect-[3/4] bg-muted relative">
                <img src={p.thumbnail} alt={p.name} className="w-full h-full object-cover" />
                <span className={`absolute top-4 right-4 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${p.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  {p.status}
                </span>
              </div>
              <div className="p-4 flex flex-col gap-2">
                <h4 className="font-semibold text-sm line-clamp-1">{p.name}</h4>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm">{formatCurrency(p.basePrice)}</span>
                  {p.baseMrp > p.basePrice && (
                    <span className="text-xs text-muted-foreground line-through">{formatCurrency(p.baseMrp)}</span>
                  )}
                </div>
                <div className="flex gap-2 mt-2 border-t border-border pt-4">
                  <button
                    onClick={() => handleDelete(p._id)}
                    className="flex-1 py-2 px-3 border border-red-200 text-red-500 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 hover:bg-red-50"
                  >
                    <FiTrash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductsPage;
