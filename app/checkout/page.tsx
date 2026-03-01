'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { createPaymobOrder } from '../actions/paymob';
import { CreditCard, Truck, Phone, MapPin } from 'lucide-react';

export default function Checkout() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    apartment: '',
    postalCode: '',
    governorate: '',
    city: '',
  });

  // Payment method
  const [paymentMethod, setPaymentMethod] = useState<'paymob' | 'fawry' | 'cod'>('paymob');

  // Demo cart (will be replaced with real cart later)
  const cartItems = [
    { id: 1, name: "Oversized Leather Jacket", price: 4999, qty: 1 },
    { id: 2, name: "Wide-Leg Jeans", price: 2299, qty: 1 },
  ];

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  const total = subtotal;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    const requiredFields = [
      'firstName', 'lastName', 'email', 'phone',
      'address', 'apartment', 'governorate', 'city'
    ];

    for (const field of requiredFields) {
      if (!formData[field as keyof typeof formData]?.trim()) {
        setError(`Please fill ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
        return false;
      }
    }

    if (!formData.email.includes('@') || !formData.email.includes('.')) {
      setError('Please enter a valid email address');
      return false;
    }

    if (formData.phone.length < 10) {
      setError('Phone number should be at least 10 digits');
      return false;
    }

    return true;
  };

  const handlePayment = async () => {
    setError('');
    if (!validateForm()) return;

    setLoading(true);

    try {
      if (paymentMethod === 'cod') {
        setSuccessMsg('✅ Order placed successfully! You will pay on delivery.');
        setTimeout(() => router.push('/checkout/success'), 1800);
        return;
      }

      // Prepare items for Paymob
      const itemsForPaymob = cartItems.map(item => ({
        name: item.name,
        amount_cents: item.price * 100,
        quantity: item.qty,
      }));

      // Call real Paymob action
      const result = await createPaymobOrder(total, itemsForPaymob);

      // VERY IMPORTANT: Redirect to the REAL Paymob iframe
      if (result?.iframeUrl) {
        window.location.href = result.iframeUrl;
      } else {
        setError('No payment URL received from Paymob');
      }

    } catch (err: any) {
      setError(err.message || 'Payment failed. Please try again.');
      console.error('Payment error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-5 gap-12">

          {/* Form */}
          <div className="md:col-span-3">
            <h1 className="text-4xl font-light tracking-widest mb-8">Checkout</h1>

            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <h2 className="text-xl font-medium mb-6">Contact Information</h2>
              <div className="grid grid-cols-2 gap-6">
                <input
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  type="text"
                  placeholder="First name *"
                  className="border border-gray-300 rounded-lg px-5 py-4 w-full focus:outline-none focus:border-black"
                  required
                />
                <input
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  type="text"
                  placeholder="Last name *"
                  className="border border-gray-300 rounded-lg px-5 py-4 w-full focus:outline-none focus:border-black"
                  required
                />
              </div>
              <input
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                type="email"
                placeholder="Email address *"
                className="border border-gray-300 rounded-lg px-5 py-4 w-full mt-6 focus:outline-none focus:border-black"
                required
              />
              <input
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                type="tel"
                placeholder="Phone number *"
                className="border border-gray-300 rounded-lg px-5 py-4 w-full mt-6 focus:outline-none focus:border-black"
                required
              />

              <h2 className="text-xl font-medium mt-12 mb-6 flex items-center gap-2">
                <MapPin size={20} /> Shipping Address
              </h2>

              <input
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                type="text"
                placeholder="Street address / Building number *"
                className="border border-gray-300 rounded-lg px-5 py-4 w-full focus:outline-none focus:border-black"
                required
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <input
                  name="apartment"
                  value={formData.apartment}
                  onChange={handleInputChange}
                  type="text"
                  placeholder="Apartment / Suite / Floor *"
                  className="border border-gray-300 rounded-lg px-5 py-4 w-full focus:outline-none focus:border-black"
                  required
                />
                <input
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleInputChange}
                  type="text"
                  placeholder="Postal code (optional)"
                  className="border border-gray-300 rounded-lg px-5 py-4 w-full focus:outline-none focus:border-black"
                />
              </div>
              <input
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                type="text"
                placeholder="City / District *"
                className="border border-gray-300 rounded-lg px-5 py-4 w-full mt-6 focus:outline-none focus:border-black"
                required
              />
              <select
                name="governorate"
                value={formData.governorate}
                onChange={handleInputChange}
                className="border border-gray-300 rounded-lg px-5 py-4 w-full mt-6 focus:outline-none focus:border-black"
                required
              >
                <option value="">Select Governorate *</option>
                <option value="Alexandria">Alexandria</option>
                <option value="Aswan">Aswan</option>
                <option value="Asyut">Asyut</option>
                <option value="Beheira">Beheira</option>
                <option value="Beni Suef">Beni Suef</option>
                <option value="Cairo">Cairo</option>
                <option value="Dakahlia">Dakahlia</option>
                <option value="Damietta">Damietta</option>
                <option value="Faiyum">Faiyum</option>
                <option value="Gharbia">Gharbia</option>
                <option value="Giza">Giza</option>
                <option value="Ismailia">Ismailia</option>
                <option value="Kafr El Sheikh">Kafr El Sheikh</option>
                <option value="Luxor">Luxor</option>
                <option value="Matruh">Matruh</option>
                <option value="Minya">Minya</option>
                <option value="Monufia">Monufia</option>
                <option value="New Valley">New Valley</option>
                <option value="North Sinai">North Sinai</option>
                <option value="Port Said">Port Said</option>
                <option value="Qalyubia">Qalyubia</option>
                <option value="Qena">Qena</option>
                <option value="Red Sea">Red Sea</option>
                <option value="Sharqia">Sharqia</option>
                <option value="Sohag">Sohag</option>
                <option value="South Sinai">South Sinai</option>
                <option value="Suez">Suez</option>
              </select>

              {/* Payment Method Selector */}
              <h2 className="text-xl font-medium mt-12 mb-6">Payment Method</h2>
              <div className="grid grid-cols-1 gap-4">
                {[
                  { id: 'paymob', label: 'Credit / Debit Card or Wallet (Paymob)', icon: CreditCard },
                  { id: 'fawry', label: 'Fawry (Pay at any Fawry location)', icon: Phone },
                  { id: 'cod', label: 'Cash on Delivery', icon: Truck },
                ].map((method) => {
                  const Icon = method.icon;
                  return (
                    <label
                      key={method.id}
                      className={`flex items-center gap-4 border-2 p-5 rounded-2xl cursor-pointer transition ${
                        paymentMethod === method.id ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={paymentMethod === method.id}
                        onChange={() => setPaymentMethod(method.id as any)}
                        className="w-5 h-5 accent-black"
                      />
                      <div className="flex-1">
                        <p className="font-medium">{method.label}</p>
                      </div>
                      <Icon size={28} className="text-gray-400" />
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-2xl p-8 sticky top-8 shadow-sm">
              <h2 className="text-xl font-medium mb-6">Order Summary</h2>
              
              {cartItems.map(item => (
                <div key={item.id} className="flex justify-between py-4 border-b last:border-b-0">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-500">Qty: {item.qty}</p>
                  </div>
                  <p className="font-medium">EGP {item.price.toLocaleString()}</p>
                </div>
              ))}

              <div className="flex justify-between mt-8 text-xl font-medium border-t pt-6">
                <span>Total</span>
                <span>EGP {total.toLocaleString()}</span>
              </div>

              <button
                onClick={handlePayment}
                disabled={loading}
                className="w-full mt-10 bg-black text-white py-5 text-sm tracking-widest rounded-full hover:bg-gray-800 disabled:opacity-50 transition flex items-center justify-center gap-3"
              >
                {loading ? 'Processing...' : `PAY EGP ${total.toLocaleString()} • ${paymentMethod.toUpperCase()}`}
              </button>

              {error && <p className="text-red-600 text-center mt-4 text-sm">{error}</p>}
              {successMsg && <p className="text-green-600 text-center mt-4 text-sm">{successMsg}</p>}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}