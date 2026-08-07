'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { supabaseClient } from '../../../lib/supabaseClient';
import { Star, ChevronLeft, ChevronRight, Truck, RotateCcw, Heart, ShieldCheck } from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { useCurrency } from '../../context/CurrencyContext';

type Props = {
  initialProduct: any;
  initialVariants: any[];
  initialReviews: any[];
};

export default function ProductDetailClient({ initialProduct, initialVariants, initialReviews }: Props) {
  const router = useRouter();
  const { t } = useTranslation();
  const { formatPrice } = useCurrency();

  const [product] = useState<any>(initialProduct);
  const [variants] = useState<any[]>(initialVariants);
  const [reviews, setReviews] = useState<any[]>(initialReviews);

  const averageRating = reviews.length
    ? parseFloat((reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length).toFixed(1))
    : 0;
  const totalReviews = reviews.length;

  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const [userRating, setUserRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [userHasReviewed, setUserHasReviewed] = useState(false);
  const LIGHTBOX_ZOOM_SCALE = 2.00;
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  // Check if current user already reviewed + check wishlist status.
  // This is the only data that genuinely needs to happen client-side
  // (it depends on the logged-in user, which the server doesn't know).
  useEffect(() => {
    let mounted = true;

    const checkUserState = async () => {
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user || !mounted) return;

      setUserHasReviewed(reviews.some((r: any) => r.user_id === user.id));

      const { data, error } = await supabaseClient
        .from('wishlist')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', product.id)
        .maybeSingle();

      if (error) {
        console.error('Wishlist check error:', error);
        return;
      }
      if (mounted) setIsWishlisted(!!data);
    };

    checkUserState();
    return () => { mounted = false; };
  }, [product.id, reviews]);

  // ==================== SALE LOGIC ====================
  const productIsOnSale = product?.is_on_sale === true;
  const productDiscount = product?.discount_percentage || 0;
  const originalPrice = Number(product?.price || 0);

  const selectedColorVariants = variants.filter(v => v.color === selectedColor);
  const variantIsOnSale = selectedColorVariants.length > 0 &&
    selectedColorVariants.every(v => v.is_on_sale);
  const variantDiscount = variantIsOnSale
    ? (selectedColorVariants[0]?.discount_percentage || 0)
    : 0;

  const isOnSale = variantIsOnSale || productIsOnSale;
  const discount = variantIsOnSale ? variantDiscount : productDiscount;
  const salePrice = isOnSale && discount > 0
    ? originalPrice * (1 - discount / 100)
    : originalPrice;

  // ==================== IMAGES, COLORS, SIZES, STOCK ====================
  const allImages = product?.images && product.images.length > 0
    ? product.images
    : (product?.image_url ? [product.image_url] : []);

  const colorTaggedImages = selectedColor ? product?.images_by_color?.[selectedColor] : null;
  const images = (colorTaggedImages && colorTaggedImages.length > 0) ? colorTaggedImages : allImages;

  const allColors = [...new Set(variants.map(v => v.color))];
  const allSizes = [...new Set(variants.map(v => v.size))];

  const getStock = (color: string, size: string) => {
    const variant = variants.find(v => v.color === color && v.size === size);
    return variant ? variant.stock : 0;
  };

  const selectedStock = getStock(selectedColor, selectedSize);
  const isLastStock = selectedColor && selectedSize && selectedStock === 1;
  const isOutOfStock = selectedColor && selectedSize && selectedStock === 0;

  const [imageLoaded, setImageLoaded] = useState(true);
  const [displayIndex, setDisplayIndex] = useState(0);
  const [isZooming, setIsZooming] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxZoomed, setLightboxZoomed] = useState(false);
  const [lightboxZoomOrigin, setLightboxZoomOrigin] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
  };

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

  const toggleWishlist = async () => {
    setWishlistLoading(true);
    try {
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) { router.push('/login'); return; }

      if (isWishlisted) {
        const { error } = await supabaseClient
          .from('wishlist')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', product.id);
        if (error) throw error;
        setIsWishlisted(false);
        window.dispatchEvent(new Event('wishlistUpdated'));
      } else {
        const { error } = await supabaseClient
          .from('wishlist')
          .insert({ user_id: user.id, product_id: product.id });
        if (error) throw error;
        setIsWishlisted(true);
        window.dispatchEvent(new Event('wishlistUpdated'));
      }
    } catch (err: any) {
      console.error('Wishlist error:', err);
    }
    setWishlistLoading(false);
  };

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
      quantity,
      category: product.category || null,
      collection: product.collection || null,
    };

    const saved = localStorage.getItem('reviewOrder');
    const currentItems = saved ? JSON.parse(saved) : [];
    const existingIndex = currentItems.findIndex(
      (item: any) => item.id === newItem.id && item.size === newItem.size && item.color === newItem.color
    );

    if (existingIndex !== -1) {
      const newQuantity = currentItems[existingIndex].quantity + quantity;
      if (newQuantity > stock) { alert(t('product.onlyXAvailable').replace('{stock}', stock)); return; }
      currentItems[existingIndex].quantity = newQuantity;
    } else {
      currentItems.push(newItem);
    }

    localStorage.setItem('reviewOrder', JSON.stringify(currentItems));
    localStorage.setItem('reviewOrderTimestamp', Date.now().toString());
    window.dispatchEvent(new Event('reviewOrderUpdated'));

    const variant = variants.find((v) => v.color === selectedColor && v.size === selectedSize);
    if (variant) {
      await supabaseClient.rpc('decrement_stock', { variant_id: variant.id, qty: quantity });
    }

    router.push('/review-order');
  };

  const submitReview = async () => {
    if (userRating === 0) { alert("Please select a rating"); return; }
    if (userHasReviewed) { alert("You have already reviewed this product."); return; }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabaseClient.auth.getUser();
      const { data: inserted, error } = await supabaseClient
        .from('product_reviews')
        .insert({
          product_id: product.id,
          user_id: user?.id || null,
          rating: userRating,
          review_text: reviewText.trim() || null,
        })
        .select()
        .single();
      if (error) throw error;

      alert("Thank you! Your review has been submitted.");
      setReviews(prev => [inserted, ...prev]);
      setUserRating(0);
      setReviewText('');
      setUserHasReviewed(true);
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
  const visibleReviews = showAllReviews ? reviews : reviews.slice(0, 3);
  const totalStock = variants.reduce((sum, v) => sum + (v.stock || 0), 0);

    const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.images || [],
    description: product.description || `Shop ${product.name} at GEORIANA.`,
    sku: variants[0]?.sku?.split('-').slice(0, -2).join('-') || product.id,
    brand: { '@type': 'Brand', name: 'GEORIANA' },
    offers: {
        '@type': 'Offer',
        url: `https://georiana.com/product/${product.id}`,
        priceCurrency: 'EGP',
        price: (isOnSale && discount > 0 ? salePrice : originalPrice).toFixed(2),
        availability: totalStock > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
    },
    ...(totalReviews > 0 && {
        aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: averageRating,
        reviewCount: totalReviews,
        },
    }),
    };

  return (
    <>
      <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
    />
      <Header />
      <div className="min-h-screen bg-gray-50 py-20 md:py-30">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="flex flex-col md:grid md:grid-cols-2 md:gap-12">

            {/* ── Image Gallery ── */}
            <div className="relative group mb-6 md:mb-0">
              {images.length > 0 && (
                <div className="relative">
                  <div
                    className="relative overflow-hidden rounded-2xl md:rounded-3xl"
                    onMouseEnter={() => setIsZooming(true)}
                    onMouseLeave={() => setIsZooming(false)}
                    onMouseMove={handleMouseMove}
                    onClick={() => setLightboxOpen(true)}
                  >
                    <img
                      src={images[displayIndex]}
                      alt={product.name}
                      className={`w-full aspect-[3/4.3] object-cover transition-all duration-100 group-hover:scale-95 cursor-zoom-in ${
                        imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-[0.98]'
                      }`}
                    />
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleWishlist(); }}
                      disabled={wishlistLoading}
                      className="absolute top-4 right-4 p-2.5 bg-white rounded-full shadow hover:bg-red-50 hover:scale-110 transition z-10"
                      aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                    >
                      <Heart size={22} className={isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-700'} />
                    </button>
                    {isZooming && (
                      <div
                        className="hidden md:block absolute inset-0 pointer-events-none"
                        style={{
                          backgroundImage: `url(${images[displayIndex]})`,
                          backgroundSize: '220%',
                          backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
                          backgroundRepeat: 'no-repeat',
                        }}
                      />
                    )}
                  </div>

                  {images.length > 1 && (
                    <>
                      <button onClick={prevImage} className="absolute left-5 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-md transition backdrop-blur-sm" aria-label="Previous image">
                        <ChevronLeft size={20} className="text-black" />
                      </button>
                      <button onClick={nextImage} className="absolute right-5 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-md transition backdrop-blur-sm" aria-label="Next image">
                        <ChevronRight size={20} className="text-black" />
                      </button>
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {images.map((_: string, i: number) => (
                          <button key={i} onClick={() => changeImage(i)} className={`h-1.5 rounded-full transition-all duration-300 ${currentImageIndex === i ? 'bg-white w-4' : 'bg-white/50 hover:bg-white/80 w-1.5'}`} />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {images.length > 1 && (
                <div className="flex gap-2 mt-3 px-15 overflow-x-auto pb-1">
                  {images.map((img: string, i: number) => (
                    <button key={i} onClick={() => changeImage(i)} className={`shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden border-2 transition-all duration-200 ${currentImageIndex === i ? 'border-black' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                      <img
                        src={img}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── Product Details ── */}
            <div>
              <h1 className="text-3xl md:text-4xl font-light tracking-widest mb-4">{product.name}</h1>

              <div className="flex items-baseline gap-3 flex-wrap mt-2">
                {isOnSale && discount > 0 ? (
                  <>
                    <span className="text-2xl md:text-3xl font-medium line-through text-gray-400">{formatPrice(originalPrice)}</span>
                    <span className="text-3xl md:text-4xl font-bold text-red-600">{formatPrice(salePrice)}</span>
                    <span className="bg-red-600 text-white text-sm font-bold px-3 py-1 rounded-full">-{discount}%</span>
                  </>
                ) : (
                  <span className="text-3xl md:text-4xl font-bold">{formatPrice(originalPrice)}</span>
                )}
              </div>

              <div className="flex items-center gap-3 mt-5">
                <div className="flex">{renderStars(Math.round(averageRating))}</div>
                <span className="text-xl font-medium">{averageRating}</span>
                <span className="text-gray-500 text-sm">({totalReviews} reviews)</span>
              </div>

              {product.description && (
                <div className="mt-6 text-gray-600 leading-relaxed text-base md:text-lg whitespace-pre-line border-t pt-6">
                  {product.description}
                </div>
              )}

              {variants.length > 0 && variants[0]?.sku && (
                <div className="mt-6 flex items-center gap-2">
                  <span className="text-l font-medium uppercase text-gray-900 whitespace-nowrap">SKU:</span>
                  <span className="font-mono text-x tracking-wider text-gray-700 whitespace-nowrap">
                    {variants[0].sku.split("-").slice(0, -2).join("-")}
                  </span>
                </div>
              )}

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
                        onClick={() => { setSelectedColor(color); setSelectedSize(''); setQuantity(1); setDisplayIndex(0); setCurrentImageIndex(0); }}
                        disabled={!hasStock}
                        className={`relative px-5 py-2.5 border rounded-full text-sm transition ${selectedColor === color ? 'bg-black text-white' : 'hover:bg-gray-100'} ${!hasStock ? 'opacity-50 line-through cursor-not-allowed' : ''}`}
                      >
                        {color}
                        {colorOnSale && (
                          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">-{colorDiscount}%</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6">
                <p className="font-medium mb-3">{t('product.selectSize')}</p>
                <div className="flex gap-2 flex-wrap">
                  {allSizes.map((size: string) => {
                    const stock = getStock(selectedColor, size);
                    const isThisOutOfStock = selectedColor && stock === 0;
                    return (
                      <button
                        key={size}
                        onClick={() => { if (selectedColor) setSelectedSize(size); }}
                        disabled={!selectedColor}
                        className={[
                          'relative px-5 py-2.5 border rounded-full text-sm transition',
                          selectedSize === size
                            ? isThisOutOfStock ? 'bg-red-50 border-red-400 text-red-500' : 'bg-black text-white border-black'
                            : 'hover:bg-gray-100',
                          isThisOutOfStock ? 'opacity-50 line-through' : '',
                        ].join(' ')}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedColor && selectedSize && (isOutOfStock || isLastStock) && (
                <div className={`mt-4 flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-medium ${isOutOfStock ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-amber-50 border border-amber-300 text-amber-800'}`}>
                  {isOutOfStock ? <span>Out Of Stock — Check Back Soon</span> : <span>Last Stock — Only 1 Left!</span>}
                </div>
              )}

              <div className="mt-8">
                <p className="font-medium mb-3">{t('product.quantity')}</p>
                <div className="flex items-center gap-5">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="text-2xl w-10 h-10 flex items-center justify-center border rounded-full hover:bg-gray-100">−</button>
                  <span className="text-2xl font-medium w-8 text-center">{quantity}</span>
                  <button onClick={() => setQuantity(Math.min(selectedStock || 1, quantity + 1))} className="text-2xl w-10 h-10 flex items-center justify-center border rounded-full hover:bg-gray-100">+</button>
                </div>
              </div>

              <button
                onClick={addToReviewOrder}
                disabled={!selectedSize || !selectedColor || selectedStock <= 0}
                className="mt-10 w-full bg-black text-white py-5 rounded-full text-sm tracking-widest hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {t('product.addToReviewOrder')}
              </button>

              <div className="mt-8 grid grid-cols-3 gap-3 text-center">
                <div className="flex flex-col items-center gap-2 py-4 px-2 rounded-2xl bg-gray-50">
                  <Truck size={20} className="text-gray-500" />
                  <span className="text-xs text-gray-600 leading-tight">{t('product.deliveryAcrossEgypt1')}<br />{t('product.deliveryAcrossEgypt2')}</span>
                </div>
                <div className="flex flex-col items-center gap-2 py-4 px-2 rounded-2xl bg-gray-50">
                  <RotateCcw size={20} className="text-gray-500" />
                  <span className="text-xs text-gray-600 leading-tight">{t('product.easyReturns1')}<br />{t('product.easyReturns2')}</span>
                </div>
                <div className="flex flex-col items-center gap-2 py-4 px-2 rounded-2xl bg-gray-50">
                  <ShieldCheck size={20} className="text-gray-500" />
                  <span className="text-xs text-gray-600 leading-tight">{t('product.secureCheckout1')}<br />{t('product.secureCheckout2')}</span>
                </div>
              </div>

              <div className="mt-12 md:mt-16 border-t pt-10 md:pt-12">
                <h2 className="text-xl md:text-2xl font-light mb-6 md:mb-8">Ratings & Reviews</h2>

                <div className="bg-white p-6 md:p-8 rounded-3xl border mb-8">
                  <p className="font-medium mb-4">How would you rate this product?</p>
                  <div className="flex gap-2 mb-4">{renderStars(userRating, true, setUserRating)}</div>
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
                      <button onClick={submitReview} disabled={submitting} className="mt-4 bg-black text-white px-8 py-3 rounded-full hover:bg-gray-800 disabled:opacity-70 text-sm">
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
                            <span className="text-xs text-gray-400">{new Date(review.created_at).toLocaleDateString()}</span>
                          </div>
                          <p className="font-medium text-sm">{review.user_id ? 'Verified User' : 'Anonymous'}</p>
                          {review.review_text && <p className="mt-2 text-gray-600 text-sm leading-relaxed">{review.review_text}</p>}
                        </div>
                      ))}
                      {reviews.length > 3 && (
                        <button onClick={() => setShowAllReviews(!showAllReviews)} className="w-full py-4 border border-gray-200 rounded-2xl text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition flex items-center justify-center gap-2">
                          {showAllReviews ? 'Show Less' : `See All ${reviews.length} Reviews`}
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

      {lightboxOpen && (
        <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center px-4" onClick={() => { setLightboxOpen(false); setLightboxZoomed(false); }}>
          <button onClick={(e) => { e.stopPropagation(); setLightboxOpen(false); setLightboxZoomed(false); }} className="absolute top-6 right-6 text-white/80 hover:text-white z-10" aria-label="Close">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
          <div className="relative max-h-[90vh] max-w-[90vw] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <img
              src={images[displayIndex]}
              alt={product.name}
              onClick={(e) => {
                if (lightboxZoomed) { setLightboxZoomed(false); return; }
                const rect = e.currentTarget.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                setLightboxZoomOrigin({ x, y });
                setLightboxZoomed(true);
              }}
              className={`max-h-[90vh] max-w-[90vw] object-contain rounded-xl transition-transform duration-300 ${lightboxZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
              style={lightboxZoomed ? { transform: `scale(${LIGHTBOX_ZOOM_SCALE})`, transformOrigin: `${lightboxZoomOrigin.x}% ${lightboxZoomOrigin.y}%` } : undefined}
            />
          </div>
          {!lightboxZoomed && <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/60 text-xs pointer-events-none">Click image to zoom in</p>}
        </div>
      )}
    </>
  );
}