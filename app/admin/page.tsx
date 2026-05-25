'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { supabaseClient } from '../../lib/supabaseClient';
import { RefreshCw, X, Plus, Trash2, Check, Edit2, User } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';

export default function AdminPanel() {
  const router = useRouter();
  const { formatPrice } = useCurrency();

  const [tab, setTab] = useState<'products' | 'orders' | 'shipping' | 'sku-search' | 'promo-codes'>('products');
  const [skuSearchTerm, setSkuSearchTerm] = useState('');
  const [skuSearchResult, setSkuSearchResult] = useState<any>(null);
  const [searching, setSearching] = useState(false);

  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [supportedCountries, setSupportedCountries] = useState<any[]>([]);
  const [promoCodes, setPromoCodes] = useState<any[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [collections, setCollections] = useState<string[]>([]);

  const [form, setForm] = useState({
    name: '',
    price: '',
    description: '',
    category: 'Uncategorized',
    collection: '',
    isOnSale: false,
    discountPercentage: '',
    images: [] as File[],
  });

  const [variants, setVariants] = useState<any[]>([]);

  const [promoForm, setPromoForm] = useState({
    code: '',
    discountPercentage: '',
    expiresAt: '',
    neverExpires: false,
  });

  useEffect(() => {
    if (localStorage.getItem('isAdmin') !== 'true') {
      router.push('/admin/login');
      return;
    }
    loadData();
  }, [router]);

  const loadData = async () => {
    setLoading(true);

    const [productsRes, ordersRes, countriesRes, promoRes] = await Promise.all([
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
      supabaseClient.from('supported_countries').select('*').order('name'),
      supabaseClient.from('promo_codes').select('*').order('created_at', { ascending: false })
    ]);

    setProducts(productsRes.data || []);
    setOrders(ordersRes.data || []);
    setSupportedCountries(countriesRes.data || []);
    setPromoCodes(promoRes.data || []);

    const uniqueCollections = [...new Set(
      (productsRes.data || []).map((p: any) => p.collection).filter(Boolean)
    )];
    setCollections(uniqueCollections);

    setLoading(false);
  };

  // ==================== DELETE COLLECTION ====================
  const deleteCollection = async (colName: string) => {
    if (!confirm(`Delete collection "${colName}"?\n\nAll products will stay, but they will no longer belong to this collection.`)) return;

    const { error } = await supabaseClient
      .from('products')
      .update({ collection: null })
      .eq('collection', colName);

    if (error) alert('Failed: ' + error.message);
    else {
      alert(`✅ Collection "${colName}" deleted. Products are kept.`);
      loadData();
    }
  };

  // ==================== PROMO CODE FUNCTIONS ====================
  const addPromoCode = async () => {
    if (!promoForm.code.trim() || !promoForm.discountPercentage) {
      alert('Code and discount percentage are required');
      return;
    }

    const expirationDate = promoForm.neverExpires ? null : promoForm.expiresAt || null;

    const { error } = await supabaseClient
      .from('promo_codes')
      .insert({
        code: promoForm.code.trim().toUpperCase(),
        discount_percentage: Number(promoForm.discountPercentage),
        expires_at: expirationDate,
      });

    if (error) alert('Error: ' + error.message);
    else {
      alert('✅ Promo code added successfully!');
      setPromoForm({ code: '', discountPercentage: '', expiresAt: '', neverExpires: false });
      loadData();
    }
  };

  const renewPromoCode = async (id: string) => {
    const newDate = prompt('Enter new expiration date (YYYY-MM-DD):');
    if (!newDate) return;

    const { error } = await supabaseClient
      .from('promo_codes')
      .update({ expires_at: newDate })
      .eq('id', id);

    if (error) alert('Error: ' + error.message);
    else loadData();
  };

  const deletePromoCode = async (id: string) => {
    if (!confirm('Delete this promo code?')) return;

    const { error } = await supabaseClient
      .from('promo_codes')
      .delete()
      .eq('id', id);

    if (error) alert('Error: ' + error.message);
    else loadData();
  };

  const addVariant = () => {
    setVariants([...variants, { color: '', size: '', stock: 0, sku: '', typeCode: '' }]);
  };

  const updateVariant = (index: number, field: string, value: any) => {
    const newVariants = [...variants];
    newVariants[index][field] = value;
    setVariants(newVariants);
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const openModal = async (product?: any) => {
    if (product) {
      setEditingProduct(product);
      setForm({
        name: product.name,
        price: product.price.toString(),
        description: product.description || '',
        category: product.category || 'Uncategorized',
        collection: product.collection || '',
        isOnSale: product.is_on_sale || false,
        discountPercentage: product.discount_percentage?.toString() || '',
        images: [] as File[],
      });

      const { data: existingVariants } = await supabaseClient
        .from('product_variants')
        .select('*')
        .eq('product_id', product.id)
        .order('sku');

      setVariants(
        (existingVariants || []).map((v: any) => ({
          id: v.id,
          color: v.color || '',
          size: v.size || '',
          stock: v.stock || 0,
          sku: v.sku || '',
          typeCode: v.type_code || ''
        }))
      );
    } else {
      setEditingProduct(null);
      setForm({
        name: '',
        price: '',
        description: '',
        category: 'Uncategorized',
        collection: '',
        isOnSale: false,
        discountPercentage: '',
        images: [] as File[],
      });
      setVariants([]);
    }
    setShowAddModal(true);
  };

  const saveProduct = async () => {
    if (
      !form.name ||
      !form.price ||
      (form.images.length === 0 && !editingProduct) ||
      variants.length === 0 ||
      variants.some((v) => !v.color?.trim() || !v.size?.trim() || !v.sku?.trim() || !v.typeCode?.trim())
    ) {
      alert('Name, price, images, and for each variant: color, size, SKU, and Type Code are required');
      return;
    }

    setUploading(true);

    try {
      const imageUrls: string[] = editingProduct?.images || [];

      if (form.images.length > 0) {
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
      }

      const productData = {
        name: form.name,
        price: Number(form.price),
        description: form.description,
        category: form.category,
        collection: form.collection || null,
        is_on_sale: form.isOnSale,
        discount_percentage: form.isOnSale ? Number(form.discountPercentage) || 0 : 0,
        images: imageUrls,
      };

      if (editingProduct) {
        const { error } = await supabaseClient
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw error;
        alert('✅ Product updated successfully!');
      } else {
        const { data: newProduct, error: insertError } = await supabaseClient
          .from('products')
          .insert(productData)
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
          type_code: v.typeCode.trim().toUpperCase()
        }));

        const { error: variantsError } = await supabaseClient
          .from('product_variants')
          .insert(variantData);

        if (variantsError) throw variantsError;
      }

      setShowAddModal(false);
      setEditingProduct(null);
      setForm({
        name: '',
        price: '',
        description: '',
        category: 'Uncategorized',
        collection: '',
        isOnSale: false,
        discountPercentage: '',
        images: []
      });
      setVariants([]);
      loadData();
    } catch (err: any) {
      console.error('Save product error:', err);
      alert('Failed to save product: ' + (err?.message || err));
    }

    setUploading(false);
  };

  const deleteProduct = async (id: string) => {
    if (!confirm(`Delete "${id}" permanently?`)) return;

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
        product_id,
        products (
          id,
          name,
          price,
          description,
          images,
          category,
          collection,
          is_on_sale,
          discount_percentage
        )
      `)
      .eq('sku', skuSearchTerm.trim().toUpperCase())
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
      <div className="min-h-screen bg-gray-50 py-20 md:py-22">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <h1 className="text-3xl md:text-5xl font-light tracking-widest mb-8">Admin Panel</h1>

          {/* Tabs — 2-col grid on mobile, single row on desktop */}
          <div className="grid grid-cols-2 md:flex md:flex-wrap gap-3 mb-8 border-b pb-4">
            <button
              onClick={() => setTab('products')}
              className={`py-3 rounded-full text-sm md:text-base md:px-8 ${tab === 'products' ? 'bg-black text-white' : 'bg-white border'}`}
            >
              Products
            </button>
            <button
              onClick={() => setTab('orders')}
              className={`py-3 rounded-full text-sm md:text-base md:px-8 ${tab === 'orders' ? 'bg-black text-white' : 'bg-white border'}`}
            >
              Orders
            </button>
            <button
              onClick={() => setTab('shipping')}
              className={`py-3 rounded-full text-sm md:text-base md:px-8 ${tab === 'shipping' ? 'bg-black text-white' : 'bg-white border'}`}
            >
              <span className="md:hidden">Shipping</span>
              <span className="hidden md:inline">Shipping Countries</span>
            </button>
            <button
              onClick={() => setTab('sku-search')}
              className={`py-3 rounded-full text-sm md:text-base md:px-8 ${tab === 'sku-search' ? 'bg-black text-white' : 'bg-white border'}`}
            >
              SKU Search
            </button>
            <button
              onClick={() => setTab('promo-codes')}
              className={`py-3 rounded-full text-sm md:text-base md:px-8 ${tab === 'promo-codes' ? 'bg-black text-white' : 'bg-white border'}`}
            >
              <span className="md:hidden">Promos</span>
              <span className="hidden md:inline">Promo Codes</span>
            </button>
          </div>

          {loading && <p className="text-center py-20">Loading...</p>}

          {/* ==================== PRODUCTS TAB ==================== */}
          {tab === 'products' && !loading && (
            <div>
              {collections.length > 0 && (
                <div className="mb-8">
                  <p className="text-sm text-gray-500 mb-3">Active Collections</p>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => setSelectedCollection(null)}
                      className={`px-5 py-2 rounded-2xl text-sm font-medium transition ${
                        selectedCollection === null ? 'bg-black text-white' : 'bg-white border hover:bg-gray-50'
                      }`}
                    >
                      All Products
                    </button>
                    {collections.map((col) => (
                      <div
                        key={col}
                        onClick={() => setSelectedCollection(col)}
                        className={`px-5 py-2 rounded-2xl text-sm font-medium flex items-center gap-2 group cursor-pointer transition ${
                          selectedCollection === col ? 'bg-black text-white' : 'bg-white border hover:bg-gray-50'
                        }`}
                      >
                        {col}
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteCollection(col); }}
                          className="text-red-500 opacity-0 group-hover:opacity-100 hover:text-red-700"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => openModal()}
                className="mb-8 bg-black text-white px-8 py-4 rounded-full flex items-center gap-2 hover:bg-gray-800"
              >
                + Add New Product
              </button>

              {products.length === 0 ? (
                <p className="text-center py-20 text-xl text-gray-500">No products yet. Add your first product.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products
                    .filter(p => selectedCollection === null || p.collection === selectedCollection)
                    .map((p) => (
                      <div key={p.id} className="bg-white rounded-3xl overflow-hidden border">
                        {p.images && p.images.length > 0 && (
                          <img src={p.images[0]} alt={p.name} className="w-full h-64 object-cover" />
                        )}
                        <div className="p-6">
                          <h3 className="font-medium text-lg mb-1">{p.name}</h3>
                          <p className="text-2xl font-medium">{formatPrice(p.price)}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            Category: <span className="font-medium text-black">{p.category || 'Uncategorized'}</span>
                          </p>
                          {p.collection && (
                            <p className="text-sm text-gray-500 mt-1">
                              Collection: <span className="font-medium text-black">{p.collection}</span>
                            </p>
                          )}
                          {p.is_on_sale && (
                            <p className="text-red-600 text-sm font-medium mt-1">On Sale • -{p.discount_percentage}%</p>
                          )}
                          <div className="mt-6 flex gap-3">
                            <button
                              onClick={() => openModal(p)}
                              className="flex-1 bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition flex items-center justify-center gap-2"
                            >
                              <Edit2 size={18} /> Edit
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Delete "${p.name}" permanently?`)) deleteProduct(p.id);
                              }}
                              className="flex-1 text-red-600 hover:text-red-700 py-3 border border-red-200 hover:border-red-400 rounded-xl transition"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* ==================== ORDERS TAB ==================== */}
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
                orders.map((order) => {
                  const isFreeShipping = !order.delivery_fee || Number(order.delivery_fee) === 0;
                  const orderTotal = Number(order.total || 0) + Number(order.delivery_fee || 0) - Number(order.discount_amount || 0);

                  return (
                    <div key={order.id} className="bg-white rounded-3xl p-8 border">

                      {/* ── Top row: order meta + badges ── */}
                      <div className="flex flex-wrap justify-between gap-4 mb-6">
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Order #{order.id.slice(0, 8)}...</p>
                          <p className="font-medium">Email: {order.user_email}</p>
                          <p className="font-medium">Phone: {order.phone || 'Not provided'}</p>
                          <p className="text-sm text-gray-500 mt-1">
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

                        <div className="flex flex-wrap gap-2 items-start">
                          {/* Registered vs Guest */}
                          <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                            order.user_id
                              ? 'bg-green-100 text-green-700'
                              : 'bg-orange-100 text-orange-700'
                          }`}>
                            {order.user_id ? '✅ Registered Account' : ' Guest User'}
                          </div>

                          {/* Payment method */}
                          <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                            (order.payment_method || '').toLowerCase().includes('cash') ||
                            (order.payment_method || '').toLowerCase().includes('delivery')
                              ? 'bg-green-100 text-green-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {order.payment_method || 'Credit / Debit Card'}
                          </span>

                          {/* Free Shipping badge */}
                          {isFreeShipping && (
                            <span className="px-4 py-2 rounded-full text-sm font-medium bg-emerald-100 text-emerald-700 flex items-center gap-1.5">
                               Free Shipping
                            </span>
                          )}
                        </div>
                      </div>

                      {/* ── Shipping Address ── */}
                      <div className="mb-8 bg-gray-50 p-6 rounded-2xl">
                        <p className="font-medium mb-3">📍 Shipping Address</p>
                        <div className="space-y-1 text-gray-700">
                          {order.street && <p>{order.street}</p>}
                          {order.apartment && <p>Apartment: {order.apartment}</p>}
                          {order.city && <p>City: {order.city}</p>}
                          {order.governorate && <p>Governorate: {order.governorate}</p>}
                          {(!order.street && !order.apartment && !order.city && !order.governorate) && (
                            <p className="text-gray-400">No address provided</p>
                          )}
                        </div>
                      </div>

                      {/* ── Order Items ── */}
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

                      {/* ── Delivery Fee Row ── */}
                      <div className="flex justify-between text-lg mt-6">
                        <span className="text-gray-600">Delivery Fee</span>
                        {isFreeShipping ? (
                          <span className="font-medium text-emerald-600 flex items-center gap-1.5">
                             Free
                          </span>
                        ) : (
                          <span className="font-medium">EGP {order.delivery_fee}</span>
                        )}
                      </div>

                      {/* ── Promo / Discount Row (if any) ── */}
                      {Number(order.discount_amount) > 0 && (
                        <div className="flex justify-between text-lg mt-2">
                          <span className="text-gray-600">
                            Discount{order.promo_code ? ` (${order.promo_code})` : ''}
                          </span>
                          <span className="font-medium text-red-600">
                            -EGP {Number(order.discount_amount).toFixed(2)}
                          </span>
                        </div>
                      )}

                      {/* ── Total ── */}
                      <div className="mt-6 flex justify-between text-2xl font-medium border-t pt-6">
                        <span>Total</span>
                        <span>EGP {orderTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ==================== SHIPPING COUNTRIES TAB ==================== */}
          {tab === 'shipping' && !loading && (
            <div>
              <h2 className="text-3xl font-light mb-2">Shipping Countries</h2>
              <p className="text-gray-500 mb-8 text-sm">
                Enable countries to ship to, then click <span className="font-medium text-black"> Free Cities</span> to manage free shipping per city.
              </p>

              <div className="mb-6 flex items-center gap-3">
                <input
                  type="checkbox"
                  id="selectAll"
                  checked={supportedCountries.length > 0 && supportedCountries.every(c => c.enabled)}
                  onChange={(e) => {
                    const newEnabled = e.target.checked;
                    supportedCountries.forEach(country => {
                      if (country.enabled !== newEnabled) {
                        toggleCountry(country.code, country.enabled);
                      }
                    });
                  }}
                  className="w-5 h-5 accent-black"
                />
                <label htmlFor="selectAll" className="font-medium cursor-pointer">
                  Select All Countries
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {supportedCountries.map((country) => (
                  <div
                    key={country.code}
                    className={`flex items-center gap-3 p-4 border rounded-2xl transition ${
                      country.enabled ? 'border-black bg-green-50' : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    {/* Toggle circle */}
                    <div
                      onClick={() => toggleCountry(country.code, country.enabled)}
                      className={`w-6 h-6 rounded-full flex items-center justify-center border-2 cursor-pointer shrink-0 ${
                        country.enabled ? 'border-green-600 bg-green-600' : 'border-gray-400'
                      }`}
                    >
                      {country.enabled && <Check size={14} className="text-white" />}
                    </div>

                    {/* Country name — truncate so it never pushes button off */}
                    <div
                      className="flex-1 cursor-pointer min-w-0"
                      onClick={() => toggleCountry(country.code, country.enabled)}
                    >
                      <p className="font-medium text-sm truncate">{country.name}</p>
                      <p className="text-xs text-gray-500">{country.code}</p>
                    </div>

                    {/* Free Cities — short label on mobile */}
                    {country.enabled && (
                      <button
                        onClick={() => router.push(`/admin/shipping/${country.code}`)}
                        className="text-xs bg-black text-white px-3 py-1.5 rounded-xl hover:bg-gray-800 transition whitespace-nowrap shrink-0"
                      >
                        <span className="sm:hidden">🚚</span>
                        <span className="hidden sm:inline"> Free Cities</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {supportedCountries.length === 0 && (
                <p className="text-center py-20 text-gray-500">No countries found in database.</p>
              )}
            </div>
          )}

          {/* ==================== SKU SEARCH TAB ==================== */}
          {tab === 'sku-search' && !loading && (
            <div>
              <h2 className="text-3xl font-light mb-8">SKU Search</h2>

              <p className="text-gray-600 mb-6">
                Enter the exact SKU to find the product + variant:
                <br />
                <span className="font-mono text-sm text-black">Example: GM-DR-25S-JCK-001-BLU-M</span>
              </p>

              <div className="w-full max-w-lg flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="GM-DR-25S-JCK-001-BLU-M"
                  value={skuSearchTerm}
                  onChange={(e) => setSkuSearchTerm(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && searchBySku()}
                  className="border rounded-2xl px-5 py-4 w-full text-base md:text-lg font-mono tracking-widest uppercase"
                />
                <button
                  onClick={searchBySku}
                  disabled={searching || !skuSearchTerm.trim()}
                  className="bg-black text-white px-8 py-4 rounded-2xl hover:bg-gray-800 disabled:opacity-50 whitespace-nowrap"
                >
                  {searching ? 'Searching...' : 'Search'}
                </button>
              </div>

              {skuSearchResult && (
                <div className="mt-10 bg-white rounded-3xl p-6 border max-w-lg">
                  {skuSearchResult.products?.images?.[0] && (
                    <img
                      src={skuSearchResult.products.images[0]}
                      alt={skuSearchResult.products.name}
                      className="w-full object-cover rounded-2xl"
                    />
                  )}

                  <div className="mt-6">
                    <div className="inline-flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-xl mb-4">
                      <span className="text-xs uppercase tracking-widest text-gray-500">SKU</span>
                      <span className="font-mono text-sm tracking-[2px] font-medium">{skuSearchResult.sku}</span>
                    </div>

                    <h3 className="text-2xl font-medium">{skuSearchResult.products?.name}</h3>
                    <p className="text-3xl font-medium text-black mt-1">
                      {formatPrice(skuSearchResult.products?.price)}
                    </p>

                    {skuSearchResult.products?.is_on_sale && (
                      <p className="text-red-600 text-sm font-medium mt-1">
                        On Sale • -{skuSearchResult.products.discount_percentage}%
                      </p>
                    )}

                    <div className="mt-6 bg-gray-50 rounded-2xl p-5 border border-gray-200">
                      <p className="text-xs uppercase tracking-widest text-gray-500 mb-4">Matched Variant</p>
                      <div className="grid grid-cols-3 gap-6 text-sm">
                        <div>
                          <p className="text-gray-500 mb-1">Color</p>
                          <p className="font-semibold text-base">{skuSearchResult.color}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 mb-1">Size</p>
                          <p className="font-semibold text-base">{skuSearchResult.size}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 mb-1">Stock</p>
                          <p className={`font-semibold text-base ${
                            skuSearchResult.stock === 0
                              ? 'text-red-600'
                              : skuSearchResult.stock <= 5
                                ? 'text-orange-500'
                                : 'text-green-600'
                          }`}>
                            {skuSearchResult.stock === 0 ? 'Out of stock' : skuSearchResult.stock}
                          </p>
                        </div>
                      </div>
                      {skuSearchResult.type_code && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <p className="text-gray-500 text-sm mb-1">Type Code</p>
                          <p className="font-mono font-semibold tracking-widest">{skuSearchResult.type_code}</p>
                        </div>
                      )}
                    </div>

                    {skuSearchResult.products?.category && (
                      <p className="text-sm text-gray-500 mt-4">
                        Category: <span className="font-medium text-black">{skuSearchResult.products.category}</span>
                        {skuSearchResult.products?.collection && (
                          <> · Collection: <span className="font-medium text-black">{skuSearchResult.products.collection}</span></>
                        )}
                      </p>
                    )}

                    {skuSearchResult.products?.description && (
                      <p className="mt-5 text-gray-600 text-sm border-t pt-5">
                        {skuSearchResult.products.description}
                      </p>
                    )}

                    <div className="mt-8 flex gap-3">
                      <button
                        onClick={() => openModal({ ...skuSearchResult.products, id: skuSearchResult.product_id })}
                        className="flex-1 bg-blue-600 text-white py-3.5 rounded-2xl hover:bg-blue-700 transition flex items-center justify-center gap-2"
                      >
                        <Edit2 size={18} /> Edit Product
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete "${skuSearchResult.products.name}" permanently?`)) {
                            deleteProduct(skuSearchResult.product_id);
                            setSkuSearchResult(null);
                          }
                        }}
                        className="flex-1 text-red-600 hover:text-red-700 py-3.5 border border-red-200 hover:border-red-400 rounded-2xl transition"
                      >
                        Delete Product
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {!skuSearchResult && skuSearchTerm && !searching && (
                <p className="mt-8 text-red-600 text-lg text-center">No variant found with this SKU.</p>
              )}

              {skuSearchTerm === '' && (
                <p className="text-center py-20 text-gray-500">Enter a full SKU to search</p>
              )}
            </div>
          )}

          {/* ==================== PROMO CODES TAB ==================== */}
          {tab === 'promo-codes' && !loading && (
            <div>
              <h2 className="text-3xl font-light mb-8">Promo Codes</h2>
              <div className="bg-white border rounded-3xl p-8 max-w-md mb-12">
                <h3 className="text-xl font-medium mb-6">Add New Promo Code</h3>

                <input
                  type="text"
                  placeholder="Promo Code (e.g. SUMMER30)"
                  value={promoForm.code}
                  onChange={(e) => setPromoForm({ ...promoForm, code: e.target.value.toUpperCase() })}
                  className="border rounded-2xl px-6 py-4 w-full text-lg mb-4 font-mono uppercase tracking-widest"
                />

                <input
                  type="number"
                  placeholder="Discount % (e.g. 30)"
                  value={promoForm.discountPercentage}
                  onChange={(e) => setPromoForm({ ...promoForm, discountPercentage: e.target.value })}
                  className="border rounded-2xl px-6 py-4 w-full text-lg mb-4"
                />

                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">Expiration Date (Optional)</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="date"
                      value={promoForm.expiresAt}
                      onChange={(e) => setPromoForm({ ...promoForm, expiresAt: e.target.value })}
                      disabled={promoForm.neverExpires}
                      className="border rounded-2xl px-6 py-4 flex-1"
                    />
                    <label className="flex items-center gap-2 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={promoForm.neverExpires}
                        onChange={(e) => setPromoForm({ ...promoForm, neverExpires: e.target.checked })}
                      />
                      Never expires
                    </label>
                  </div>
                </div>

                <button
                  onClick={addPromoCode}
                  className="w-full bg-black text-white py-4 rounded-2xl text-lg hover:bg-gray-800 transition"
                >
                  Add Promo Code
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {promoCodes.length === 0 ? (
                  <p className="text-gray-500 col-span-full py-20 text-center">No promo codes yet.</p>
                ) : (
                  promoCodes.map((promo) => {
                    const isExpired = promo.expires_at && new Date(promo.expires_at) < new Date();

                    return (
                      <div
                        key={promo.id}
                        className={`bg-white border rounded-3xl p-6 ${isExpired ? 'border-red-300 bg-red-50' : ''}`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-mono text-2xl tracking-widest font-medium">{promo.code}</p>
                            <p className="text-red-600 text-lg font-medium">-{promo.discount_percentage}% OFF</p>
                          </div>
                          <button onClick={() => deletePromoCode(promo.id)} className="text-red-600 hover:text-red-700">
                            <Trash2 size={24} />
                          </button>
                        </div>

                        {isExpired ? (
                          <p className="text-red-600 text-sm font-medium mt-4">Expiration date passed.</p>
                        ) : promo.expires_at ? (
                          <p className="text-sm text-gray-500 mt-4">
                            Expires: {new Date(promo.expires_at).toLocaleDateString()}
                          </p>
                        ) : (
                          <p className="text-sm text-green-600 mt-4">No expiration date</p>
                        )}

                        {isExpired && (
                          <button
                            onClick={() => renewPromoCode(promo.id)}
                            className="mt-6 w-full bg-black text-white py-3 rounded-2xl text-sm hover:bg-gray-800"
                          >
                            Renew promo code
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ==================== ADD / EDIT MODAL ==================== */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl w-full max-w-8xl p-12 relative max-h-[92vh] overflow-y-auto">
            <button onClick={() => { setShowAddModal(false); setEditingProduct(null); }} className="absolute top-8 right-8">
              <X size={28} />
            </button>

            <h2 className="text-3xl font-light mb-10">
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </h2>

            <div className="space-y-8">
              <input
                type="text"
                placeholder="Product Name *"
                className="border rounded-2xl px-6 py-5 w-full text-lg"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />

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
                  <option value="Blouses">Blouses</option>
                  <option value="Skirts">Skirts</option>
                  <option value="Tops">Tops</option>
                  <option value="Cardigans">Cardigans</option>
                  <option value="Coats">Coats</option>
                  <option value="Heels">Heels</option>
                  <option value="Handbags">Handbags</option>
                  <option value="Lingerie">Lingerie</option>
                  <option value="Swimwear">Swimwear</option>
                  <option value="Activewear">Activewear</option>
                </select>
              </div>

              <div>
                <label className="block text-sm mb-3 font-medium">Collection</label>
                <div className="flex gap-2">
                  <select
                    value={form.collection || ''}
                    onChange={(e) => setForm({ ...form, collection: e.target.value })}
                    className="border rounded-2xl px-6 py-5 flex-1 text-lg bg-white"
                  >
                    <option value="">Select a collection</option>
                    {collections.map((col) => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      const name = prompt('Enter new collection name:');
                      if (name?.trim()) {
                        if (collections.includes(name.trim())) {
                          alert('⚠️ Collection already exists!');
                        } else {
                          setCollections([...collections, name.trim()]);
                          setForm({ ...form, collection: name.trim() });
                        }
                      }
                    }}
                    className="bg-black text-white p-5 rounded-2xl hover:bg-gray-800 transition"
                    title="Add new collection"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>

              <input
                type="number"
                step="0.01"
                placeholder="Price *"
                className="border rounded-2xl px-6 py-5 w-full text-lg"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />

              <textarea
                placeholder="Description"
                className="border rounded-2xl px-6 py-5 w-full h-32 text-lg"
                value={form.description}
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

              <div className="flex items-center gap-4 bg-orange-50 border border-orange-200 p-5 rounded-2xl">
                <input
                  type="checkbox"
                  checked={form.isOnSale}
                  onChange={(e) => setForm({ ...form, isOnSale: e.target.checked })}
                  className="w-5 h-5 accent-orange-600"
                />
                <div className="flex-1">
                  <p className="font-medium">Mark as On Sale</p>
                  {form.isOnSale && (
                    <input
                      type="number"
                      placeholder="Discount % (e.g. 30)"
                      value={form.discountPercentage}
                      onChange={(e) => setForm({ ...form, discountPercentage: e.target.value })}
                      className="mt-2 border rounded-2xl px-6 py-3 w-full text-lg"
                    />
                  )}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <label className="block text-lg font-medium">Variants (Color + Type Code + SKU + Size + Stock)</label>
                  <button
                    onClick={addVariant}
                    className="text-sm bg-black text-white px-6 py-2.5 rounded-2xl flex items-center gap-2 hover:bg-gray-800"
                  >
                    <Plus size={18} /> Add Variant
                  </button>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 mb-6 text-sm">
                  <p className="font-medium mb-3 text-gray-700">Type Code Guide:</p>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-gray-600">
                    <div><strong>SHR</strong> = Shirt</div>
                    <div><strong>BLS</strong> = Blouse</div>
                    <div><strong>TOP</strong> = Top</div>
                    <div><strong>DRS</strong> = Dress</div>
                    <div><strong>SKT</strong> = Skirt</div>
                    <div><strong>PNT</strong> = Pants</div>
                    <div><strong>JNS</strong> = Jeans</div>
                    <div><strong>JCK</strong> = Jacket</div>
                    <div><strong>BLZ</strong> = Blazer</div>
                    <div><strong>HOD</strong> = Hoodie</div>
                    <div><strong>CTS</strong> = Coat</div>
                    <div><strong>SHO</strong> = Shoes</div>
                    <div><strong>HEE</strong> = Heels</div>
                    <div><strong>BAG</strong> = Handbag</div>
                  </div>
                </div>

                {variants.map((variant, index) => (
                  <div key={index} className="flex flex-wrap gap-4 mb-6 items-end border p-6 rounded-3xl bg-gray-50">
                    <input type="text" placeholder="Color (e.g. Black)" value={variant.color} onChange={(e) => updateVariant(index, 'color', e.target.value)} className="border rounded-2xl px-6 py-5 flex-1 min-w-[140px] text-lg" />
                    <input type="text" placeholder="Type (SHR/PNT/DRS...)" value={variant.typeCode || ''} onChange={(e) => updateVariant(index, 'typeCode', e.target.value.toUpperCase())} className="border rounded-2xl px-6 py-5 w-80 font-mono tracking-widest text-lg uppercase text-center" />
                    <input type="text" placeholder="SKU (e.g. GM-DR-25S-SHR-001-BLK-S)" value={variant.sku || ''} onChange={(e) => updateVariant(index, 'sku', e.target.value.toUpperCase())} className="border rounded-2xl px-6 py-5 flex-2 min-w-[260px] font-mono tracking-widest text-lg uppercase" />
                    <input type="text" placeholder="Size" value={variant.size} onChange={(e) => updateVariant(index, 'size', e.target.value)} className="border rounded-2xl px-6 py-5 w-28 text-lg" />
                    <input type="number" placeholder="Stock" value={variant.stock} onChange={(e) => updateVariant(index, 'stock', e.target.value)} className="border rounded-2xl px-6 py-5 w-32 text-lg" />
                    <button onClick={() => removeVariant(index)} className="text-red-600 hover:text-red-700 p-3"><Trash2 size={24} /></button>
                  </div>
                ))}
              </div>

              <button
                onClick={saveProduct}
                disabled={uploading}
                className="w-full bg-black text-white py-5 rounded-2xl text-lg tracking-widest hover:bg-gray-800 disabled:opacity-70"
              >
                {uploading ? 'Saving...' : editingProduct ? 'Update Product' : 'Add Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}