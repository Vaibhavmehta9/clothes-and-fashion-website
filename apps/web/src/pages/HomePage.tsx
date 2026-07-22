import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiArrowRight, FiShield, FiTag, FiTruck, FiRefreshCw, FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

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

interface Banner {
  title: string;
  subtitle: string;
  image: string;
  link: string;
  buttonText: string;
}

interface Category {
  _id: string;
  name: string;
  slug: string;
  image: string;
}

interface Brand {
  _id: string;
  name: string;
  slug: string;
  logo: string;
}

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const DEFAULT_BANNERS: Banner[] = [
  {
    title: 'AJIO LUXE: THE DESIGNER EDIT',
    subtitle: 'Premium coordinates, heritage handlooms and luxury layers. Elevate your wardrobe.',
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1600&q=80',
    link: '/products?isNewArrival=true',
    buttonText: 'Explore Collection'
  },
  {
    title: 'UP TO 60% OFF: SNEAKER FESTIVAL',
    subtitle: 'High-performance kicks and lifestyle drops. Grab Nike, Adidas & Puma.',
    image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=1600&q=80',
    link: '/products?category=footwear&isOnSale=true',
    buttonText: 'Claim Offer'
  },
  {
    title: 'ETHNIC ELEGANCE: FESTIVE SPECIAL',
    subtitle: 'Exquisite silk coordinates, lehengas and hand-woven heritage outfits.',
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1600&q=80',
    link: '/products?category=ethnic-wear',
    buttonText: 'Discover Couture'
  }
];

