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

  const [tab, setTab] = useState<'products' | 'orders' | 'shipping' | 'sku-search'>('products');
  const [skuSearchTerm, setSkuSearchTerm] = useState('');
  const [skuSearchResult, setSkuSearchResult] = useState<any>(null);
  const [searching, setSearching] = useState(false);

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
    category: 'Uncategorized',
    images: [] as File[],
  });

  // Dynamic variants (Color + Size + Stock + SKU)
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
    setVariants([...variants, { color: '', size: '', stock: 0, sku: '' }]);
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
    if (
      !form.name ||
      !form.price ||
      form.images.length === 0 ||
      variants.length === 0 ||
      variants.some((v) => !v.color?.trim() || !v.size?.trim() || !v.sku?.trim())
    ) {
      alert('Name, price, images, and for each variant: color, size, SKU are required');
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

      const { data: newProduct, error: insertError } = await supabaseClient
        .from('products')
        .insert({
          name: form.name,
          price: Number(form.price),
          description: form.description,
          category: form.category,
          images: imageUrls,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      if (!newProduct) throw new Error('Product was not created');

      const variantData = variants.map((v) => ({
        product_id: newProduct.id,
        color: v.color.trim(),
        size: v.size.trim(),
        stock: Number(v.stock),
        sku: v.sku.trim(),
      }));

      const { error: variantsError } = await supabaseClient
        .from('product_variants')
        .insert(variantData);

      if (variantsError) throw variantsError;

      alert('✅ Product + SKUs + Category added!');
      setShowAddModal(false);
      setForm({ name: '', price: '', description: '', category: 'Uncategorized', images: [] });
      setVariants([]);
      loadData();
    } catch (err: any) {
      console.error('Add product error:', err);
      alert('Failed to add product: ' + (err?.message || err));
    }

    setUploading(false);
  };

  const deleteProduct = async (id: string) => {
    try {
      await supabaseClient.from('product_variants').delete().eq('product_id', id);
      await supabaseClient.from('wishlist').delete().eq('product_id', id);

      const { error } = await supabaseClient.from('products').delete().eq('id', id);
      if (error) throw error;

      alert('✅ Product deleted successfully');
      loadData();
    } catch (err: any) {
      alert('Failed to delete: ' + err.message);
    }
  };

  const toggleCountry = async (code: string, currentEnabled: boolean) => {
    await supabaseClient
      .from('supported_countries')
      .update({ enabled: !currentEnabled })
      .eq('code', code);
    loadData();
  };

  const searchBySku = async () => {
    if (!skuSearchTerm.trim()) return;

    setSearching(true);
    setSkuSearchResult(null);

    const { data, error } = await supabaseClient
      .from('product_variants')
      .select(`
        *,
        products (
          name,
          price,
          description,
          images
        )
      `)
      .eq('sku', skuSearchTerm.trim())
      .single();

    if (error || !data) {
      alert('No variant found with this SKU');
      setSkuSearchResult(null);
    } else {
      setSkuSearchResult(data);
    }

    setSearching(false);
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-5xl font-light tracking-widest mb-10">Admin Panel</h1>

          <div className="flex gap-4 mb-8 border-b pb-4 flex-wrap">
            <button onClick={() => setTab('products')} className={`px-8 py-3 rounded-full ${tab === 'products' ? 'bg-black text-white' : 'bg-white border'}`}>Products</button>
            <button onClick={() => setTab('orders')} className={`px-8 py-3 rounded-full ${tab === 'orders' ? 'bg-black text-white' : 'bg-white border'}`}>Orders</button>
            <button onClick={() => setTab('shipping')} className={`px-8 py-3 rounded-full ${tab === 'shipping' ? 'bg-black text-white' : 'bg-white border'}`}>Shipping Countries</button>
            <button onClick={() => setTab('sku-search')} className={`px-8 py-3 rounded-full ${tab === 'sku-search' ? 'bg-black text-white' : 'bg-white border'}`}>SKU Search</button>
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
                  {products.map((p) => (
                    <div key={p.id} className="bg-white rounded-3xl overflow-hidden border">
                      {p.images && p.images.length > 0 && (
                        <img src={p.images[0]} alt={p.name} className="w-full h-64 object-cover" />
                      )}
                      <div className="p-6">
                        <h3 className="font-medium text-lg mb-1">{p.name}</h3>
                        <p className="text-2xl font-medium">{formatPrice(p.price)}</p>
                        
                        {/* NEW: Show Category */}
                        <p className="text-sm text-gray-500 mt-1">
                          Category: <span className="font-medium text-black">{p.category || 'Uncategorized'}</span>
                        </p>
                        
                        <p className="text-sm text-gray-500 mt-1">Stock managed per variant</p>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Delete "${p.name}" permanently?`)) {
                              deleteProduct(p.id);
                            }
                          }}
                          className="mt-6 w-full text-red-600 hover:text-red-700 text-sm font-medium py-2 border border-red-200 hover:border-red-400 rounded-xl transition"
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
                orders.map((order) => (
                  <div key={order.id} className="bg-white rounded-3xl p-8 border">
                    <div className="flex justify-between mb-6">
                      <div>
                        <p className="text-sm text-gray-500">Order #{order.id.slice(0, 8)}...</p>
                        <p className="font-medium">{order.user_email || 'Guest'}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(order.created_at).toLocaleString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            timeZoneName: 'short',
                          })}
                        </p>
                      </div>
                      <span
                        className={`px-6 py-2 rounded-full text-sm font-medium ${
                          (order.payment_method || '').toLowerCase().includes('cash') ||
                          (order.payment_method || '').toLowerCase().includes('delivery')
                            ? 'bg-green-100 text-green-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {order.payment_method || 'Credit / Debit Card'}
                      </span>
                    </div>

                    <div className="mb-8 bg-gray-50 p-6 rounded-2xl">
                      <p className="font-medium mb-2">📍 Shipping Address</p>
                      <p>{order.street || '—'}</p>
                      <p>
                        {order.apartment && `${order.apartment}, `}
                        {order.city}, {order.governorate}
                      </p>
                    </div>

                    <p className="font-medium mb-4">Ordered Items:</p>
                    {order.order_items?.map((item: any, i: number) => (
                      <div key={i} className="flex items-center gap-4 py-4 border-b last:border-b-0">
                        {item.image_url && (
                          <img
                            src={item.image_url}
                            alt={item.product_name}
                            className="w-16 h-16 object-cover rounded-xl shrink-0"
                          />
                        )}
                        <div className="flex-1">
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
                {supportedCountries.map((country) => (
                  <div
                    key={country.code}
                    onClick={() => toggleCountry(country.code, country.enabled)}
                    className={`flex items-center gap-4 p-5 border rounded-2xl cursor-pointer transition ${
                      country.enabled ? 'border-black bg-green-50' : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${
                        country.enabled ? 'border-green-600 bg-green-600' : 'border-gray-400'
                      }`}
                    >
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

          {/* SKU SEARCH TAB */}
          {tab === 'sku-search' && !loading && (
            <div>
              <h2 className="text-3xl font-light mb-8">SKU Search</h2>
              <p className="text-gray-600 mb-6">Enter the exact SKU to find the product + variant:</p>

              <div className="max-w-lg flex gap-3">
                <input
                  type="text"
                  placeholder="GM-DR-25S-001-BLK-M"
                  value={skuSearchTerm}
                  onChange={(e) => setSkuSearchTerm(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && searchBySku()}
                  className="border rounded-2xl px-5 py-4 flex-1 text-lg font-mono tracking-widest uppercase"
                />
                <button
                  onClick={searchBySku}
                  disabled={searching || !skuSearchTerm.trim()}
                  className="bg-black text-white px-10 rounded-2xl hover:bg-gray-800 disabled:opacity-50"
                >
                  {searching ? 'Searching...' : 'Search'}
                </button>
              </div>

              {skuSearchResult && (
                <div className="mt-12 bg-white rounded-3xl p-8 border max-w-2xl">
                  {skuSearchResult.products?.images?.[0] && (
                    <img
                      src={skuSearchResult.products.images[0]}
                      alt={skuSearchResult.products.name}
                      className="w-full h-80 object-cover rounded-2xl"
                    />
                  )}
                  <div className="mt-8">
                    <div className="flex items-baseline gap-3">
                      <span className="text-sm text-gray-500">SKU</span>
                      <span className="font-mono text-4xl tracking-[4px] font-medium">
                        {skuSearchResult.sku}
                      </span>
                    </div>
                    <h3 className="text-3xl font-medium mt-2">{skuSearchResult.products?.name}</h3>
                    <p className="text-3xl font-medium text-black mt-1">
                      {formatPrice(skuSearchResult.products?.price)}
                    </p>

                    <div className="grid grid-cols-3 gap-6 mt-8 text-sm">
                      <div>
                        <p className="text-gray-500">Color</p>
                        <p className="font-medium text-lg">{skuSearchResult.color}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Size</p>
                        <p className="font-medium text-lg">{skuSearchResult.size}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Stock</p>
                        <p className="font-medium text-lg">{skuSearchResult.stock}</p>
                      </div>
                    </div>

                    {skuSearchResult.products?.description && (
                      <p className="mt-8 text-gray-600 border-t pt-8">
                        {skuSearchResult.products.description}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {!skuSearchResult && skuSearchTerm && !searching && (
                <p className="mt-8 text-red-600 text-lg">No variant found with this SKU.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl w-full max-w-6xl p-12 relative max-h-[92vh] overflow-y-auto">
            <button onClick={() => setShowAddModal(false)} className="absolute top-8 right-8">
              <X size={28} />
            </button>

            <h2 className="text-3xl font-light mb-10">Add New Product</h2>

            <div className="space-y-8">
              <input
                type="text"
                placeholder="Product Name *"
                className="border rounded-2xl px-6 py-5 w-full text-lg"
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />

              {/* NEW: Category Dropdown */}
              <div>
                <label className="block text-sm mb-3 font-medium">Category *</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="border rounded-2xl px-6 py-5 w-full text-lg bg-white"
                >
                  <option value="Uncategorized">Select Category</option>
                  <option value="T-Shirts">T-Shirts</option>
                  <option value="Hoodies">Hoodies</option>
                  <option value="Jeans">Jeans</option>
                  <option value="Shoes">Shoes</option>
                  <option value="Dresses">Dresses</option>
                  <option value="Accessories">Accessories</option>
                  <option value="Jackets">Jackets</option>
                  <option value="Pants">Pants</option>
                </select>
              </div>

              <input
                type="number"
                step="0.01"
                placeholder="Price *"
                className="border rounded-2xl px-6 py-5 w-full text-lg"
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />

              <textarea
                placeholder="Description"
                className="border rounded-2xl px-6 py-5 w-full h-32 text-lg"
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />

              <div>
                <label className="block text-sm mb-3 font-medium">Product Images * (multiple allowed)</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => setForm({ ...form, images: Array.from(e.target.files || []) })}
                  className="border rounded-2xl px-6 py-5 w-full text-lg"
                />
              </div>

              {/* Variants Section */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <label className="block text-lg font-medium">Variants (Color + Size + Stock + SKU)</label>
                  <button
                    onClick={addVariant}
                    className="text-sm bg-black text-white px-6 py-2.5 rounded-2xl flex items-center gap-2 hover:bg-gray-800"
                  >
                    <Plus size={18} /> Add Variant
                  </button>
                </div>

                {variants.map((variant, index) => (
                  <div key={index} className="flex flex-wrap gap-4 mb-6 items-end border p-6 rounded-3xl bg-gray-50">
                    <input
                      type="text"
                      placeholder="Color (e.g. Black)"
                      value={variant.color}
                      onChange={(e) => updateVariant(index, 'color', e.target.value)}
                      className="border rounded-2xl px-6 py-5 flex-1 min-w-[160px] text-lg"
                    />
                    <input
                      type="text"
                      placeholder="SKU (e.g. GM-DR-25S-001-BLK-M)"
                      value={variant.sku || ''}
                      onChange={(e) => updateVariant(index, 'sku', e.target.value.toUpperCase())}
                      className="border rounded-2xl px-6 py-5 flex-2 min-w-[100px] font-mono tracking-widest text-lg uppercase"
                    />
                    <input
                      type="text"
                      placeholder="Size"
                      value={variant.size}
                      onChange={(e) => updateVariant(index, 'size', e.target.value)}
                      className="border rounded-2xl px-6 py-5 w-28 text-lg"
                    />
                    <input
                      type="number"
                      placeholder="Stock"
                      value={variant.stock}
                      onChange={(e) => updateVariant(index, 'stock', e.target.value)}
                      className="border rounded-2xl px-6 py-5 w-32 text-lg"
                    />
                    <button onClick={() => removeVariant(index)} className="text-red-600 hover:text-red-700 p-3">
                      <Trash2 size={24} />
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={addProduct}
                disabled={uploading}
                className="w-full bg-black text-white py-5 rounded-2xl text-lg tracking-widest hover:bg-gray-800 disabled:opacity-70"
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