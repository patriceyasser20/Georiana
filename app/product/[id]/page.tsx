'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { supabaseClient } from '../../../lib/supabaseClient';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
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

  // Rating form state
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
        const hasReviewed = reviewData.some((r: any) => r.user_id === user.id);
        setUserHasReviewed(hasReviewed);
      }

      setLoading(false);
    };

    fetchAll();
  }, [id]);

  // ==================== SALE LOGIC ====================
  const isOnSale = product?.is_on_sale === true;
  const discount = product?.discount_percentage || 0;
  const originalPrice = Number(product?.price || 0);
  const salePrice = isOnSale && discount > 0 
    ? originalPrice * (1 - discount / 100) 
    : originalPrice;

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

  const availableColors = [...new Set(variants.filter(v => v.stock > 0).map(v => v.color))];
  const availableSizes = selectedColor 
    ? [...new Set(variants.filter(v => v.color === selectedColor && v.stock > 0).map(v => v.size))]
    : [];

  const selectedStock = getStock(selectedColor, selectedSize);

  // ==================== ADD TO REVIEW ORDER (uses sale price) ====================
  const addToReviewOrder = async () => {
    if (!selectedSize || !selectedColor) {
      alert(t('product.selectSize') + ' & ' + t('product.selectColor'));
      return;
    }

    const stock = getStock(selectedColor, selectedSize);
    if (stock <= 0) {
      alert(t('product.outOfStock'));
      return;
    }

    if (quantity > stock) {
      alert(t('product.onlyXAvailable').replace('{stock}', stock));
      return;
    }

    const newItem = {
      id: product.id,
      name: product.name,
      price: isOnSale ? salePrice : originalPrice,   // ← Use sale price in cart
      image_url: images[currentImageIndex] || '',
      size: selectedSize,
      color: selectedColor,
      quantity: quantity,
    };

    const saved = localStorage.getItem('reviewOrder');
    const currentItems = saved ? JSON.parse(saved) : [];
    currentItems.push(newItem);
    localStorage.setItem('reviewOrder', JSON.stringify(currentItems));

    await supabaseClient
      .from('product_variants')
      .update({ stock: stock - quantity })
      .eq('product_id', product.id)
      .eq('color', selectedColor)
      .eq('size', selectedSize);

    alert(t('product.addedToReviewOrder'));
    router.push('/review-order');
  };

  // ==================== REVIEWS (unchanged) ====================
  const submitReview = async () => {
    if (userRating === 0) {
      alert("Please select a rating");
      return;
    }

    if (userHasReviewed) {
      alert("You have already reviewed this product.");
      return;
    }

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
      console.error("Review error:", err);
      alert("Failed to submit review: " + (err.message || err));
    }

    setSubmitting(false);
  };

  const renderStars = (rating: number, interactive = false, onClick?: (star: number) => void) => {
    return Array.from({ length: 5 }, (_, i) => {
      const starValue = i + 1;
      return (
        <Star
          key={i}
          size={interactive ? 32 : 20}
          className={`cursor-pointer transition-colors ${
            starValue <= rating 
              ? 'text-yellow-400 fill-yellow-400' 
              : 'text-gray-300'
          }`}
          onClick={() => interactive && onClick && onClick(starValue)}
        />
      );
    });
  };

  if (loading) return <p className="text-center py-20">{t('common.loading')}</p>;
  if (!product) return <p className="text-center py-20">{t('common.notFound')}</p>;

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-22">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12">
          
          {/* Image Gallery */}
          <div className="relative overflow-hidden rounded-3xl bg-gray-100 group">
            {images.length > 0 && (
              <img 
                src={images[currentImageIndex]} 
                alt={product.name} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
              />
            )}
          </div>

          {/* Details */}
          <div>
            <h1 className="text-4xl font-light tracking-widest mb-4">{product.name}</h1>

            {/* ==================== PRICE WITH DISCOUNT ==================== */}
            <div className="flex items-baseline gap-4 mt-2">
              {isOnSale && discount > 0 ? (
                <>
                  <span className="text-3xl font-medium line-through text-gray-400">
                    {formatPrice(originalPrice)}
                  </span>
                  <span className="text-4xl font-bold text-red-600">
                    {formatPrice(salePrice)}
                  </span>
                  <span className="bg-red-600 text-white text-sm font-bold px-4 py-1 rounded-full">
                    -{discount}%
                  </span>
                </>
              ) : (
                <span className="text-4xl font-bold">{formatPrice(originalPrice)}</span>
              )}
            </div>

            {/* Average Rating */}
            <div className="flex items-center gap-3 mt-6">
              <div className="flex">{renderStars(Math.round(averageRating))}</div>
              <span className="text-2xl font-medium">{averageRating}</span>
              <span className="text-gray-500">({totalReviews} reviews)</span>
            </div>

            {/* Description */}
            {product.description && (
              <div className="mt-8 text-gray-600 leading-relaxed text-[15px] border-t pt-8">
                {product.description}
              </div>
            )}

            {/* Color Selection */}
            <div className="mt-10">
              <p className="font-medium mb-3">{t('product.selectColor')}</p>
              <div className="flex gap-3 flex-wrap">
                {allColors.map((color: string) => {
                  const hasStock = variants.some(v => v.color === color && v.stock > 0);
                  return (
                    <button
                      key={color}
                      onClick={() => {
                        setSelectedColor(color);
                        setSelectedSize('');
                        setQuantity(1);
                      }}
                      disabled={!hasStock}
                      className={`px-6 py-3 border rounded-full text-sm transition ${
                        selectedColor === color ? 'bg-black text-white' : 'hover:bg-gray-100'
                      } ${!hasStock ? 'opacity-50 line-through cursor-not-allowed' : ''}`}
                    >
                      {color}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Size Selection */}
            <div className="mt-8">
              <p className="font-medium mb-3">{t('product.selectSize')}</p>
              <div className="flex gap-3 flex-wrap">
                {allSizes.map((size: string) => {
                  const stock = getStock(selectedColor, size);
                  return (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      disabled={!selectedColor || stock === 0}
                      className={`px-6 py-3 border rounded-full text-sm transition ${
                        selectedSize === size ? 'bg-black text-white' : 'hover:bg-gray-100'
                      } ${stock === 0 ? 'opacity-50 line-through cursor-not-allowed' : ''}`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quantity */}
            <div className="mt-10">
              <p className="font-medium mb-3">{t('product.quantity')}</p>
              <div className="flex items-center gap-6">
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

            <button
              onClick={addToReviewOrder}
              disabled={!selectedSize || !selectedColor || selectedStock <= 0}
              className="mt-12 w-full bg-black text-white py-5 rounded-full text-sm tracking-widest hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {t('product.addToReviewOrder')}
            </button>

            {/* Ratings & Reviews Section */}
            <div className="mt-16 border-t pt-12">
              <h2 className="text-2xl font-light mb-8">Ratings & Reviews</h2>

              <div className="bg-white p-8 rounded-3xl border mb-10">
                <p className="font-medium mb-4">How would you rate this product?</p>
                
                <div className="flex gap-2 mb-6">
                  {renderStars(userRating, true, setUserRating)}
                </div>

                {userHasReviewed ? (
                  <p className="text-green-600 font-medium">✓ You have already reviewed this product</p>
                ) : userRating > 0 && (
                  <>
                    <textarea
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      placeholder="Write your review (optional)"
                      className="w-full h-24 border rounded-2xl px-5 py-4 resize-y min-h-[100px]"
                    />
                    <button
                      onClick={submitReview}
                      disabled={submitting}
                      className="mt-4 bg-black text-white px-10 py-3 rounded-full hover:bg-gray-800 disabled:opacity-70"
                    >
                      {submitting ? 'Submitting...' : 'Submit Rating & Review'}
                    </button>
                  </>
                )}
              </div>

              <div className="space-y-8">
                {reviews.length === 0 ? (
                  <p className="text-gray-500">No reviews yet. Be the first to rate!</p>
                ) : (
                  reviews.map((review: any) => (
                    <div key={review.id} className="bg-white p-6 rounded-3xl border">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex">{renderStars(review.rating)}</div>
                        <span className="text-sm text-gray-500">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="font-medium">
                        {review.user_id ? 'Verified User' : 'Anonymous'}
                      </p>
                      {review.review_text && (
                        <p className="mt-3 text-gray-600 leading-relaxed">{review.review_text}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}