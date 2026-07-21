import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiTrash2, FiShoppingBag, FiStar } from 'react-icons/fi';
import { useCartStore, useAuthStore } from '@/store';

interface Variant {
  _id: string;
  size: string;
  color: string;
  price: number;
  mrp: number;
  discount: number;
  stock: number;
}

interface Product {
  _id: string;
  name: string;
  slug: string;
  thumbnail: string;
  basePrice: number;
  baseMrp: number;
  baseDiscount: number;
  rating: number;
  reviewCount: number;
  shortDescription: string;
  brand?: {
    name: string;
  };
  category?: {
    name: string;
  };
  variants?: Variant[];
}

const ComparePage: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const { cart, addToCart } = useCartStore();
  const [comparedProducts, setComparedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchComparedProducts = async () => {
    const savedIds: string[] = JSON.parse(localStorage.getItem('styleverse_compare') || '[]');
    if (savedIds.length === 0) {
      setComparedProducts([]);
      setIsLoading(false);
      return;
    }

    try {
      // Fetch all products (status=all for admin/vendor if needed, or default public listing)
      const { data } = await api.get('/products?limit=100');
      const allProducts: Product[] = data.data || [];
      // Filter products that are in comparison IDs list
      const filtered = allProducts.filter((p) => savedIds.includes(p._id));
      setComparedProducts(filtered);
    } catch {
      toast.error('Failed to load compared products.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComparedProducts();
  }, []);

  const handleRemoveFromCompare = (id: string) => {
    const savedIds: string[] = JSON.parse(localStorage.getItem('styleverse_compare') || '[]');
    const updated = savedIds.filter((item) => item !== id);
    localStorage.setItem('styleverse_compare', JSON.stringify(updated));
    setComparedProducts(comparedProducts.filter((p) => p._id !== id));
    toast.success('Product removed from comparison.');
  };

  const handleAddToCart = async (product: Product) => {
    if (!isAuthenticated) {
      toast.error('Please log in to add items to cart.');
      return;
    }
    const variantId = product.variants && product.variants.length > 0 ? product.variants[0]._id : null;
    if (!variantId) {
      toast.error('Product variants not available.');
      return;
    }
    try {
      await addToCart(product._id, variantId, 1);
      toast.success('Product added to cart!');
    } catch {
      toast.error('Failed to add product to cart.');
    }
  };

  if (isLoading) {
    return <div className="max-w-7xl mx-auto px-4 py-16 bg-muted animate-pulse rounded-3xl h-96"></div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-display font-bold">Compare Products</h2>
        <p className="text-sm text-muted-foreground">Compare details, price values, and ratings side-by-side to choose the perfect fit.</p>
      </div>

      {comparedProducts.length === 0 ? (
        <div className="text-center py-20 border border-border rounded-3xl bg-card shadow-sm">
          <p className="text-muted-foreground text-sm mb-6">No products selected for comparison.</p>
          <Link to="/products" className="btn-primary rounded-xl text-sm px-6 py-2.5">
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto bg-card border border-border rounded-3xl shadow-sm">
          <table className="w-full text-left border-collapse text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                <th className="p-6 font-semibold w-1/4">Specification</th>
                {comparedProducts.map((p) => (
                  <th key={p._id} className="p-6 w-1/4 relative group min-w-[200px]">
                    <button
                      onClick={() => handleRemoveFromCompare(p._id)}
                      className="absolute top-4 right-4 text-red-500 hover:text-red-600 p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-all"
                      title="Remove from comparison"
                    >
                      <FiTrash2 size={15} />
                    </button>
                    <div className="flex flex-col gap-3 mt-4 items-center text-center">
                      <img src={p.thumbnail} alt={p.name} className="w-24 h-32 object-cover bg-muted rounded-xl border border-border" />
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] uppercase font-bold text-gold tracking-widest">{p.brand?.name || 'StyleVerse'}</span>
                        <h4 className="font-semibold text-sm line-clamp-1">{p.name}</h4>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Price row */}
              <tr className="border-b border-border hover:bg-muted/5 transition-all">
                <td className="p-6 font-semibold text-muted-foreground">Price</td>
                {comparedProducts.map((p) => (
                  <td key={p._id} className="p-6 font-bold text-base text-gold text-center">
                    {formatCurrency(p.basePrice)}
                    {p.baseDiscount > 0 && (
                      <div className="text-xs font-normal text-muted-foreground line-through mt-0.5">
                        {formatCurrency(p.baseMrp)}
                      </div>
                    )}
                  </td>
                ))}
              </tr>
              {/* Discount row */}
              <tr className="border-b border-border hover:bg-muted/5 transition-all">
                <td className="p-6 font-semibold text-muted-foreground">Discount</td>
                {comparedProducts.map((p) => (
                  <td key={p._id} className="p-6 text-center text-green-600 font-semibold">
                    {p.baseDiscount > 0 ? `${p.baseDiscount}% OFF` : 'No Discount'}
                  </td>
                ))}
              </tr>
              {/* Rating row */}
              <tr className="border-b border-border hover:bg-muted/5 transition-all">
                <td className="p-6 font-semibold text-muted-foreground">Customer Rating</td>
                {comparedProducts.map((p) => (
                  <td key={p._id} className="p-6 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <FiStar size={13} className="fill-gold text-gold" />
                      <span className="font-bold">{p.rating || 'N/A'}</span>
                      <span className="text-xs text-muted-foreground">({p.reviewCount} reviews)</span>
                    </div>
                  </td>
                ))}
              </tr>
              {/* Category row */}
              <tr className="border-b border-border hover:bg-muted/5 transition-all">
                <td className="p-6 font-semibold text-muted-foreground">Category</td>
                {comparedProducts.map((p) => (
                  <td key={p._id} className="p-6 text-center text-muted-foreground capitalize">
                    {p.category?.name || 'Fashion'}
                  </td>
                ))}
              </tr>
              {/* Description row */}
              <tr className="border-b border-border hover:bg-muted/5 transition-all">
                <td className="p-6 font-semibold text-muted-foreground">Short Description</td>
                {comparedProducts.map((p) => (
                  <td key={p._id} className="p-6 text-center text-xs text-muted-foreground leading-relaxed">
                    {p.shortDescription || 'No description provided.'}
                  </td>
                ))}
              </tr>
              {/* Add to Cart Actions row */}
              <tr className="hover:bg-muted/5 transition-all">
                <td className="p-6 font-semibold text-muted-foreground">Action</td>
                {comparedProducts.map((p) => (
                  <td key={p._id} className="p-6 text-center">
                    <button
                      onClick={() => handleAddToCart(p)}
                      className="inline-flex items-center gap-2 bg-gold hover:bg-gold/90 text-white font-semibold py-2 px-4 rounded-xl text-xs transition-all shadow-sm"
                    >
                      <FiShoppingBag size={12} /> Add to Cart
                    </button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ComparePage;
