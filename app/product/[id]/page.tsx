'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { supabaseClient } from '../../../lib/supabaseClient';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { useCurrency } from '../../context/CurrencyContext';

export default function ProductDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const { formatPrice } = useCurrency();

  const [product, setProduct] = useState<any>(null);
  const [variants, setVariants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const fetchProductAndVariants = async () => {
      const { data: productData } = await supabaseClient
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      const { data: variantData } = await supabaseClient
        .from('product_variants')
        .select('*')
        .eq('product_id', id);

      setProduct(productData);
      setVariants(variantData || []);
      setLoading(false);
    };

    fetchProductAndVariants();
  }, [id]);

  const images = product?.images && product.images.length > 0 
    ? product.images 
    : (product?.image_url ? [product.image_url] : []);

  // All unique colors and sizes
  const allColors = [...new Set(variants.map(v => v.color))];
  const allSizes = [...new Set(variants.map(v => v.size))];

  // Get current stock for specific color + size
  const getStock = (color: string, size: string) => {
    const variant = variants.find(v => v.color === color && v.size === size);
    return variant ? variant.stock : 0;
  };

  // Colors that have at least one size with stock
  const availableColors = [...new Set(
    variants.filter(v => v.stock > 0).map(v => v.color)
  )];

  // Sizes available for the selected color
  const availableSizes = selectedColor 
    ? [...new Set(
        variants
          .filter(v => v.color === selectedColor && v.stock > 0)
          .map(v => v.size)
      )]
    : [];

  // Stock for currently selected combination
  const selectedStock = getStock(selectedColor, selectedSize);

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
      price: product.price,
      image_url: images[currentImageIndex] || '',
      size: selectedSize,
      color: selectedColor,
      quantity: quantity,
    };

    const saved = localStorage.getItem('reviewOrder');
    const currentItems = saved ? JSON.parse(saved) : [];
    currentItems.push(newItem);
    localStorage.setItem('reviewOrder', JSON.stringify(currentItems));

    // Decrease stock in database
    await supabaseClient
      .from('product_variants')
      .update({ stock: stock - quantity })
      .eq('product_id', product.id)
      .eq('color', selectedColor)
      .eq('size', selectedSize);

    alert(t('product.addedToReviewOrder'));
    router.push('/review-order');
  };

  if (loading) return <p className="text-center py-20">{t('common.loading')}</p>;
  if (!product) return <p className="text-center py-20">{t('common.notFound')}</p>;

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-12">
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

            {images.length > 1 && (
              <>
                <button 
                  onClick={() => setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-3 rounded-full shadow transition"
                >
                  <ChevronLeft size={28} />
                </button>

                <button 
                  onClick={() => setCurrentImageIndex((prev) => (prev + 1) % images.length)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-3 rounded-full shadow transition"
                >
                  <ChevronRight size={28} />
                </button>
              </>
            )}
          </div>

          {/* Details */}
          <div>
            <h1 className="text-4xl font-light tracking-widest mb-4">{product.name}</h1>
            <p className="text-3xl font-medium">{formatPrice(product.price)}</p>

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
          </div>
        </div>
      </div>
    </>
  );
}