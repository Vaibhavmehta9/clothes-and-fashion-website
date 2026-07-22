import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiFilter, FiX, FiGrid, FiList, FiChevronDown, FiChevronUp,
  FiHeart, FiShoppingBag, FiSearch, FiStar, FiSliders, FiLoader
} from 'react-icons/fi';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Product {
  _id: string; name: string; slug: string; thumbnail: string;
  basePrice: number; baseMrp: number; baseDiscount: number;
  rating: number; reviewCount: number; isNewArrival?: boolean;
  brand?: { name: string };
}
interface Category { _id: string; name: string; }
interface Brand { _id: string; name: string; }
interface Pagination { total: number; page: number; limit: number; pages: number; }

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'popular', label: 'Most Popular' },
];

const PRICE_PRESETS = [
  { label: 'Under ₹500', min: '', max: '500' },
  { label: '₹500 – ₹1,000', min: '500', max: '1000' },
  { label: '₹1,000 – ₹3,000', min: '1000', max: '3000' },
  { label: '₹3,000 – ₹8,000', min: '3000', max: '8000' },
  { label: 'Above ₹8,000', min: '8000', max: '' },
];

const PAGE_SIZE = 48; // Show 48 per page (2 pages of API's 24-limit)
type ViewMode = 'grid' | 'list';

const ProductsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    categories: true, brands: true, price: true,
  });
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');

  const categoryFilter = searchParams.get('category') || '';
  const brandFilter = searchParams.get('brand') || '';
  const sortFilter = searchParams.get('sort') || 'newest';
  const minPriceFilter = searchParams.get('minPrice') || '';
  const maxPriceFilter = searchParams.get('maxPrice') || '';
  const isNewArrival = searchParams.get('isNewArrival') || '';
  const isOnSale = searchParams.get('isOnSale') || '';
  const isTrending = searchParams.get('isTrending') || '';

  // Track current internal page for load-more
  const currentPage = useRef(1);

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [catRes, brandRes] = await Promise.all([api.get('/categories'), api.get('/brands')]);
        setCategories(catRes.data.data);
        setBrands(brandRes.data.data);
      } catch { toast.error('Failed to load filters.'); }
    };
    fetchFilters();
  }, []);

const MOCK_FALLBACK_PRODUCTS: Product[] = [
  {
    _id: 'mock-w1',
    name: 'Zara Floral Print Midi Dress',
    slug: 'zara-floral-print-midi-dress',
    thumbnail: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=600&q=80',
    basePrice: 2990, baseMrp: 4990, baseDiscount: 40, rating: 4.8, reviewCount: 124,
    isNewArrival: true, brand: { name: 'Zara' }
  },
  {
    _id: 'mock-w2',
    name: "Levi's Women's High Rise Skinny Jeans",
    slug: 'levis-womens-high-rise-skinny-jeans',
    thumbnail: 'https://images.unsplash.com/photo-1582142307575-38ef4c995f7c?auto=format&fit=crop&w=600&q=80',
    basePrice: 3499, baseMrp: 4999, baseDiscount: 30, rating: 4.6, reviewCount: 89,
    brand: { name: "Levi's" }
  },
  {
    _id: 'mock-w3',
    name: 'H&M Satin Wrap Blouse',
    slug: 'hm-satin-wrap-blouse',
    thumbnail: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=600&q=80',
    basePrice: 1999, baseMrp: 2999, baseDiscount: 33, rating: 4.7, reviewCount: 56,
    brand: { name: 'H&M' }
  },
  {
    _id: 'mock-w4',
    name: 'ONLY Off-Shoulder Summer Top',
    slug: 'only-off-shoulder-summer-top',
    thumbnail: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80',
    basePrice: 1499, baseMrp: 2499, baseDiscount: 40, rating: 4.5, reviewCount: 42,
    brand: { name: 'ONLY' }
  },
  {
    _id: 'mock-m1',
    name: "Levi's 511 Slim Fit Men's Jeans",
    slug: 'levis-511-slim-fit-mens-jeans',
    thumbnail: 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=600&q=80',
    basePrice: 3299, baseMrp: 4499, baseDiscount: 27, rating: 4.9, reviewCount: 210,
    brand: { name: "Levi's" }
  },
  {
    _id: 'mock-m2',
    name: 'Nike Dri-FIT Men Training Hoodie',
    slug: 'nike-dri-fit-men-training-hoodie',
    thumbnail: 'https://images.unsplash.com/photo-1556821840-3a63f15732ce?auto=format&fit=crop&w=600&q=80',
    basePrice: 4295, baseMrp: 5495, baseDiscount: 22, rating: 4.8, reviewCount: 178,
    brand: { name: 'Nike' }
  },
  {
    _id: 'mock-k1',
    name: 'H&M Kids Cotton Graphic Hoodie',
    slug: 'hm-kids-cotton-graphic-hoodie',
    thumbnail: 'https://images.unsplash.com/photo-1503944168849-8bf86875bbd8?auto=format&fit=crop&w=600&q=80',
    basePrice: 1299, baseMrp: 1999, baseDiscount: 35, rating: 4.9, reviewCount: 64,
    brand: { name: 'H&M' }
  },
  {
    _id: 'mock-f1',
    name: 'Nike Air Max 270 Running Shoes',
    slug: 'nike-air-max-270-running-shoes',
    thumbnail: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80',
    basePrice: 11495, baseMrp: 13995, baseDiscount: 18, rating: 4.9, reviewCount: 340,
    brand: { name: 'Nike' }
  },
  {
    _id: 'mock-e1',
    name: 'BIBA Embroidered Anarkali Kurti Set',
    slug: 'biba-embroidered-anarkali-kurti-set',
    thumbnail: 'https://images.unsplash.com/photo-1617627143233-4df547d06a15?auto=format&fit=crop&w=600&q=80',
    basePrice: 3999, baseMrp: 5999, baseDiscount: 33, rating: 4.8, reviewCount: 95,
    brand: { name: 'BIBA' }
  }
];

