import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';

interface VendorStore {
  storeName: string;
  storeDescription: string;
  storeLogo: string;
  storeBanner: string;
  rating: number;
}

interface Product {
  _id: string;
  name: string;
  slug: string;
  thumbnail: string;
  basePrice: number;
}

const VendorStorePage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [store, setStore] = useState<VendorStore | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStore = async () => {
      try {
        const storeRes = await api.get(`/vendors/${slug}`);
        setStore(storeRes.data.data);
        const prodRes = await api.get(`/products?vendor=${storeRes.data.data._id}`);
        setProducts(prodRes.data.data);
      } catch {
        toast.error('Storefront is unavailable.');
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };
    fetchStore();
  }, [slug, navigate]);

  if (isLoading || !store) {
    return <div className="h-48 bg-muted animate-pulse rounded-2xl"></div>;
  }

  return (
    <div className="flex flex-col gap-12 pb-24">
      {/* Banner */}
      {store.storeBanner && (
        <div className="h-60 bg-muted relative">
          <img src={store.storeBanner} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/30"></div>
        </div>
      )}

      {/* Profile summary */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex items-start gap-6 mt-[-4rem] relative z-10">
        <img src={store.storeLogo} className="w-24 h-24 rounded-full border-4 border-white shadow bg-white" />
        <div className="flex flex-col gap-1.5 mt-16">
          <h1 className="text-3xl font-display font-bold">{store.storeName}</h1>
          <p className="text-sm text-muted-foreground max-w-xl">{store.storeDescription}</p>
        </div>
      </div>

      {/* Catalog items */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <h3 className="font-display font-bold text-xl mb-6">Store Catalog ({products.length})</h3>
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
      </div>
    </div>
  );
};

export default VendorStorePage;