const DEFAULT_CATEGORIES = [
  { _id: 'cat1', name: 'Menswear', slug: 'menswear', image: 'https://images.unsplash.com/photo-1488161628813-04466f872be2?auto=format&fit=crop&w=600&q=80' },
  { _id: 'cat2', name: 'Womenswear', slug: 'womenswear', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80' },
  { _id: 'cat3', name: 'Footwear', slug: 'footwear', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80' },
  { _id: 'cat4', name: 'Accessories', slug: 'accessories', image: 'https://images.unsplash.com/photo-1509319117193-57bab727e09d?auto=format&fit=crop&w=600&q=80' },
  { _id: 'cat5', name: 'Ethnic Wear', slug: 'ethnic-wear', image: 'https://images.unsplash.com/photo-1596783074918-c84cb06531ca?auto=format&fit=crop&w=600&q=80' }
];

const HomePage: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [trending, setTrending] = useState<Product[]>([]);
  const [showPopup, setShowPopup] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const dealsScrollRef = React.useRef<HTMLDivElement>(null);

  const scrollDeals = (direction: 'left' | 'right') => {
    if (dealsScrollRef.current) {
      const { scrollLeft, clientWidth } = dealsScrollRef.current;
      const scrollAmount = direction === 'left' ? -clientWidth / 2 : clientWidth / 2;
      dealsScrollRef.current.scrollTo({
        left: scrollLeft + scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  useEffect(() => {
    // Show offer popup 2.5 seconds after page load if they haven't seen it before
    const hasSeenPopup = localStorage.getItem('sv_has_seen_promo_popup');
    if (!hasSeenPopup) {
      const timer = setTimeout(() => {
        setShowPopup(true);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClosePopup = () => {
    setShowPopup(false);
    localStorage.setItem('sv_has_seen_promo_popup', 'true');
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput) return;
    toast.success('🎉 Subscription successful! Code WELCOME20 has been copied to your clipboard.');
    navigator.clipboard.writeText('WELCOME20');
    handleClosePopup();
  };

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const [cmsRes, prodRes] = await Promise.all([
          api.get('/homepage'),
          api.get('/products/homepage'),
        ]);
        
        const bannersData = cmsRes.data?.data?.banners || [];
        setBanners(bannersData.length > 0 ? bannersData : DEFAULT_BANNERS);

        const categoriesData = cmsRes.data?.data?.featuredCategories || [];
        setCategories(categoriesData.length > 0 ? categoriesData : DEFAULT_CATEGORIES);

        setBrands(cmsRes.data?.data?.featuredBrands || []);
        setNewArrivals(prodRes.data?.data?.newArrivals || []);
        setTrending(prodRes.data?.data?.trending || []);
      } catch (err) {
        // Fall back to default local data if backend fetch fails
        setBanners(DEFAULT_BANNERS);
        setCategories(DEFAULT_CATEGORIES);
        toast.error('Failed to load live content. Displaying curated collections.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchHomeData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-gold/20 border-t-gold rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-16 pb-24 relative">
      {/* 👑 EXCLUSIVE OFFER POPUP MODAL */}
      <AnimatePresence>
        {showPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="bg-charcoal-950 text-white rounded-3xl overflow-hidden shadow-2xl max-w-lg w-full relative border border-gold/20 flex flex-col"
            >
              <button
                onClick={handleClosePopup}
                className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all"
              >
                <FiX size={18} />
              </button>
              <div className="relative h-48">
                <img
                  src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=800&q=80"
                  alt="Promo Model"
                  className="w-full h-full object-cover opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950 to-transparent"></div>
              </div>
              <div className="p-8 text-center space-y-6 flex flex-col items-center">
                <span className="bg-gold/15 text-gold border border-gold/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                  Exclusive Invitation
                </span>
                <div className="space-y-2">
                  <h3 className="text-3xl font-display font-black tracking-tight">GET 20% OFF</h3>
                  <p className="text-charcoal-300 text-sm max-w-sm">
                    Subscribe to our premium insider journal and unlock 20% off your first luxury apparel purchase.
                  </p>
                </div>
                <form onSubmit={handleSubscribe} className="w-full max-w-xs space-y-3">
                  <input
                    type="email"
                    required
                    placeholder="Enter your email address"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-sm text-center outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all"
                  />
                  <button
                    type="submit"
                    className="w-full bg-gold hover:bg-gold-light text-charcoal-950 font-semibold py-3 rounded-xl transition-all hover:scale-105"
                  >
                    Unseal Code: WELCOME20
                  </button>
                </form>
                <button
                  onClick={handleClosePopup}
                  className="text-xs text-charcoal-400 hover:text-white underline transition-colors"
                >
                  No thanks, I prefer paying full price
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HERO SECTION - NYKAA STYLE PINK BANNER */}
      <section className="relative w-full overflow-hidden mt-1 bg-gradient-to-r from-pink-100 via-pink-200 to-pink-100">
        <Link to="/products?isOnSale=true" className="block relative w-full h-[300px] md:h-[450px] bg-gradient-to-r from-pink-400 via-pink-500 to-fuchsia-600 flex items-center justify-center overflow-hidden group">
          {/* Decorative Background Elements */}
          <div className="absolute inset-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1557672172-298e090bd0f1?auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center mix-blend-overlay"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between w-full max-w-7xl px-4 md:px-12 h-full">
            {/* Text Side */}
            <div className="flex flex-col items-center md:items-start text-white pt-8 md:pt-0 transform transition-transform group-hover:scale-105">
              <span className="text-xl md:text-3xl font-black italic tracking-tighter mb-2">STYLEVERSE</span>
              <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-pink-100 drop-shadow-lg leading-none">
                HOT PINK <span className="text-white">SALE</span>
              </h1>
            </div>
            
            {/* Discount Badge */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-blue-300 to-cyan-400 border-4 border-white flex flex-col items-center justify-center shadow-2xl z-20 transform -rotate-12 group-hover:rotate-0 transition-transform duration-500">
              <span className="text-white font-black text-sm md:text-xl leading-none">UP TO</span>
              <span className="text-white font-black text-3xl md:text-5xl leading-none">80%</span>
              <span className="text-white font-black text-sm md:text-xl leading-none">OFF*</span>
            </div>
            
            {/* Models Image (Using an Unsplash image of fashion models) */}
            <div className="h-[200px] md:h-full flex items-end">
              <img 
                src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80" 
                alt="Models" 
                className="h-full object-cover rounded-t-full border-4 border-b-0 border-white/20 shadow-2xl z-10 hidden md:block w-[350px]"
              />
            </div>
          </div>
        </Link>
        
        {/* POWERED BY BAR */}
        <div className="w-full bg-pink-50 py-3 border-y border-pink-200">
          <div className="max-w-7xl mx-auto px-4 flex items-center justify-center gap-4 md:gap-12 flex-wrap text-sm md:text-base font-bold text-gray-800">
            <span className="text-gray-500">Powered By :</span>
            <span className="text-red-700 italic tracking-tighter">FLYING MACHINE</span>
            <span className="border-l border-gray-300 h-6"></span>
            <span className="tracking-widest">THE HOUSE OF RARE</span>
            <span className="border-l border-gray-300 h-6"></span>
            <span className="text-black font-serif text-lg">Inc.5</span>
            <span className="border-l border-gray-300 h-6 hidden md:block"></span>
            <span className="text-gray-500 hidden md:inline">In Association with:</span>
            <span className="font-script text-xl hidden md:inline">Pepe Jeans</span>
            <span className="border-l border-gray-300 h-6 hidden md:block"></span>
            <span className="text-blue-600 font-black tracking-tighter text-lg hidden md:inline">CAHOOT</span>
          </div>
        </div>
      </section>

      {/* CIRCULAR CATEGORIES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mt-6">
        <div className="flex gap-4 md:gap-8 overflow-x-auto no-scrollbar py-4 px-2 snap-x snap-mandatory justify-start md:justify-center items-start">
          {[
            { name: 'Westernwear', image: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=200', link: '/products?category=women' },
            { name: 'Indianwear', image: 'https://images.unsplash.com/photo-1617627143233-4df547d06a15?w=200', link: '/products?category=ethnic-wear' },
            { name: 'Men', image: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?w=200', link: '/products?category=men' },
            { name: 'Kids', image: 'https://images.unsplash.com/photo-1503944168849-8bf86875bbd8?w=200', link: '/products?category=kids' },
            { name: 'Footwear', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200', link: '/products?category=footwear' },
            { name: 'Lingerie', image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=200', link: '/products?category=women' },
            { name: 'Bags', image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=200', link: '/products?category=accessories' },
            { name: 'Sportswear', image: 'https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=200', link: '/products?category=sports-wear' },
            { name: 'Jewellery', image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=200', link: '/products?category=accessories' },
            { name: 'Sneakers', image: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=200', link: '/products?category=footwear' },
          ].map((cat, idx) => (
            <Link 
              to={cat.link} 
              key={idx} 
              className="flex flex-col items-center gap-3 shrink-0 snap-center group w-20 md:w-24"
            >
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full p-1 bg-gradient-to-br from-pink-300 to-fuchsia-200 group-hover:from-pink-400 group-hover:to-fuchsia-400 transition-colors shadow-sm">
                <div className="w-full h-full rounded-full overflow-hidden bg-white">
                  <img 
                    src={cat.image} 
                    alt={cat.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                  />
                </div>
              </div>
              <span className="text-[13px] font-bold text-gray-800 text-center leading-tight px-2 bg-blue-50/50 rounded-full w-full">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ⚡ DEALS TOO HOT TO MISS - CAROUSEL */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative">
        <div className="flex items-end justify-between mb-8">
          <div className="flex flex-col gap-2">
            <span className="text-gold font-semibold uppercase tracking-widest text-xs">Unbeatable Offers</span>
            <h2 className="text-3xl font-display font-bold">Deals Too Hot To Miss</h2>
            <div className="gold-line"></div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => scrollDeals('left')}
              className="p-3 rounded-full border border-gold/20 hover:border-gold bg-charcoal-950 text-gold hover:bg-gold hover:text-charcoal-950 transition-all shadow"
              aria-label="Scroll Left"
            >
              <FiChevronLeft size={20} />
            </button>
            <button
              onClick={() => scrollDeals('right')}
              className="p-3 rounded-full border border-gold/20 hover:border-gold bg-charcoal-950 text-gold hover:bg-gold hover:text-charcoal-950 transition-all shadow"
              aria-label="Scroll Right"
            >
              <FiChevronRight size={20} />
            </button>
          </div>
        </div>

        <div
          ref={dealsScrollRef}
          className="flex gap-6 overflow-x-auto no-scrollbar scroll-smooth pb-4 select-none snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {[
            {
              tag: 'UNDER',
              title: '₹999',
              subtitle: 'STORE',
              link: '/products?maxPrice=999',
              bg: 'bg-gradient-to-br from-gold-950 via-gold-900 to-charcoal-950 text-white',
              badge: 'Deal Price'
            },
            {
              tag: 'FLAT',
              title: '50% OFF',
              subtitle: 'CLEARANCE SALE',
              link: '/products?isOnSale=true',
              bg: 'bg-gradient-to-br from-charcoal-950 via-charcoal-900 to-gold-950 text-white',
              image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=400&q=80',
              badge: 'Clearance'
            },
            {
              tag: 'EXTRA',
              title: '15% OFF',
              subtitle: 'ON EVERYTHING',
              link: '/products?isOnSale=true',
              bg: 'bg-gradient-to-br from-gold-900 via-gold-700 to-charcoal-900 text-white',
              badge: 'Sitewide'
            },
            {
              tag: 'TRENDING',
              title: 'BRAND',
              subtitle: 'OF THE DAY',
              link: '/products?sort=popular',
              bg: 'bg-gradient-to-br from-charcoal-900 via-charcoal-950 to-gold-950 text-white',
              badge: 'Popular'
            },
            {
              tag: 'UP TO',
              title: '60% OFF',
              subtitle: 'ON NEW STYLES',
              link: '/products?isNewArrival=true&isOnSale=true',
              bg: 'bg-gradient-to-br from-gold-800 via-gold-600 to-charcoal-950 text-white',
              badge: 'Seasonal'
            },
            {
              tag: 'EXCLUSIVE',
              title: 'LUXE',
              subtitle: 'STYLEVERSE COUTURE',
              link: '/products?isFeatured=true',
              bg: 'bg-gradient-to-br from-charcoal-950 via-gold-950 to-charcoal-900 text-white',
              image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=400&q=80',
              badge: 'Couture'
            }
          ].map((deal, idx) => (
            <div
              key={idx}
              onClick={() => navigate(deal.link)}
              className={`min-w-[280px] md:min-w-[320px] aspect-square rounded-3xl overflow-hidden cursor-pointer shadow-card hover:shadow-card-hover transition-all duration-300 transform hover:-translate-y-2 snap-start relative flex flex-col justify-between p-8 border border-gold/15 group ${deal.bg}`}
            >
              {deal.image && (
                <>
                  <img
                    src={deal.image}
                    alt={deal.title}
                    className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:scale-110 transition-transform duration-700 animate-fade-in"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent z-0"></div>
                </>
              )}
              <div className="relative z-10 flex justify-between items-start">
                <span className="bg-gold/15 text-gold border border-gold/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                  {deal.badge}
                </span>
                <span className="text-white/40 group-hover:text-gold transition-colors">
                  <FiArrowRight size={22} />
                </span>
              </div>
              
              <div className="relative z-10 flex flex-col">
                <span className="text-gold font-display font-black tracking-widest text-sm uppercase">
                  {deal.tag}
                </span>
                <h3 className="text-4xl md:text-5xl font-display font-black tracking-tight leading-none my-1">
                  {deal.title}
                </h3>
                <p className="text-charcoal-200 text-xs tracking-wider uppercase font-semibold">
                  {deal.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* NEW ARRIVALS - NOW SHOWS 8 PREMIUM ITEMS */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={staggerContainer}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full"
      >
        <div className="flex items-end justify-between mb-8">
          <motion.div variants={fadeInUp} className="flex flex-col gap-2">
            <span className="text-gold font-semibold uppercase tracking-widest text-xs">Fresh Trends</span>
            <h2 className="text-3xl font-display font-bold">New Arrivals</h2>
            <div className="gold-line"></div>
          </motion.div>
          <motion.div variants={fadeInUp}>
            <Link to="/products?isNewArrival=true" className="text-gold flex items-center gap-1 hover:underline text-sm font-semibold">
              View All <FiArrowRight />
            </Link>
          </motion.div>
        </div>
        <motion.div variants={staggerContainer} className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {newArrivals.slice(0, 8).map((prod) => (
            <motion.div
              key={prod._id}
              variants={fadeInUp}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              onClick={() => navigate(`/products/${prod.slug}`)}
              className="product-card cursor-pointer group"
            >
              <div className="product-img-wrapper overflow-hidden relative">
                <img
                  src={prod.thumbnail}
                  alt={prod.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {prod.baseDiscount > 0 && (
                  <span className="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                    {prod.baseDiscount}% OFF
                  </span>
                )}
              </div>
              <div className="p-4 flex flex-col gap-1.5">
                <h3 className="font-semibold text-charcoal-900 dark:text-white line-clamp-1 text-sm group-hover:text-gold transition-colors">
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
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      {/* BRAND VALUES PROMISE */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={staggerContainer}
        className="bg-muted py-12"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
          <motion.div variants={fadeInUp} whileHover={{ scale: 1.05 }} className="flex flex-col items-center gap-2 cursor-default">
            <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center text-gold mb-2">
              <FiTruck size={24} />
            </div>
            <h4 className="font-semibold text-charcoal-950 dark:text-white text-base">Free Delivery</h4>
            <p className="text-sm text-muted-foreground">On all orders above ₹999 across India</p>
          </motion.div>
          <motion.div variants={fadeInUp} whileHover={{ scale: 1.05 }} className="flex flex-col items-center gap-2 cursor-default">
            <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center text-gold mb-2">
              <FiRefreshCw size={24} />
            </div>
            <h4 className="font-semibold text-charcoal-950 dark:text-white text-base">Easy Returns</h4>
            <p className="text-sm text-muted-foreground">Hassle-free 30-day return policy</p>
          </motion.div>
          <motion.div variants={fadeInUp} whileHover={{ scale: 1.05 }} className="flex flex-col items-center gap-2 cursor-default">
            <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center text-gold mb-2">
              <FiShield size={24} />
            </div>
            <h4 className="font-semibold text-charcoal-950 dark:text-white text-base">Secure checkout</h4>
            <p className="text-sm text-muted-foreground">100% secure payment gateway partners</p>
          </motion.div>
          <motion.div variants={fadeInUp} whileHover={{ scale: 1.05 }} className="flex flex-col items-center gap-2 cursor-default">
            <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center text-gold mb-2">
              <FiTag size={24} />
            </div>
            <h4 className="font-semibold text-charcoal-950 dark:text-white text-base">Authentic Products</h4>
            <p className="text-sm text-muted-foreground">Directly from verified luxury brands</p>
          </motion.div>
        </div>
      </motion.section>

      {/* TRENDING ITEMS - NOW SHOWS 8 PREMIUM ITEMS */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={staggerContainer}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full"
      >
        <div className="flex items-end justify-between mb-8">
          <motion.div variants={fadeInUp} className="flex flex-col gap-2">
            <span className="text-gold font-semibold uppercase tracking-widest text-xs">High Demand</span>
            <h2 className="text-3xl font-display font-bold">Trending Now</h2>
            <div className="gold-line"></div>
          </motion.div>
          <motion.div variants={fadeInUp}>
            <Link to="/products?isTrending=true" className="text-gold flex items-center gap-1 hover:underline text-sm font-semibold">
              View All <FiArrowRight />
            </Link>
          </motion.div>
        </div>
        <motion.div variants={staggerContainer} className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {trending.slice(0, 8).map((prod) => (
            <motion.div
              key={prod._id}
              variants={fadeInUp}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              onClick={() => navigate(`/products/${prod.slug}`)}
              className="product-card cursor-pointer group"
            >
              <div className="product-img-wrapper overflow-hidden relative">
                <img
                  src={prod.thumbnail}
                  alt={prod.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {prod.baseDiscount > 0 && (
                  <span className="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                    {prod.baseDiscount}% OFF
                  </span>
                )}
              </div>
              <div className="p-4 flex flex-col gap-1.5">
                <h3 className="font-semibold text-charcoal-900 dark:text-white line-clamp-1 text-sm group-hover:text-gold transition-colors">
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
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      {/* FEATURED BRANDS */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={staggerContainer}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full border-t border-border pt-16"
      >
        <motion.div variants={fadeInUp} className="flex flex-col gap-2 mb-8 text-center items-center">
          <span className="text-gold font-semibold uppercase tracking-widest text-xs">Official Partners</span>
          <h2 className="text-3xl font-display font-bold">Featured Brands</h2>
          <div className="gold-line"></div>
        </motion.div>
        <div className="overflow-hidden w-full relative mt-6 opacity-60 py-4 select-none">
          <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none"></div>
          <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none"></div>
          <div className="flex gap-16 animate-marquee whitespace-nowrap">
            {[...brands, ...brands, ...brands].map((b, index) => (
              <div key={`${b._id}-${index}`} className="inline-block transition-all duration-200 hover:scale-110 hover:opacity-100">
                <Link
                  to={`/products?brand=${b._id}`}
                  className="font-display text-2xl font-bold tracking-widest text-charcoal-500 hover:text-primary transition-colors"
                >
                  {b.name.toUpperCase()}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </motion.section>
    </div>
  );
};

export default HomePage;
