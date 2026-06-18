'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { supabaseClient } from '../../../lib/supabaseClient';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { useCurrency } from '../../context/CurrencyContext';

export default function ProductDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const { formatPrice } = useCurrency();

  const [product, setProduct] = useState<any>(null);
  const [variants, setVariants] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);

  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const [userRating, setUserRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [userHasReviewed, setUserHasReviewed] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      const [{ data: productData }, { data: variantData }, { data: reviewData }] = await Promise.all([
        supabaseClient.from('products').select('*').eq('id', id).single(),
        supabaseClient.from('product_variants').select('*').eq('product_id', id),
        supabaseClient
          .from('product_reviews')
          .select('*')
          .eq('product_id', id)
          .order('created_at', { ascending: false })
      ]);

      setProduct(productData);
      setVariants(variantData || []);

      if (reviewData) {
        setReviews(reviewData);
        const avg = reviewData.length
          ? (reviewData.reduce((sum: number, r: any) => sum + r.rating, 0) / reviewData.length).toFixed(1)
          : 0;
        setAverageRating(parseFloat(avg as string));
        setTotalReviews(reviewData.length);
      }

      const { data: { user } } = await supabaseClient.auth.getUser();
      if (user && reviewData) {
        setUserHasReviewed(reviewData.some((r: any) => r.user_id === user.id));
      }

      setLoading(false);
    };

    fetchAll();
  }, [id]);

  // ==================== SALE LOGIC ====================
  // Product-level sale
  const productIsOnSale = product?.is_on_sale === true;
  const productDiscount = product?.discount_percentage || 0;
  const originalPrice = Number(product?.price || 0);

  // Variant-level sale — check selected color's variants
  const selectedColorVariants = variants.filter(v => v.color === selectedColor);
  const variantIsOnSale = selectedColorVariants.length > 0 &&
    selectedColorVariants.every(v => v.is_on_sale);
  const variantDiscount = variantIsOnSale
    ? (selectedColorVariants[0]?.discount_percentage || 0)
    : 0;

  // Variant discount takes priority over product discount
  const isOnSale = variantIsOnSale || productIsOnSale;
  const discount = variantIsOnSale ? variantDiscount : productDiscount;
  const salePrice = isOnSale && discount > 0
    ? originalPrice * (1 - discount / 100)
    : originalPrice;;

  // ==================== IMAGES, COLORS, SIZES, STOCK ====================
  const images = product?.images && product.images.length > 0
    ? product.images
    : (product?.image_url ? [product.image_url] : []);

  const allColors = [...new Set(variants.map(v => v.color))];
  const allSizes = [...new Set(variants.map(v => v.size))];

  const getStock = (color: string, size: string) => {
    const variant = variants.find(v => v.color === color && v.size === size);
    return variant ? variant.stock : 0;
  };

  const selectedStock = getStock(selectedColor, selectedSize);

  // ── Stock status helpers ──────────────────────────────────────────────────────
  const isLastStock = selectedColor && selectedSize && selectedStock === 1;
  const isOutOfStock = selectedColor && selectedSize && selectedStock === 0;

  const [imageLoaded, setImageLoaded] = useState(true);
  const [displayIndex, setDisplayIndex] = useState(0);

  const changeImage = (newIndex: number) => {
    setImageLoaded(false);
    setTimeout(() => {
      setDisplayIndex(newIndex);
      setCurrentImageIndex(newIndex);
      setImageLoaded(true);
    }, 180);
  };

  const prevImage = () => changeImage((currentImageIndex - 1 + images.length) % images.length);
  const nextImage = () => changeImage((currentImageIndex + 1) % images.length);

  // ==================== ADD TO REVIEW ORDER ====================
  const addToReviewOrder = async () => {
    if (!selectedSize || !selectedColor) {
      alert(t('product.selectSize') + ' & ' + t('product.selectColor'));
      return;
    }

    const stock = getStock(selectedColor, selectedSize);
    if (stock <= 0) { alert(t('product.outOfStock')); return; }
    if (quantity > stock) { alert(t('product.onlyXAvailable').replace('{stock}', stock)); return; }

    const newItem = {
      id: product.id,
      name: product.name,
      price: isOnSale ? salePrice : originalPrice,
      originalPrice: originalPrice,
      discountPercentage: isOnSale ? discount : 0,
      isOnSale: isOnSale,
      image_url: images[currentImageIndex] || '',
      size: selectedSize,
      color: selectedColor,
      quantity: quantity,
      category: product.category || null,     // ← ADD
      collection: product.collection || null,  // ← ADD
    };

    const saved = localStorage.getItem('reviewOrder');
    const currentItems = saved ? JSON.parse(saved) : [];
    currentItems.push(newItem);
    localStorage.setItem('reviewOrder', JSON.stringify(currentItems));
    localStorage.setItem('reviewOrderTimestamp', Date.now().toString());
    window.dispatchEvent(new Event('reviewOrderUpdated'));

    const variant = variants.find(v => v.color === selectedColor && v.size === selectedSize);
    if (variant) {
      await supabaseClient.rpc('decrement_stock', {
        variant_id: variant.id,
        qty: quantity,
      });
    }

    router.push('/review-order');
  };

  // ==================== REVIEWS ====================
  const submitReview = async () => {
    if (userRating === 0) { alert("Please select a rating"); return; }
    if (userHasReviewed) { alert("You have already reviewed this product."); return; }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabaseClient.auth.getUser();
      const { error } = await supabaseClient.from('product_reviews').insert({
        product_id: id,
        user_id: user?.id || null,
        rating: userRating,
        review_text: reviewText.trim() || null
      });
      if (error) throw error;
      alert("Thank you! Your review has been submitted.");
      setUserRating(0);
      setReviewText('');
      setUserHasReviewed(true);
      window.location.reload();
    } catch (err: any) {
      alert("Failed to submit review: " + (err.message || err));
    }
    setSubmitting(false);
  };

  const [showAllReviews, setShowAllReviews] = useState(false);

  const renderStars = (rating: number, interactive = false, onClick?: (star: number) => void) =>
    Array.from({ length: 5 }, (_, i) => {
      const starValue = i + 1;
      return (
        <Star
          key={i}
          size={interactive ? 32 : 20}
          className={`cursor-pointer transition-colors ${
            starValue <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
          }`}
          onClick={() => interactive && onClick && onClick(starValue)}
        />
      );
    });

  if (loading) return <p className="text-center py-20">{t('common.loading')}</p>;
  if (!product) return <p className="text-center py-20">{t('common.notFound')}</p>;

  const visibleReviews = showAllReviews ? reviews : reviews.slice(0, 3);

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-20 md:py-30">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="flex flex-col md:grid md:grid-cols-2 md:gap-12">

            {/* ── Image Gallery ── */}
            <div className="relative group mb-6 md:mb-0">
              {images.length > 0 && (
                <div className="relative">
                  <img
                    src={images[displayIndex]}
                    alt={product.name}
                    className={`w-full aspect-[3/4.3] object-cover rounded-2xl md:rounded-3xl transition-all duration-300 group-hover:scale-95 ${
                      imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-[0.98]'
                    }`}
                  />

                  {/* ── Last Stock badge on image ── */}
                  {/* {isLastStock && (
                    <div className="absolute top-3 left-3 bg-amber-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md tracking-wide animate-pulse">
                      🔥 Last Stock
                    </div>
                  )} */}

                  {images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-md transition backdrop-blur-sm"
                        aria-label="Previous image"
                      >
                        <ChevronLeft size={20} className="text-black" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-md transition backdrop-blur-sm"
                        aria-label="Next image"
                      >
                        <ChevronRight size={20} className="text-black" />
                      </button>
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {images.map((_: string, i: number) => (
                          <button
                            key={i}
                            onClick={() => changeImage(i)}
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                              currentImageIndex === i ? 'bg-white w-4' : 'bg-white/50 hover:bg-white/80 w-1.5'
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-2 mt-3 px-25 overflow-x-auto pb-1">
                  {images.map((img: string, i: number) => (
                    <button
                      key={i}
                      onClick={() => changeImage(i)}
                      className={`shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                        currentImageIndex === i ? 'border-black' : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── Product Details ── */}
            <div>
              <h1 className="text-3xl md:text-4xl font-light tracking-widest mb-4">{product.name}</h1>

              {/* Price */}
              <div className="flex items-baseline gap-3 flex-wrap mt-2">
                {isOnSale && discount > 0 ? (
                  <>
                    <span className="text-2xl md:text-3xl font-medium line-through text-gray-400">
                      {formatPrice(originalPrice)}
                    </span>
                    <span className="text-3xl md:text-4xl font-bold text-red-600">
                      {formatPrice(salePrice)}
                    </span>
                    <span className="bg-red-600 text-white text-sm font-bold px-3 py-1 rounded-full">
                      -{discount}%
                    </span>
                  </>
                ) : (
                  <span className="text-3xl md:text-4xl font-bold">{formatPrice(originalPrice)}</span>
                )}
              </div>

              {/* Average Rating */}
              <div className="flex items-center gap-3 mt-5">
                <div className="flex">{renderStars(Math.round(averageRating))}</div>
                <span className="text-xl font-medium">{averageRating}</span>
                <span className="text-gray-500 text-sm">({totalReviews} reviews)</span>
              </div>

              {/* Description */}
              {product.description && (
                <div className="mt-6 text-gray-600 leading-relaxed text-sm md:text-[15px] border-t pt-6">
                  {product.description}
                </div>
              )}

              {/* Color Selection */}
              <div className="mt-8">
                <p className="font-medium mb-3">{t('product.selectColor')}</p>
                <div className="flex gap-2 flex-wrap">
                  {allColors.map((color: string) => {
                    const hasStock = variants.some(v => v.color === color && v.stock > 0);
                    const colorOnSale = variants.some(v => v.color === color && v.is_on_sale && v.discount_percentage > 0);
                    const colorDiscount = variants.find(v => v.color === color && v.is_on_sale)?.discount_percentage || 0;

                    return (
                      <button
                        key={color}
                        onClick={() => { setSelectedColor(color); setSelectedSize(''); setQuantity(1); }}
                        disabled={!hasStock}
                        className={`relative px-5 py-2.5 border rounded-full text-sm transition ${
                          selectedColor === color ? 'bg-black text-white' : 'hover:bg-gray-100'
                        } ${!hasStock ? 'opacity-50 line-through cursor-not-allowed' : ''}`}
                      >
                        {color}
                        {colorOnSale && (
                          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                            -{colorDiscount}%
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Size Selection */}
              <div className="mt-6">
                <p className="font-medium mb-3">{t('product.selectSize')}</p>
                <div className="flex gap-2 flex-wrap">
                  {allSizes.map((size: string) => {
                    const stock = getStock(selectedColor, size);
                    const isThisLastStock = selectedColor && stock === 1;
                    const isThisOutOfStock = selectedColor && stock === 0;
                    return (
                      <button
                        key={size}
                        onClick={() => { if (selectedColor) setSelectedSize(size); }}
                        disabled={!selectedColor}
                        className={[
                          'relative px-5 py-2.5 border rounded-full text-sm transition',
                          selectedSize === size
                            ? isThisOutOfStock
                              ? 'bg-red-50 border-red-400 text-red-500'
                              : 'bg-black text-white border-black'
                            : 'hover:bg-gray-100',
                          isThisOutOfStock ? 'opacity-50 line-through' : '',
                          // isThisLastStock && selectedSize !== size ? 'border-amber-400' : '',
                        ].join(' ')}
                      >
                        {size}
                        {/* {isThisLastStock && (
                          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-white" />
                        )} */}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── Stock status banner — appears after color + size selected ── */}
              {selectedColor && selectedSize && (isOutOfStock || isLastStock) && (
                <div className={`mt-4 flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-medium ${
                  isOutOfStock
                    ? 'bg-red-50 border border-red-200 text-red-700'
                    : 'bg-amber-50 border border-amber-300 text-amber-800'
                }`}>
                  {isOutOfStock ? (
                    <>
                      <span>Out Of Stock — Check Back Soon</span>
                    </>
                  ) : (
                    <>
                      <span>Last Stock — Only 1 Left!</span>
                    </>
                  )}
                </div>
              )}

              {/* Quantity */}
              <div className="mt-8">
                <p className="font-medium mb-3">{t('product.quantity')}</p>
                <div className="flex items-center gap-5">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="text-2xl w-10 h-10 flex items-center justify-center border rounded-full hover:bg-gray-100"
                  >
                    −
                  </button>
                  <span className="text-2xl font-medium w-8 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(selectedStock || 1, quantity + 1))}
                    className="text-2xl w-10 h-10 flex items-center justify-center border rounded-full hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Add to Order Button */}
              <button
                onClick={addToReviewOrder}
                disabled={!selectedSize || !selectedColor || selectedStock <= 0}
                className="mt-10 w-full bg-black text-white py-5 rounded-full text-sm tracking-widest hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {t('product.addToReviewOrder')}
              </button>

              {/* ── Ratings & Reviews ── */}
              <div className="mt-12 md:mt-16 border-t pt-10 md:pt-12">
                <h2 className="text-xl md:text-2xl font-light mb-6 md:mb-8">Ratings & Reviews</h2>

                <div className="bg-white p-6 md:p-8 rounded-3xl border mb-8">
                  <p className="font-medium mb-4">How would you rate this product?</p>
                  <div className="flex gap-2 mb-4">
                    {renderStars(userRating, true, setUserRating)}
                  </div>
                  {userHasReviewed ? (
                    <p className="text-green-600 font-medium text-sm">✓ You have already reviewed this product</p>
                  ) : userRating > 0 && (
                    <>
                      <textarea
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        placeholder="Write your review (optional)"
                        className="w-full h-24 border rounded-2xl px-5 py-4 resize-y min-h-[100px] text-sm"
                      />
                      <button
                        onClick={submitReview}
                        disabled={submitting}
                        className="mt-4 bg-black text-white px-8 py-3 rounded-full hover:bg-gray-800 disabled:opacity-70 text-sm"
                      >
                        {submitting ? 'Submitting...' : 'Submit Rating & Review'}
                      </button>
                    </>
                  )}
                </div>

                <div className="space-y-4 md:space-y-6">
                  {reviews.length === 0 ? (
                    <p className="text-gray-500 text-sm">No reviews yet. Be the first to rate!</p>
                  ) : (
                    <>
                      {visibleReviews.map((review: any) => (
                        <div key={review.id} className="bg-white p-5 md:p-6 rounded-3xl border">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex">{renderStars(review.rating)}</div>
                            <span className="text-xs text-gray-400">
                              {new Date(review.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="font-medium text-sm">
                            {review.user_id ? 'Verified User' : 'Anonymous'}
                          </p>
                          {review.review_text && (
                            <p className="mt-2 text-gray-600 text-sm leading-relaxed">{review.review_text}</p>
                          )}
                        </div>
                      ))}

                      {reviews.length > 3 && (
                        <button
                          onClick={() => setShowAllReviews(!showAllReviews)}
                          className="w-full py-4 border border-gray-200 rounded-2xl text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition flex items-center justify-center gap-2"
                        >
                          {showAllReviews ? (
                            <>
                              <span>Show Less</span>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="m18 15-6-6-6 6"/>
                              </svg>
                            </>
                          ) : (
                            <>
                              <span>See All {reviews.length} Reviews</span>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="m6 9 6 6 6-6"/>
                              </svg>
                            </>
                          )}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}