const filterFallbackProducts = (term: string) => {
  const cat = term.trim().toLowerCase();
  if (!cat) return MOCK_FALLBACK_PRODUCTS;

  if (cat === 'women' || cat.includes('women') || cat === 'ethnic-wear') {
    return MOCK_FALLBACK_PRODUCTS.filter(p => p._id.startsWith('mock-w') || p._id.startsWith('mock-e'));
  }
  if (cat === 'men' || (cat.includes('men') && !cat.includes('women'))) {
    return MOCK_FALLBACK_PRODUCTS.filter(p => p._id.startsWith('mock-m'));
  }
  if (cat.includes('kid')) {
    return MOCK_FALLBACK_PRODUCTS.filter(p => p._id.startsWith('mock-k'));
  }
  if (cat.includes('footwear') || cat.includes('sneaker') || cat.includes('shoe')) {
    return MOCK_FALLBACK_PRODUCTS.filter(p => p._id.startsWith('mock-f'));
  }
  return MOCK_FALLBACK_PRODUCTS.filter(p => 
    p.name.toLowerCase().includes(cat) || p.slug.includes(cat)
  );
};

  // Reset & fetch page 1 whenever filters change
  useEffect(() => {
    currentPage.current = 1;
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams(searchParams);
        params.set('limit', String(PAGE_SIZE));
        params.set('page', '1');
        const { data } = await api.get(`/products?${params.toString()}`);
        if (data.data && data.data.length > 0) {
          setProducts(data.data);
          setPagination(data.pagination);
        } else {
          const filtered = filterFallbackProducts(categoryFilter || searchQuery || '');
          setProducts(filtered);
          setPagination({ total: filtered.length, page: 1, limit: PAGE_SIZE, pages: 1 });
        }
      } catch {
        const filtered = filterFallbackProducts(categoryFilter || searchQuery || '');
        setProducts(filtered);
        setPagination({ total: filtered.length, page: 1, limit: PAGE_SIZE, pages: 1 });
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, [searchParams]);

  const loadMore = async () => {
    if (isLoadingMore) return;
    const nextPage = currentPage.current + 1;
    setIsLoadingMore(true);
    try {
      const params = new URLSearchParams(searchParams);
      params.set('limit', String(PAGE_SIZE));
      params.set('page', String(nextPage));
      const { data } = await api.get(`/products?${params.toString()}`);
      setProducts(prev => [...prev, ...data.data]);
      setPagination(data.pagination);
      currentPage.current = nextPage;
    } catch { toast.error('Failed to load more products.'); }
    finally { setIsLoadingMore(false); }
  };

  const updateFilters = useCallback((key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) newParams.set(key, value); else newParams.delete(key);
    setSearchParams(newParams);
  }, [searchParams, setSearchParams]);

  const clearAllFilters = () => {
    setSearchParams(new URLSearchParams({ sort: 'newest' }));
    setSearchQuery('');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters('q', searchQuery);
  };

  const handlePricePreset = (min: string, max: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (min) newParams.set('minPrice', min); else newParams.delete('minPrice');
    if (max) newParams.set('maxPrice', max); else newParams.delete('maxPrice');
    setSearchParams(newParams);
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleWishlist = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setWishlist(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const activeFilterCount = [categoryFilter, brandFilter, minPriceFilter, maxPriceFilter, isNewArrival, isOnSale, isTrending].filter(Boolean).length;

  const activeFilters: { key: string; label: string; value: string }[] = [];
  if (categoryFilter) {
    const cat = categories.find(c => c._id === categoryFilter || c.slug === categoryFilter);
    if (cat) activeFilters.push({ key: 'category', label: 'Category', value: cat.name });
    else activeFilters.push({ key: 'category', label: 'Category', value: categoryFilter.charAt(0).toUpperCase() + categoryFilter.slice(1) });
  }
  if (brandFilter) {
    const br = brands.find(b => b._id === brandFilter);
    if (br) activeFilters.push({ key: 'brand', label: 'Brand', value: br.name });
  }
  if (minPriceFilter || maxPriceFilter) {
    activeFilters.push({ key: 'price', label: 'Price', value: `₹${minPriceFilter || '0'} – ₹${maxPriceFilter || '∞'}` });
  }
  if (isNewArrival) activeFilters.push({ key: 'isNewArrival', label: 'New Arrivals', value: '' });
  if (isOnSale) activeFilters.push({ key: 'isOnSale', label: 'On Sale', value: '' });
  if (isTrending) activeFilters.push({ key: 'isTrending', label: 'Trending', value: '' });

  const removeFilter = (key: string) => {
    if (key === 'price') {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('minPrice'); newParams.delete('maxPrice');
      setSearchParams(newParams);
    } else {
      updateFilters(key, '');
    }
  };

  const hasMore = pagination ? pagination.page < pagination.pages : false;
  const totalCount = pagination?.total ?? products.length;

  const FilterSidebar = () => (
    <div className="flex flex-col gap-1">
      <form onSubmit={handleSearch} className="relative mb-4">
        <input
          type="text" placeholder="Search products..." value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2.5 pl-10 rounded-xl border border-border bg-secondary/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
        />
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
      </form>

      <div className="flex flex-col gap-2 mb-4 pb-4 border-b border-border">
        <h3 className="font-display font-bold text-sm uppercase tracking-wider text-muted-foreground mb-1">Quick Filters</h3>
        {[
          { label: '🆕 New Arrivals', key: 'isNewArrival', val: 'true', active: !!isNewArrival },
          { label: '🔥 Trending Now', key: 'isTrending', val: 'true', active: !!isTrending },
          { label: '🏷️ On Sale', key: 'isOnSale', val: 'true', active: !!isOnSale },
        ].map(f => (
          <button key={f.key} onClick={() => updateFilters(f.key, f.active ? '' : f.val)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${f.active ? 'bg-primary/10 text-primary border border-primary/30' : 'text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Categories */}
      <div className="mb-1">
        <button onClick={() => toggleSection('categories')} className="flex items-center justify-between w-full py-3 font-display font-bold text-base">
          Categories
          {expandedSections.categories ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
        </button>
        <AnimatePresence>
          {expandedSections.categories && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="flex flex-col gap-1 pb-4">
                <button onClick={() => updateFilters('category', '')} className={`text-left px-2 py-1.5 rounded-lg text-sm transition-all ${!categoryFilter ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>All Categories</button>
                {categories.map(cat => (
                  <button key={cat._id} onClick={() => updateFilters('category', cat.slug || cat._id)} className={`text-left px-2 py-1.5 rounded-lg text-sm transition-all ${categoryFilter === cat._id || categoryFilter === cat.slug ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>{cat.name}</button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="border-t border-border" />

      {/* Brands */}
      <div className="mb-1">
        <button onClick={() => toggleSection('brands')} className="flex items-center justify-between w-full py-3 font-display font-bold text-base">
          Brands
          {expandedSections.brands ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
        </button>
        <AnimatePresence>
          {expandedSections.brands && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="flex flex-col gap-1 pb-4">
                <button onClick={() => updateFilters('brand', '')} className={`text-left px-2 py-1.5 rounded-lg text-sm transition-all ${!brandFilter ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>All Brands</button>
                {brands.map(b => (
                  <button key={b._id} onClick={() => updateFilters('brand', b._id)} className={`text-left px-2 py-1.5 rounded-lg text-sm transition-all ${brandFilter === b._id ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>{b.name}</button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="border-t border-border" />

      {/* Price */}
      <div>
        <button onClick={() => toggleSection('price')} className="flex items-center justify-between w-full py-3 font-display font-bold text-base">
          Price Range
          {expandedSections.price ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
        </button>
        <AnimatePresence>
          {expandedSections.price && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="flex flex-col gap-1.5 pb-4">
                {PRICE_PRESETS.map(preset => {
                  const isActive = minPriceFilter === preset.min && maxPriceFilter === preset.max;
                  return (
                    <button key={preset.label} onClick={() => handlePricePreset(preset.min, preset.max)}
                      className={`text-left px-2 py-1.5 rounded-lg text-sm transition-all ${isActive ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Filter Drawer */}
      <AnimatePresence>
        {mobileFiltersOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileFiltersOpen(false)} />
            <motion.aside initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-80 bg-card border-r border-border z-50 lg:hidden overflow-y-auto">
              <div className="sticky top-0 bg-card border-b border-border flex items-center justify-between px-6 py-4 z-10">
                <h2 className="font-display font-bold text-lg flex items-center gap-2"><FiSliders size={18} className="text-primary" /> Filters</h2>
                <button onClick={() => setMobileFiltersOpen(false)} className="p-2 rounded-full hover:bg-muted transition-colors"><FiX size={20} /></button>
              </div>
              <div className="px-6 py-4">
                <FilterSidebar />
                {activeFilterCount > 0 && <button onClick={clearAllFilters} className="w-full mt-4 btn-secondary py-2.5 rounded-xl text-sm">Clear All Filters</button>}
                <button onClick={() => setMobileFiltersOpen(false)} className="w-full mt-2 btn-primary py-2.5 rounded-xl text-sm">View {totalCount} Results</button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">StyleVerse Collection</p>
          <h1 className="font-display font-bold text-3xl md:text-4xl">All Products</h1>
        </div>

        <div className="flex gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-bold text-lg flex items-center gap-2"><FiSliders size={16} className="text-primary" /> Filters</h2>
                {activeFilterCount > 0 && <button onClick={clearAllFilters} className="text-xs text-primary underline underline-offset-2 font-medium">Clear all ({activeFilterCount})</button>}
              </div>
              <FilterSidebar />
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-3">
                <button onClick={() => setMobileFiltersOpen(true)} className="lg:hidden flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-card text-sm font-medium hover:bg-muted transition-colors">
                  <FiFilter size={16} className="text-primary" />
                  Filters {activeFilterCount > 0 && <span className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">{activeFilterCount}</span>}
                </button>
                <p className="text-sm text-muted-foreground">
                  Showing <span className="font-semibold text-foreground">{products.length}</span>
                  {totalCount > products.length && <span> of <span className="font-semibold text-foreground">{totalCount}</span></span>} products
                </p>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-auto">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground hidden sm:block">Sort:</span>
                  <select value={sortFilter} onChange={(e) => updateFilters('sort', e.target.value)}
                    className="bg-card border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer">
                    {SORT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
                <div className="hidden sm:flex items-center border border-border rounded-xl overflow-hidden">
                  <button onClick={() => setViewMode('grid')} className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground'}`} title="Grid view"><FiGrid size={16} /></button>
                  <button onClick={() => setViewMode('list')} className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground'}`} title="List view"><FiList size={16} /></button>
                </div>
              </div>
            </div>

            {/* Active Filter Chips */}
            {activeFilters.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {activeFilters.map(f => (
                  <span key={f.key} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-xs font-semibold rounded-full border border-primary/20">
                    {f.value ? `${f.label}: ${f.value}` : f.label}
                    <button onClick={() => removeFilter(f.key)} className="hover:opacity-70 transition-opacity"><FiX size={12} /></button>
                  </span>
                ))}
                <button onClick={clearAllFilters} className="inline-flex items-center gap-1 px-3 py-1.5 bg-muted text-muted-foreground text-xs font-semibold rounded-full hover:bg-muted/80 transition-colors">
                  Clear all <FiX size={12} />
                </button>
              </div>
            )}

            {/* Products */}
            {isLoading ? (
              <div className={viewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-5' : 'flex flex-col gap-4'}>
                {[...Array(12)].map((_, idx) => (
                  <div key={idx} className={`${viewMode === 'list' ? 'flex gap-4' : 'flex flex-col gap-3'}`}>
                    <div className={`bg-muted animate-pulse rounded-2xl ${viewMode === 'list' ? 'w-32 h-32 shrink-0' : 'aspect-[3/4]'}`} />
                    <div className="flex flex-col gap-2 flex-1">
                      <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                      <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-32 text-center">
                <div className="text-6xl mb-6">🔍</div>
                <h3 className="font-display font-bold text-2xl mb-2">No Products Found</h3>
                <p className="text-muted-foreground text-sm max-w-sm mb-6">We couldn't find any products matching your criteria. Try adjusting your filters.</p>
                <button onClick={clearAllFilters} className="btn-primary rounded-full px-6">Clear Filters</button>
              </motion.div>
            ) : viewMode === 'grid' ? (
              <>
                <motion.div layout className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-5">
                  {products.map((prod, i) => (
                    <motion.div key={prod._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.03, 0.5) }}
                      onClick={() => navigate(`/products/${prod.slug}`)}
                      onMouseEnter={() => setHoveredProduct(prod._id)}
                      onMouseLeave={() => setHoveredProduct(null)}
                      className="group relative bg-card rounded-2xl overflow-hidden border border-border hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                      <div className="relative overflow-hidden aspect-[3/4] bg-secondary/50">
                        <img src={prod.thumbnail} alt={prod.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&q=70'; }} />
                        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                          {prod.baseDiscount > 0 && <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{prod.baseDiscount}% OFF</span>}
                          {prod.isNewArrival && <span className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">NEW</span>}
                        </div>
                        <AnimatePresence>
                          {hoveredProduct === prod._id && (
                            <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }} transition={{ duration: 0.2 }}
                              className="absolute bottom-0 left-0 right-0 flex gap-2 p-3 bg-gradient-to-t from-black/60 to-transparent"
                              onClick={e => e.stopPropagation()}>
                              <button onClick={() => navigate(`/products/${prod.slug}`)}
                                className="flex-1 flex items-center justify-center gap-1.5 bg-white text-foreground text-xs font-semibold py-2 rounded-xl hover:bg-primary hover:text-primary-foreground transition-colors">
                                <FiShoppingBag size={13} /> Add to Cart
                              </button>
                              <button onClick={e => toggleWishlist(prod._id, e)}
                                className={`p-2 rounded-xl transition-colors ${wishlist.has(prod._id) ? 'bg-primary text-primary-foreground' : 'bg-white/90 text-foreground hover:bg-primary hover:text-primary-foreground'}`}>
                                <FiHeart size={14} className={wishlist.has(prod._id) ? 'fill-current' : ''} />
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      <div className="p-4 flex flex-col gap-1">
                        {prod.brand && <span className="text-[10px] uppercase tracking-widest text-primary font-bold">{prod.brand.name}</span>}
                        <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">{prod.name}</h3>
                        <div className="flex items-center gap-1 text-xs text-yellow-500 mt-0.5">
                          <FiStar size={11} className="fill-yellow-500" />
                          <span className="font-medium">{prod.rating ? prod.rating.toFixed(1) : '–'}</span>
                          <span className="text-muted-foreground">({prod.reviewCount})</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-bold text-base">{formatCurrency(prod.basePrice)}</span>
                          {prod.baseMrp > prod.basePrice && <span className="text-xs text-muted-foreground line-through">{formatCurrency(prod.baseMrp)}</span>}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Load More */}
                {hasMore && (
                  <div className="mt-10 flex flex-col items-center gap-3">
                    <p className="text-sm text-muted-foreground">
                      Showing <span className="font-semibold text-foreground">{products.length}</span> of <span className="font-semibold text-foreground">{totalCount}</span> products
                    </p>
                    <div className="w-full max-w-xs bg-muted rounded-full h-1.5">
                      <div className="bg-primary h-1.5 rounded-full transition-all duration-500" style={{ width: `${(products.length / totalCount) * 100}%` }} />
                    </div>
                    <button onClick={loadMore} disabled={isLoadingMore}
                      className="mt-2 btn-primary px-10 py-3 rounded-full flex items-center gap-2 disabled:opacity-70">
                      {isLoadingMore ? <><FiLoader size={16} className="animate-spin" /> Loading...</> : `Load More (${totalCount - products.length} remaining)`}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <>
                <motion.div layout className="flex flex-col gap-4">
                  {products.map((prod, i) => (
                    <motion.div key={prod._id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i * 0.03, 0.5) }}
                      onClick={() => navigate(`/products/${prod.slug}`)}
                      className="group flex gap-5 bg-card rounded-2xl border border-border p-4 hover:shadow-card-hover transition-all duration-300 cursor-pointer">
                      <div className="relative w-28 sm:w-36 h-36 sm:h-44 shrink-0 rounded-xl overflow-hidden bg-secondary/50">
                        <img src={prod.thumbnail} alt={prod.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&q=70'; }} />
                        {prod.baseDiscount > 0 && <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{prod.baseDiscount}% OFF</span>}
                      </div>
                      <div className="flex-1 flex flex-col justify-between py-1">
                        <div>
                          {prod.brand && <span className="text-[10px] uppercase tracking-widest text-primary font-bold">{prod.brand.name}</span>}
                          <h3 className="font-semibold text-base sm:text-lg mt-1 group-hover:text-primary transition-colors line-clamp-2">{prod.name}</h3>
                          <div className="flex items-center gap-1 text-xs text-yellow-500 mt-2">
                            <FiStar size={12} className="fill-yellow-500" />
                            <span className="font-medium">{prod.rating ? prod.rating.toFixed(1) : '–'}</span>
                            <span className="text-muted-foreground">({prod.reviewCount} reviews)</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-xl">{formatCurrency(prod.basePrice)}</span>
                            {prod.baseMrp > prod.basePrice && <span className="text-sm text-muted-foreground line-through">{formatCurrency(prod.baseMrp)}</span>}
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={e => toggleWishlist(prod._id, e)}
                              className={`p-2 rounded-xl border transition-colors ${wishlist.has(prod._id) ? 'border-primary text-primary bg-primary/10' : 'border-border text-muted-foreground hover:border-primary hover:text-primary'}`}>
                              <FiHeart size={16} className={wishlist.has(prod._id) ? 'fill-current' : ''} />
                            </button>
                            <button onClick={e => { e.stopPropagation(); navigate(`/products/${prod.slug}`); }}
                              className="btn-primary py-2 px-4 text-sm rounded-xl flex items-center gap-1.5">
                              <FiShoppingBag size={14} /> Shop Now
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Load More (List view) */}
                {hasMore && (
                  <div className="mt-10 flex flex-col items-center gap-3">
                    <p className="text-sm text-muted-foreground">
                      Showing <span className="font-semibold text-foreground">{products.length}</span> of <span className="font-semibold text-foreground">{totalCount}</span> products
                    </p>
                    <div className="w-full max-w-xs bg-muted rounded-full h-1.5">
                      <div className="bg-primary h-1.5 rounded-full transition-all duration-500" style={{ width: `${(products.length / totalCount) * 100}%` }} />
                    </div>
                    <button onClick={loadMore} disabled={isLoadingMore}
                      className="mt-2 btn-primary px-10 py-3 rounded-full flex items-center gap-2 disabled:opacity-70">
                      {isLoadingMore ? <><FiLoader size={16} className="animate-spin" /> Loading...</> : `Load More (${totalCount - products.length} remaining)`}
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;
