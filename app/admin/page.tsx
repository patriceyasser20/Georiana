'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { supabaseClient } from '../../lib/supabaseClient';
import { RefreshCw } from 'lucide-react';
import { X } from 'lucide-react';

export default function AdminPanel() {
  const router = useRouter();
  const [tab, setTab] = useState<'products' | 'orders'>('products');
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form for adding product
  const [form, setForm] = useState({
    name: '',
    price: '',
    description: '',
    sizes: '',
    colors: '',
    stock: '50',
    image: null as File | null,
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

    const [productsRes, ordersRes] = await Promise.all([
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
      `).order('created_at', { ascending: false })
    ]);

    setProducts(productsRes.data || []);
    setOrders(ordersRes.data || []);
    setLoading(false);
  };

  const addProduct = async () => {
    if (!form.name || !form.price || !form.image) {
      alert('Name, price and image are required');
      return;
    }

    setUploading(true);

    try {
      const fileExt = form.image.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabaseClient.storage
        .from('product-images')
        .upload(fileName, form.image);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabaseClient.storage
        .from('product-images')
        .getPublicUrl(fileName);

      await supabaseClient.from('products').insert({
        name: form.name,
        price: Number(form.price),
        description: form.description,
        sizes: form.sizes.split(',').map(s => s.trim()).filter(Boolean),
        colors: form.colors.split(',').map(c => c.trim()).filter(Boolean),
        stock: Number(form.stock),
        image_url: urlData.publicUrl,
      });

      alert('✅ Product added successfully!');
      setShowAddModal(false);
      setForm({ name: '', price: '', description: '', sizes: '', colors: '', stock: '50', image: null });
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

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-5xl font-light tracking-widest mb-10">Admin Panel</h1>

          <div className="flex gap-4 mb-8 border-b pb-4">
            <button onClick={() => setTab('products')} className={`px-8 py-3 rounded-full ${tab === 'products' ? 'bg-black text-white' : 'bg-white border'}`}>Products</button>
            <button onClick={() => setTab('orders')} className={`px-8 py-3 rounded-full ${tab === 'orders' ? 'bg-black text-white' : 'bg-white border'}`}>Orders</button>
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
                      {p.image_url && (
                        <img src={p.image_url} alt={p.name} className="w-full h-64 object-cover" />
                      )}
                      <div className="p-6">
                        <h3 className="font-medium text-lg mb-1">{p.name}</h3>
                        <p className="text-2xl font-medium">EGP {p.price}</p>
                        <p className="text-sm text-gray-500 mt-1">Stock: {p.stock}</p>
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

          {/* ORDERS TAB - REAL ADDRESS + PRODUCTS */}
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
                      <span className={`px-6 py-2 rounded-full text-sm ${order.payment_method === 'cod' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                        {order.payment_method === 'cod' ? 'Cash on Delivery' : 'Credit / Debit Card'}
                      </span>
                    </div>

                    {/* Real Shipping Address from user input */}
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
                        <p className="font-medium">EGP {item.price}</p>
                      </div>
                    ))}

                    <div className="mt-10 flex justify-between text-2xl font-medium border-t pt-8">
                      <span>Total</span>
                      <span>EGP {order.total}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl w-full max-w-lg p-10 relative">
            <button onClick={() => setShowAddModal(false)} className="absolute top-6 right-6">
              <X size={28} />
            </button>

            <h2 className="text-3xl font-light mb-8">Add New Product</h2>

            <div className="space-y-6">
              <input type="text" placeholder="Product Name *" className="border rounded-2xl px-5 py-4 w-full" onChange={e => setForm({...form, name: e.target.value})} />
              <input type="number" placeholder="Price (EGP) *" className="border rounded-2xl px-5 py-4 w-full" onChange={e => setForm({...form, price: e.target.value})} />
              <textarea placeholder="Description" className="border rounded-2xl px-5 py-4 w-full h-24" onChange={e => setForm({...form, description: e.target.value})} />

              <input type="text" placeholder="Sizes (S,M,L,XL)" className="border rounded-2xl px-5 py-4 w-full" onChange={e => setForm({...form, sizes: e.target.value})} />
              <input type="text" placeholder="Colors (Black,Brown,Navy)" className="border rounded-2xl px-5 py-4 w-full" onChange={e => setForm({...form, colors: e.target.value})} />

              <input type="number" placeholder="Stock Quantity" defaultValue="50" className="border rounded-2xl px-5 py-4 w-full" onChange={e => setForm({...form, stock: e.target.value})} />

              <div>
                <label className="block text-sm mb-2">Product Image *</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={e => setForm({...form, image: e.target.files?.[0] || null})}
                  className="border rounded-2xl px-5 py-4 w-full" 
                />
              </div>

              <button 
                onClick={addProduct}
                disabled={uploading}
                className="w-full bg-black text-white py-4 rounded-full text-sm tracking-widest hover:bg-gray-800 disabled:opacity-70"
              >
                {uploading ? 'Uploading Image...' : 'Add Product'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}