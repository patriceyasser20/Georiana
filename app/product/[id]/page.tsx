'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { supabaseClient } from '../../../lib/supabaseClient';
import { Plus, Minus } from 'lucide-react';

export default function ProductDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchProduct = async () => {
      const { data, error } = await supabaseClient
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) console.error(error);
      else setProduct(data);
      setLoading(false);
    };

    fetchProduct();
  }, [id]);

  const addToReviewOrder = () => {
    if (!selectedSize || !selectedColor) {
      alert('Please select size and color');
      return;
    }

    const newItem = {
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_url,
      size: selectedSize,
      color: selectedColor,
      quantity: quantity,
    };

    const saved = localStorage.getItem('reviewOrder');
    const currentItems = saved ? JSON.parse(saved) : [];
    currentItems.push(newItem);
    localStorage.setItem('reviewOrder', JSON.stringify(currentItems));

    alert('Added to Review Order!');
    router.push('/review-order');
  };

  if (loading) return <p className="text-center py-20">Loading product...</p>;
  if (!product) return <p className="text-center py-20">Product not found</p>;

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12">
          {/* Image */}
          <div>
            <img 
              src={product.image_url} 
              alt={product.name} 
              className="w-full rounded-3xl shadow-lg" 
            />
          </div>

          {/* Details */}
          <div>
            <h1 className="text-4xl font-light tracking-widest mb-4">{product.name}</h1>
            <p className="text-3xl font-medium">EGP {product.price}</p>

            <div className="mt-10">
              <p className="font-medium mb-3">Select Size</p>
              <div className="flex gap-3 flex-wrap">
                {(product.sizes || []).map((size: string) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-6 py-3 border rounded-full text-sm transition ${
                      selectedSize === size ? 'bg-black text-white' : 'hover:bg-gray-100'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8">
              <p className="font-medium mb-3">Select Color</p>
              <div className="flex gap-3 flex-wrap">
                {(product.colors || []).map((color: string) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`px-6 py-3 border rounded-full text-sm transition ${
                      selectedColor === color ? 'bg-black text-white' : 'hover:bg-gray-100'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-10">
              <p className="font-medium mb-3">Quantity</p>
              <div className="flex items-center gap-6">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))} 
                  className="text-2xl w-10 h-10 flex items-center justify-center border rounded-full hover:bg-gray-100"
                >
                  −
                </button>
                <span className="text-2xl font-medium w-8 text-center">{quantity}</span>
                <button 
                  onClick={() => setQuantity(quantity + 1)} 
                  className="text-2xl w-10 h-10 flex items-center justify-center border rounded-full hover:bg-gray-100"
                >
                  +
                </button>
              </div>
            </div>

            <button
              onClick={addToReviewOrder}
              className="mt-12 w-full bg-black text-white py-5 rounded-full text-sm tracking-widest hover:bg-gray-800 transition"
            >
              ADD TO REVIEW ORDER
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}