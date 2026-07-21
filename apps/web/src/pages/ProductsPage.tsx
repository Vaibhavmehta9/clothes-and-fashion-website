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
  baseMrp: number;
  baseDiscount: number;
  rating: number;
  reviewCount: number;
}

interface Category {
  _id: string;
  name: string;
}

interface Brand {
  _id: string;
  name: string;
}

const ProductsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters from URL
  const categoryFilter = searchParams.get('category') || '';
  const brandFilter = searchParams.get('brand') || '';
  const sortFilter = searchParams.get('sort') || 'newest';
  const minPriceFilter = searchParams.get('minPrice') || '';
  const maxPriceFilter = searchParams.get('maxPrice') || '';

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [catRes, brandRes] = await Promise.all([
          api.get('/categories'),
          api.get('/brands'),
        ]);
        setCategories(catRes.data.data);
        setBrands(brandRes.data.data);
      } catch {
        toast.error('Failed to load filter metadata.');
      }
    };
    fetchFilters();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams(searchParams);
        const { data } = await api.get(`/products?${params.toString()}`);
        setProducts(data.data);
      } catch {
        toast.error('Failed to fetch products.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, [searchParams]);

  const updateFilters = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  const handlePriceChange = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const min = data.get('minPrice') as string;
    const max = data.get('maxPrice') as string;
    
    const newParams = new URLSearchParams(searchParams);
    if (min) newParams.set('minPrice', min); else newParams.delete('minPrice');
    if (max) newParams.set('maxPrice', max); else newParams.delete('maxPrice');
    setSearchParams(newParams);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col md:flex-row gap-8">
      {/* SIDEBAR FILTERS */}
      <aside className="w-full md:w-64 shrink-0 flex flex-col gap-8">
        {/* Category Filter */}
        <div className="flex flex-col gap-4 border-b border-border pb-6">
          <h3 className="font-display font-bold text-lg">Categories</h3>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => updateFilters('category', '')}
              className={`text-left text-sm py-1.5 transition-colors ${!categoryFilter ? 'text-gold font-semibold' : 'text-muted-foreground hover:text-foreground'}`}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat._id}
                onClick={() => updateFilters('category', cat._id)}
                className={`text-left text-sm py-1.5 transition-colors ${categoryFilter === cat._id ? 'text-gold font-semibold' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Brand Filter */}
        <div className="flex flex-col gap-4 border-b border-border pb-6">
          <h3 className="font-display font-bold text-lg">Brands</h3>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => updateFilters('brand', '')}
              className={`text-left text-sm py-1.5 transition-colors ${!brandFilter ? 'text-gold font-semibold' : 'text-muted-foreground hover:text-foreground'}`}
            >
              All Brands
            </button>
            {brands.map((b) => (
              <button
                key={b._id}
                onClick={() => updateFilters('brand', b._id)}
                className={`text-left text-sm py-1.5 transition-colors ${brandFilter === b._id ? 'text-gold font-semibold' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {b.name}
              </button>
            ))}
          </div>
        </div>

        {/* Price Filter */}
        <div className="flex flex-col gap-4">
          <h3 className="font-display font-bold text-lg">Price Range</h3>
          <form onSubmit={handlePriceChange} className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <input
                type="number"
                name="minPrice"
                placeholder="Min"
                defaultValue={minPriceFilter}
                className="w-full px-3 py-2 rounded-xl border border-input bg-muted/35 text-sm"
              />
              <span className="text-muted-foreground">-</span>
              <input
                type="number"
                name="maxPrice"
                placeholder="Max"
                defaultValue={maxPriceFilter}
                className="w-full px-3 py-2 rounded-xl border border-input bg-muted/35 text-sm"
              />
            </div>
            <button type="submit" className="btn-primary py-2 text-xs rounded-xl">
              Apply Price
            </button>
          </form>
        </div>
      </aside>

      {/* PRODUCTS DISPLAY */}
      <main className="flex-1 flex flex-col gap-8">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{products.length}</span> products
          </p>
          <div className="flex items-center gap-2 self-end">
            <span className="text-xs text-muted-foreground uppercase font-medium">Sort By:</span>
            <select
              value={sortFilter}
              onChange={(e) => updateFilters('sort', e.target.value)}
              className="bg-background border border-input rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gold"
            >
              <option value="newest">Newest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Top Rated</option>
              <option value="popular">Popularity</option>
            </select>
          </div>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, idx) => (
              <div key={idx} className="flex flex-col gap-4">
                <div className="aspect-[3/4] bg-muted animate-pulse rounded-2xl"></div>
                <div className="h-4 bg-muted animate-pulse rounded w-3/4"></div>
                <div className="h-4 bg-muted animate-pulse rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <span className="text-4xl mb-4">🔍</span>
            <h3 className="font-display font-bold text-xl mb-2">No Products Found</h3>
            <p className="text-muted-foreground text-sm max-w-sm">
              We couldn't find any products matching your criteria. Try adjusting your filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {products.map((prod) => (
              <div
                key={prod._id}
                onClick={() => navigate(`/products/${prod.slug}`)}
                className="product-card"
              >
                <div className="product-img-wrapper">
                  <img src={prod.thumbnail} alt={prod.name} />
                  {prod.baseDiscount > 0 && (
                    <span className="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                      {prod.baseDiscount}% OFF
                    </span>
                  )}
                </div>
                <div className="p-4 flex flex-col gap-1.5">
                  <h3 className="font-semibold text-charcoal-900 dark:text-white line-clamp-1 text-sm">
                    {prod.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base text-charcoal-950 dark:text-white">
                      {formatCurrency(prod.basePrice)}
                    </span>
                    {prod.baseMrp > prod.basePrice && (
                      <span className="text-xs text-muted-foreground line-through">
                        {formatCurrency(prod.baseMrp)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-yellow-500 font-medium">
                    ⭐ {prod.rating ? prod.rating.toFixed(1) : 'New'} 
                    <span className="text-muted-foreground">({prod.reviewCount})</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default ProductsPage;
