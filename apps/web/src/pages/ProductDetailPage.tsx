import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCartStore, useAuthStore } from '@/store';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { FiHeart, FiShoppingBag, FiTruck, FiRefreshCw, FiShield, FiLayers } from 'react-icons/fi';
import toast from 'react-hot-toast';

interface Variant {
  _id: string;
  color: string;
  size: string;
  price: number;
  mrp: number;
  stock: number;
  images: string[];
}

interface Product {
  _id: string;
  name: string;
  description: string;
  shortDescription: string;
  thumbnail: string;
  images: string[];
  basePrice: number;
  baseMrp: number;
  baseDiscount: number;
  rating: number;
  reviewCount: number;
  variants: Variant[];
  brand: { name: string; slug: string };
  category: { name: string; slug: string };
}

const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCartStore();
  const { isAuthenticated, user, toggleWishlist } = useAuthStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImage, setActiveImage] = useState('');
  const [isCompared, setIsCompared] = useState(false);

  // Tabs state
  const [activeTab, setActiveTab] = useState<'description' | 'reviews' | 'qa'>('description');

  // Reviews state
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newReviewTitle, setNewReviewTitle] = useState('');
  const [newReviewBody, setNewReviewBody] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Q&A state
  const [questions, setQuestions] = useState<any[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [isSubmittingQuestion, setIsSubmittingQuestion] = useState(false);
  const [activeAnswerBox, setActiveAnswerBox] = useState<string | null>(null);
  const [newAnswer, setNewAnswer] = useState('');
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);

  const fetchReviews = async () => {
    if (!product) return;
    setReviewsLoading(true);
    try {
      const { data } = await api.get(`/reviews?product=${product._id}`);
      setReviews(data.data);
    } catch {
      toast.error('Failed to load reviews.');
    } finally {
      setReviewsLoading(false);
    }
  };

  const fetchQuestions = async () => {
    if (!product) return;
    setQuestionsLoading(true);
    try {
      const { data } = await api.get(`/reviews/questions?product=${product._id}`);
      setQuestions(data.data);
    } catch {
      toast.error('Failed to load questions.');
    } finally {
      setQuestionsLoading(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Please sign in to write a review.');
      return;
    }
    if (!newReviewTitle || !newReviewBody) {
      toast.error('Please fill in all fields.');
      return;
    }
    setIsSubmittingReview(true);
    try {
      await api.post('/reviews', {
        productId: product?._id,
        rating: newRating,
        title: newReviewTitle,
        body: newReviewBody,
      });
      toast.success('Review submitted successfully! It is pending moderation.');
      setNewReviewTitle('');
      setNewReviewBody('');
      setNewRating(5);
      fetchReviews();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Please sign in to ask a question.');
      return;
    }
    if (newQuestion.length < 10) {
      toast.error('Question must be at least 10 characters.');
      return;
    }
    setIsSubmittingQuestion(true);
    try {
      await api.post('/reviews/questions', {
        productId: product?._id,
        question: newQuestion,
      });
      toast.success('Question posted successfully!');
      setNewQuestion('');
      fetchQuestions();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to post question.');
    } finally {
      setIsSubmittingQuestion(false);
    }
  };

  const handleAnswerSubmit = async (questionId: string) => {
    if (!isAuthenticated) {
      toast.error('Please sign in to answer.');
      return;
    }
    if (newAnswer.length < 5) {
      toast.error('Answer must be at least 5 characters.');
      return;
    }
    setIsSubmittingAnswer(true);
    try {
      await api.post(`/reviews/questions/${questionId}/answers`, {
        answer: newAnswer,
      });
      toast.success('Answer posted successfully!');
      setNewAnswer('');
      setActiveAnswerBox(null);
      fetchQuestions();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to post answer.');
    } finally {
      setIsSubmittingAnswer(false);
    }
  };

  const handleCompareToggle = () => {
    if (!product) return;
    const savedCompare: string[] = JSON.parse(localStorage.getItem('styleverse_compare') || '[]');
    if (savedCompare.includes(product._id)) {
      const updated = savedCompare.filter((id) => id !== product._id);
      localStorage.setItem('styleverse_compare', JSON.stringify(updated));
      setIsCompared(false);
      toast.success('Removed from comparison list.');
    } else {
      if (savedCompare.length >= 4) {
        toast.error('You can compare a maximum of 4 products.');
        return;
      }
      savedCompare.push(product._id);
      localStorage.setItem('styleverse_compare', JSON.stringify(savedCompare));
      setIsCompared(true);
      toast.success('Added to comparison list.');
    }
  };

  useEffect(() => {
    const fetchProduct = async () => {
      setIsLoading(true);
      try {
        const { data } = await api.get(`/products/${slug}`);
        const prodData = data.data.product;
        setProduct(prodData);
        if (prodData.variants && prodData.variants.length > 0) {
          setSelectedVariant(prodData.variants[0]);
        }
        setActiveImage(prodData.thumbnail || prodData.images[0] || '');
        const savedCompare: string[] = JSON.parse(localStorage.getItem('styleverse_compare') || '[]');
        setIsCompared(savedCompare.includes(prodData._id));
      } catch {
        toast.error('Failed to load product details.');
        navigate('/products');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProduct();
  }, [slug, navigate]);

  useEffect(() => {
    if (!product) return;
    if (activeTab === 'reviews') {
      fetchReviews();
    } else if (activeTab === 'qa') {
      fetchQuestions();
    }
  }, [activeTab, product]);

  if (isLoading || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-gold/20 border-t-gold rounded-full animate-spin"></div>
      </div>
    );
  }

  const isWishlisted = isAuthenticated && user?.wishlist?.includes(product._id);

  const handleWishlistToggle = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to manage your wishlist.');
      return;
    }
    try {
      await api.post('/wishlist/toggle', { productId: product._id });
      toggleWishlist(product._id);
      toast.success(isWishlisted ? 'Removed from wishlist.' : 'Added to wishlist.');
    } catch {
      toast.error('Could not update wishlist.');
    }
  };

  const handleAddToCart = async () => {
    if (!selectedVariant) return;
    if (!isAuthenticated) {
      toast.error('Please sign in to add items to cart.');
      navigate('/auth/login');
      return;
    }

    try {
      await addToCart(product._id, selectedVariant._id, quantity);
      toast.success('Added to cart successfully.');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add to cart.');
    }
  };

  const colors = Array.from(new Set(product.variants.map((v) => v.color)));
  const sizes = Array.from(new Set(product.variants.map((v) => v.size)));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12 flex flex-col gap-8 sm:gap-16">
      <div className="flex flex-col md:flex-row gap-6 md:gap-12">
        {/* IMAGES COLUMN */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="aspect-[3/4] bg-muted rounded-2xl md:rounded-3xl overflow-hidden border border-border">
            <img
              src={activeImage}
              alt={product.name}
              className="w-full h-full object-cover transition-all duration-300"
            />
          </div>
          <div className="flex gap-2 sm:gap-4 overflow-x-auto pb-2 no-scrollbar">
            {product.images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImage(img)}
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${activeImage === img ? 'border-gold' : 'border-border opacity-70 hover:opacity-100'}`}
              >
                <img src={img} alt="Product preview" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* DETAIL COLUMN */}
        <div className="flex-1 flex flex-col gap-5 md:gap-6">
          <div className="flex flex-col gap-1.5">
            <span className="text-gold font-display font-bold uppercase tracking-wider text-xs">
              {product.brand?.name || 'StyleVerse Premium'}
            </span>
            <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-charcoal-950 dark:text-white leading-tight">
              {product.name}
            </h1>
            <div className="flex items-center gap-2 text-sm text-yellow-500 font-medium mt-1">
              ⭐ {product.rating ? product.rating.toFixed(1) : 'New'}
              <span className="text-muted-foreground font-normal">({product.reviewCount} customer reviews)</span>
            </div>
          </div>

          {/* Price */}
          <div className="flex flex-wrap items-center gap-3 border-y border-border py-4">
            <span className="text-2xl sm:text-3xl font-display font-black text-charcoal-950 dark:text-white">
              {formatCurrency(selectedVariant?.price || product.basePrice)}
            </span>
            {(selectedVariant?.mrp || product.baseMrp) > (selectedVariant?.price || product.basePrice) && (
              <>
                <span className="text-base sm:text-lg text-muted-foreground line-through">
                  {formatCurrency(selectedVariant?.mrp || product.baseMrp)}
                </span>
                <span className="text-xs sm:text-sm bg-red-100 text-red-700 px-2.5 py-0.5 rounded-full font-bold">
                  {product.baseDiscount}% OFF
                </span>
              </>
            )}
          </div>

          {/* Short Description */}
          <p className="text-muted-foreground text-sm leading-relaxed">
            {product.shortDescription || product.description.substring(0, 150) + '...'}
          </p>

          {/* Variants Selector */}
          {product.variants.length > 0 && (
            <div className="flex flex-col gap-3">
              <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Select Option</h4>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => (
                  <button
                    key={v._id}
                    onClick={() => setSelectedVariant(v)}
                    className={`px-3.5 py-2 border rounded-xl text-xs sm:text-sm font-medium transition-all ${selectedVariant?._id === v._id ? 'border-gold bg-gold/5 text-gold font-bold shadow-sm' : 'border-border hover:border-gold/50 text-foreground'}`}
                  >
                    {v.size} ({v.color})
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Purchase Controls */}
          <div className="flex flex-wrap items-center gap-3 mt-2 sm:mt-4">
            <div className="flex items-center border border-border rounded-xl px-3 py-2 bg-muted/20">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-2 font-bold hover:text-gold text-lg"
              >
                -
              </button>
              <span className="px-3 font-semibold text-sm">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="px-2 font-bold hover:text-gold text-lg"
              >
                +
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              className="btn-primary flex-1 min-w-[140px] py-3 flex items-center justify-center gap-2 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all"
              disabled={!!(selectedVariant && selectedVariant.stock <= 0)}
            >
              <FiShoppingBag size={18} /> {selectedVariant && selectedVariant.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
            </button>

            <div className="flex gap-2">
              <button
                onClick={handleCompareToggle}
                className={`p-3 border rounded-xl hover:bg-gold hover:text-white transition-all ${isCompared ? 'bg-gold/15 text-gold border-gold' : 'border-border text-foreground'}`}
                title="Add to compare list"
              >
                <FiLayers size={18} />
              </button>

              <button
                onClick={handleWishlistToggle}
                className={`p-3 border rounded-xl hover:bg-gold hover:text-white transition-all ${isWishlisted ? 'bg-gold/15 text-gold border-gold' : 'border-border text-foreground'}`}
                title="Save to wishlist"
              >
                <FiHeart size={18} fill={isWishlisted ? 'currentColor' : 'transparent'} />
              </button>
            </div>
          </div>

          {/* Policies grid */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 border-t border-border pt-5 mt-2 text-center">
            <div className="flex flex-col items-center gap-1 text-[11px] sm:text-xs text-muted-foreground">
              <FiTruck size={18} className="text-gold" />
              <span>Fast Shipping</span>
            </div>
            <div className="flex flex-col items-center gap-1 text-[11px] sm:text-xs text-muted-foreground">
              <FiRefreshCw size={18} className="text-gold" />
              <span>30-Day Returns</span>
            </div>
            <div className="flex flex-col items-center gap-1 text-[11px] sm:text-xs text-muted-foreground">
              <FiShield size={18} className="text-gold" />
              <span>100% Original</span>
            </div>
          </div>
        </div>
      </div>

      {/* TABS SECTION */}
      <div className="border-t border-border pt-8 sm:pt-10">
        <div className="flex border-b border-border mb-6 gap-6 sm:gap-8 overflow-x-auto no-scrollbar whitespace-nowrap">
          <button
            onClick={() => setActiveTab('description')}
            className={`pb-3 text-base sm:text-lg font-display font-bold border-b-2 transition-all ${activeTab === 'description' ? 'border-gold text-gold' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            Description
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`pb-3 text-base sm:text-lg font-display font-bold border-b-2 transition-all ${activeTab === 'reviews' ? 'border-gold text-gold' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            Reviews ({product.reviewCount})
          </button>
          <button
            onClick={() => setActiveTab('qa')}
            className={`pb-3 text-base sm:text-lg font-display font-bold border-b-2 transition-all ${activeTab === 'qa' ? 'border-gold text-gold' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            Q&A
          </button>
        </div>

        {/* TAB CONTENTS */}
        {activeTab === 'description' && (
          <div className="prose dark:prose-invert max-w-none text-charcoal-700 dark:text-charcoal-200 leading-relaxed">
            <h3 className="text-xl font-bold font-display mb-4">About this Product</h3>
            <p className="whitespace-pre-line">{product.description}</p>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="flex flex-col lg:flex-row gap-12">
            {/* WRITE A REVIEW */}
            <div className="w-full lg:w-1/3 bg-muted/20 p-6 rounded-2xl border border-border h-fit flex flex-col gap-6">
              <h3 className="text-lg font-display font-bold">Write a Review</h3>
              {isAuthenticated ? (
                <form onSubmit={handleReviewSubmit} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Rating</label>
                    <div className="flex gap-1.5 text-xl text-yellow-500 cursor-pointer">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          onClick={() => setNewRating(star)}
                        >
                          {star <= newRating ? '★' : '☆'}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Review Title</label>
                    <input
                      type="text"
                      placeholder="Summarize your experience"
                      className="input-field"
                      value={newReviewTitle}
                      onChange={(e) => setNewReviewTitle(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Review Details</label>
                    <textarea
                      placeholder="What did you like or dislike?"
                      className="input-field min-h-[100px] resize-none"
                      value={newReviewBody}
                      onChange={(e) => setNewReviewBody(e.target.value)}
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn-primary py-2.5 rounded-xl text-sm"
                    disabled={isSubmittingReview}
                  >
                    {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form>
              ) : (
                <div className="text-center py-4 flex flex-col gap-3">
                  <p className="text-sm text-muted-foreground">Please sign in to write a review.</p>
                  <Link to="/auth/login" className="btn-secondary py-2.5 text-sm rounded-xl">
                    Sign In
                  </Link>
                </div>
              )}
            </div>

            {/* REVIEWS LIST */}
            <div className="flex-1 flex flex-col gap-6">
              <h3 className="text-lg font-display font-bold">Customer Reviews</h3>
              {reviewsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="w-8 h-8 border-4 border-gold/20 border-t-gold rounded-full animate-spin"></div>
                </div>
              ) : reviews.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6">No reviews yet. Be the first to review this product!</p>
              ) : (
                <div className="flex flex-col gap-6">
                  {reviews.map((rev) => (
                    <div key={rev._id} className="border-b border-border pb-6 flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={rev.user?.avatar || '/placeholder-avatar.jpg'}
                          alt={rev.user?.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <h4 className="font-semibold text-sm">{rev.user?.name}</h4>
                          <span className="text-xs text-muted-foreground">
                            {new Date(rev.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-yellow-500 font-medium">{'★'.repeat(rev.rating) + '☆'.repeat(5 - rev.rating)}</span>
                        <h5 className="font-bold text-sm">{rev.title}</h5>
                      </div>
                      <p className="text-sm text-charcoal-700 dark:text-charcoal-300">{rev.body}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'qa' && (
          <div className="flex flex-col gap-8">
            {/* ASK A QUESTION */}
            <div className="bg-muted/10 p-6 rounded-2xl border border-border flex flex-col gap-4">
              <h3 className="text-lg font-display font-bold">Have a question?</h3>
              {isAuthenticated ? (
                <form onSubmit={handleQuestionSubmit} className="flex gap-4 items-end">
                  <div className="flex-1 flex flex-col gap-1.5">
                    <input
                      type="text"
                      placeholder="Ask about fit, material, delivery..."
                      className="input-field"
                      value={newQuestion}
                      onChange={(e) => setNewQuestion(e.target.value)}
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn-primary px-6 py-3 rounded-xl text-sm"
                    disabled={isSubmittingQuestion}
                  >
                    {isSubmittingQuestion ? 'Asking...' : 'Ask Question'}
                  </button>
                </form>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Please sign in to ask a question.</p>
                  <Link to="/auth/login" className="btn-secondary px-6 py-2.5 text-sm rounded-xl">
                    Sign In
                  </Link>
                </div>
              )}
            </div>

            {/* QUESTIONS LIST */}
            <div className="flex flex-col gap-6 mt-4">
              <h3 className="text-lg font-display font-bold">Questions & Answers</h3>
              {questionsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="w-8 h-8 border-4 border-gold/20 border-t-gold rounded-full animate-spin"></div>
                </div>
              ) : questions.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6">No questions asked yet. Ask a question above!</p>
              ) : (
                <div className="flex flex-col gap-6">
                  {questions.map((q) => (
                    <div key={q._id} className="bg-muted/5 p-6 rounded-2xl border border-border flex flex-col gap-4">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex flex-col gap-1.5">
                          <span className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Question</span>
                          <p className="font-semibold text-base text-charcoal-900 dark:text-white">Q: {q.question}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>Asked by {q.user?.name || 'Customer'}</span>
                            <span>•</span>
                            <span>{new Date(q.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        {isAuthenticated && (
                          <button
                            onClick={() => {
                              setActiveAnswerBox(activeAnswerBox === q._id ? null : q._id);
                              setNewAnswer('');
                            }}
                            className="btn-secondary px-4 py-1.5 text-xs rounded-lg"
                          >
                            {activeAnswerBox === q._id ? 'Cancel' : 'Answer'}
                          </button>
                        )}
                      </div>

                      {/* Answer input field */}
                      {activeAnswerBox === q._id && (
                        <div className="flex gap-3 mt-2">
                          <input
                            type="text"
                            placeholder="Type your answer..."
                            className="input-field py-2 text-sm"
                            value={newAnswer}
                            onChange={(e) => setNewAnswer(e.target.value)}
                          />
                          <button
                            onClick={() => handleAnswerSubmit(q._id)}
                            className="btn-primary px-4 py-2 text-xs rounded-xl"
                            disabled={isSubmittingAnswer}
                          >
                            {isSubmittingAnswer ? 'Submitting...' : 'Submit'}
                          </button>
                        </div>
                      )}

                      {/* Answers List */}
                      <div className="flex flex-col gap-3 pl-4 border-l-2 border-gold/30">
                        {q.answers && q.answers.length > 0 ? (
                          q.answers.map((ans: any, idx: number) => (
                            <div key={idx} className="flex flex-col gap-1.5">
                              <p className="text-sm text-charcoal-800 dark:text-charcoal-200">
                                <span className="font-bold text-gold mr-1.5">A:</span>
                                {ans.answer}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>
                                  Answered by {ans.user?.name || 'User'}
                                  {ans.isVendor && <span className="ml-1 text-gold font-bold bg-gold/10 px-1.5 py-0.5 rounded">Store Representative</span>}
                                </span>
                                <span>•</span>
                                <span>{new Date(ans.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-muted-foreground italic">No answers yet.</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetailPage;
