'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { supabaseClient } from '../../lib/supabaseClient';
import { RefreshCw, X, Plus, Trash2, Check } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';

export default function AdminPanel() {
  const router = useRouter();
  const { formatPrice } = useCurrency();

  const [tab, setTab] = useState<'products' | 'orders' | 'shipping'>('products');
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [supportedCountries, setSupportedCountries] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  // Product form
  const [form, setForm] = useState({
    name: '',
    price: '',
    description: '',
    images: [] as File[],
  });

  // Dynamic variants (Color + Size + Stock)
  const [variants, setVariants] = useState<any[]>([]);

  useEffect(() => {
    if (localStorage.getItem('isAdmin') !== 'true') {
      router.push('/admin/login');
      return;
    }
    loadData();
  }, [router]);

  const loadData = async () => {
    setLoading(true);

    const [productsRes, ordersRes, countriesRes] = await Promise.all([
      supabaseClient.from('products').select('*'),
      supabaseClient.from('orders').select(`
        *,
        order_items (
          product_name,
          size,
          color,
          quantity,
          price,
          image_url
        )
      `).order('created_at', { ascending: false }),
      supabaseClient.from('supported_countries').select('*').order('name')
    ]);

    setProducts(productsRes.data || []);
    setOrders(ordersRes.data || []);
    setSupportedCountries(countriesRes.data || []);
    setLoading(false);
  };

  const addVariant = () => {
    setVariants([...variants, { color: '', size: '', stock: 0 }]);
  };

  const updateVariant = (index: number, field: string, value: any) => {
    const newVariants = [...variants];
    newVariants[index][field] = value;
    setVariants(newVariants);
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const addProduct = async () => {
    if (!form.name || !form.price || form.images.length === 0 || variants.length === 0) {
      alert('Name, price, at least one image, and at least one variant are required');
      return;
    }

    setUploading(true);

    try {
      const imageUrls: string[] = [];

      for (const file of form.images) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

        const { error: uploadError } = await supabaseClient.storage
          .from('product-images')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabaseClient.storage
          .from('product-images')
          .getPublicUrl(fileName);

        imageUrls.push(urlData.publicUrl);
      }

      const { data: newProduct } = await supabaseClient
        .from('products')
        .insert({
          name: form.name,
          price: Number(form.price),
          description: form.description,
          images: imageUrls,
        })
        .select()
        .single();

      // Insert all variants
      const variantData = variants.map(v => ({
        product_id: newProduct.id,
        color: v.color,
        size: v.size,
        stock: Number(v.stock),
      }));

      await supabaseClient.from('product_variants').insert(variantData);

      alert('✅ Product added with variants!');
      setShowAddModal(false);
      setForm({ name: '', price: '', description: '', images: [] });
      setVariants([]);
      loadData();
    } catch (err: any) {
      alert('Upload failed: ' + (err.message || err));
    }

    setUploading(false);
  };

  const deleteProduct = async (id: string) => {
    if (confirm('Delete this product?')) {
      await supabaseClient.from('products').delete().eq('id', id);
      loadData();
    }
  };

  const toggleCountry = async (code: string, currentEnabled: boolean) => {
    await supabaseClient
      .from('supported_countries')
      .update({ enabled: !currentEnabled })
      .eq('code', code);
    loadData();
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-5xl font-light tracking-widest mb-10">Admin Panel</h1>

          <div className="flex gap-4 mb-8 border-b pb-4">
            <button onClick={() => setTab('products')} className={`px-8 py-3 rounded-full ${tab === 'products' ? 'bg-black text-white' : 'bg-white border'}`}>Products</button>
            <button onClick={() => setTab('orders')} className={`px-8 py-3 rounded-full ${tab === 'orders' ? 'bg-black text-white' : 'bg-white border'}`}>Orders</button>
            <button onClick={() => setTab('shipping')} className={`px-8 py-3 rounded-full ${tab === 'shipping' ? 'bg-black text-white' : 'bg-white border'}`}>Shipping Countries</button>
          </div>

          {loading && <p className="text-center py-20">Loading...</p>}

          {/* PRODUCTS TAB */}
          {tab === 'products' && !loading && (
            <div>
              <button 
                onClick={() => setShowAddModal(true)}
                className="mb-8 bg-black text-white px-8 py-4 rounded-full flex items-center gap-2 hover:bg-gray-800"
              >
                + Add New Product
              </button>

              {products.length === 0 ? (
                <p className="text-center py-20 text-xl text-gray-500">No products yet. Add your first product.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map(p => (
                    <div key={p.id} className="bg-white rounded-3xl overflow-hidden border">
                      {p.images && p.images.length > 0 && (
                        <img src={p.images[0]} alt={p.name} className="w-full h-64 object-cover" />
                      )}
                      <div className="p-6">
                        <h3 className="font-medium text-lg mb-1">{p.name}</h3>
                        <p className="text-2xl font-medium">{formatPrice(p.price)}</p>
                        <button 
                          onClick={() => deleteProduct(p.id)}
                          className="mt-6 text-red-600 hover:text-red-700 text-sm font-medium"
                        >
                          Delete Product
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ORDERS TAB */}
          {tab === 'orders' && !loading && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-light">All Orders</h2>
                <button 
                  onClick={loadData}
                  className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-full hover:bg-gray-800 transition"
                >
                  <RefreshCw size={18} />
                  Refresh Orders
                </button>
              </div>

              {orders.length === 0 ? (
                <p className="text-center py-20 text-xl text-gray-500">No orders yet</p>
              ) : (
                orders.map(order => (
                  <div key={order.id} className="bg-white rounded-3xl p-8 border">
                    <div className="flex justify-between mb-6">
                      <div>
                        <p className="text-sm text-gray-500">Order #{order.id.slice(0,8)}...</p>
                        <p className="font-medium">{order.user_email || 'Guest'}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(order.created_at).toLocaleString()}
                        </p>
                      </div>
                      <span className={`px-6 py-2 rounded-full text-sm font-medium ${
                        (order.payment_method || '').toLowerCase().includes('cash') ||
                        (order.payment_method || '').toLowerCase().includes('delivery')
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {order.payment_method || 'Credit / Debit Card'}
                      </span>
                    </div>

                    <div className="mb-8 bg-gray-50 p-6 rounded-2xl">
                      <p className="font-medium mb-2">📍 Shipping Address</p>
                      <p>{order.street || '—'}</p>
                      <p>{order.apartment && `${order.apartment}, `}{order.city}, {order.governorate}</p>
                    </div>

                    <p className="font-medium mb-4">Ordered Items:</p>
                    {order.order_items?.map((item: any, i: number) => (
                      <div key={i} className="flex justify-between py-4 border-b last:border-b-0">
                        <div>
                          <p className="font-medium">{item.product_name}</p>
                          <p className="text-sm text-gray-500">
                            Size: {item.size} • Color: {item.color} • Qty: {item.quantity}
                          </p>
                        </div>
                        <p className="font-medium">{formatPrice(item.price)}</p>
                      </div>
                    ))}

                    <div className="mt-10 flex justify-between text-2xl font-medium border-t pt-8">
                      <span>Total</span>
                      <span>{formatPrice(order.total)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* SHIPPING COUNTRIES TAB */}
          {tab === 'shipping' && !loading && (
            <div>
              <h2 className="text-3xl font-light mb-8">Shipping Countries</h2>
              <p className="text-gray-600 mb-6">Select the countries you want to sell and ship to:</p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {supportedCountries.map(country => (
                  <div 
                    key={country.code}
                    onClick={() => toggleCountry(country.code, country.enabled)}
                    className={`flex items-center gap-4 p-5 border rounded-2xl cursor-pointer transition ${
                      country.enabled ? 'border-black bg-green-50' : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${country.enabled ? 'border-green-600 bg-green-600' : 'border-gray-400'}`}>
                      {country.enabled && <Check size={16} className="text-white" />}
                    </div>
                    <div>
                      <p className="font-medium">{country.name}</p>
                      <p className="text-xs text-gray-500">{country.code}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Product Modal with Variants */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl w-full max-w-2xl p-10 relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowAddModal(false)} className="absolute top-6 right-6">
              <X size={28} />
            </button>

            <h2 className="text-3xl font-light mb-8">Add New Product</h2>

            <div className="space-y-6">
              <input type="text" placeholder="Product Name *" className="border rounded-2xl px-5 py-4 w-full" onChange={e => setForm({...form, name: e.target.value})} />
              <input type="number" placeholder="Price *" className="border rounded-2xl px-5 py-4 w-full" onChange={e => setForm({...form, price: e.target.value})} />
              <textarea placeholder="Description" className="border rounded-2xl px-5 py-4 w-full h-24" onChange={e => setForm({...form, description: e.target.value})} />

              <div>
                <label className="block text-sm mb-2">Product Images * (multiple allowed)</label>
                <input 
                  type="file" 
                  accept="image/*"
                  multiple
                  onChange={e => setForm({...form, images: Array.from(e.target.files || [])})}
                  className="border rounded-2xl px-5 py-4 w-full" 
                />
              </div>

              {/* Variants Section */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-medium">Variants (Color + Size + Stock)</label>
                  <button onClick={addVariant} className="text-sm bg-black text-white px-4 py-1 rounded-full flex items-center gap-1">
                    <Plus size={16} /> Add Variant
                  </button>
                </div>

                {variants.map((variant, index) => (
                  <div key={index} className="flex gap-3 mb-4 items-end border p-4 rounded-2xl">
                    <input 
                      type="text" 
                      placeholder="Color (e.g. Black)" 
                      value={variant.color}
                      onChange={(e) => updateVariant(index, 'color', e.target.value)}
                      className="border rounded-2xl px-5 py-4 flex-1"
                    />
                    <input 
                      type="text" 
                      placeholder="Size (e.g. M)" 
                      value={variant.size}
                      onChange={(e) => updateVariant(index, 'size', e.target.value)}
                      className="border rounded-2xl px-5 py-4 w-24"
                    />
                    <input 
                      type="number" 
                      placeholder="Stock" 
                      value={variant.stock}
                      onChange={(e) => updateVariant(index, 'stock', e.target.value)}
                      className="border rounded-2xl px-5 py-4 w-28"
                    />
                    <button onClick={() => removeVariant(index)} className="text-red-600">
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))}
              </div>

              <button 
                onClick={addProduct}
                disabled={uploading}
                className="w-full bg-black text-white py-4 rounded-full text-sm tracking-widest hover:bg-gray-800 disabled:opacity-70"
              >
                {uploading ? 'Uploading...' : 'Add Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}