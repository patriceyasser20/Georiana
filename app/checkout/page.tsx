'use client';

import { useEffect, useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { createPaymobOrder } from '../actions/paymob';
import { useRouter } from 'next/navigation';
import { CreditCard, Phone, Truck } from 'lucide-react';

type PaymentMethod = 'paymob' | 'fawry' | 'cod';

export default function Checkout() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('paymob');

  // Load items from Review Order
  useEffect(() => {
    const saved = localStorage.getItem('reviewOrder');
    if (saved) setItems(JSON.parse(saved));
  }, []);

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handlePayment = async () => {
    if (items.length === 0) return;

    setLoading(true);
    setError('');

    if (paymentMethod === 'paymob') {
      try {
        const paymobItems = items.map(item => ({
          name: item.name,
          price: item.price,
          quantity: item.quantity
        }));

        const result = await createPaymobOrder(total, paymobItems);

        if (result?.iframeUrl) {
          // ✅ Clear the review order bucket BEFORE going to Paymob
          localStorage.removeItem('reviewOrder');
          window.location.href = result.iframeUrl;
        }
      } catch (err: any) {
        console.error('Checkout error:', err);
        setError(err.message || 'Paymob failed');
      }
    } else if (paymentMethod === 'cod') {
      // ✅ COD now goes to success page + clears bucket
      localStorage.removeItem('reviewOrder');
      router.push('/checkout/success');
    } else {
      // Fawry
      alert("Fawry coming soon – we will contact you with the code.");
    }

    setLoading(false);
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-5 gap-10">

          {/* Left: Form */}
          <div className="md:col-span-3">
            <h1 className="text-4xl font-light tracking-widest mb-10">Checkout</h1>

            <div className="bg-white rounded-3xl p-8">
              <h2 className="text-2xl font-medium mb-6">Contact Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="First name *" className="border rounded-2xl px-5 py-4 w-full" />
                <input type="text" placeholder="Last name *" className="border rounded-2xl px-5 py-4 w-full" />
              </div>
              <input type="email" placeholder="Email address *" className="border rounded-2xl px-5 py-4 w-full mt-4" />
              <input type="tel" placeholder="Phone number *" className="border rounded-2xl px-5 py-4 w-full mt-4" />

              <h2 className="text-2xl font-medium mt-12 mb-6">Shipping Address</h2>
              <input type="text" placeholder="Street address / Building number *" className="border rounded-2xl px-5 py-4 w-full" />
              <div className="grid grid-cols-2 gap-4 mt-4">
                <input type="text" placeholder="Apartment / Suite / Floor *" className="border rounded-2xl px-5 py-4" />
                <input type="text" placeholder="Postal code (optional)" className="border rounded-2xl px-5 py-4" />
              </div>
              <input type="text" placeholder="City / District *" className="border rounded-2xl px-5 py-4 w-full mt-4" />
              <select className="border rounded-2xl px-5 py-4 w-full mt-4">
                <option>Select Governorate *</option>
                <option>Cairo</option>
                <option>Giza</option>
                <option>Alexandria</option>
                <option>Aswan</option>
                <option>Asyut</option>
                <option>Beheira</option>
                <option>Beni Suef	</option>
                <option>Damietta</option>
                <option>Faiyum</option>
                <option>Gharbia</option>
                <option>Ismailia</option>
                <option>Kafr El Sheikh	</option>
                <option>Luxor</option>
                <option>Matrouh</option>
                <option>Minya</option>
                <option>Monufia</option>
                <option>New Valley	</option>
                <option>North Sinai	</option>
                <option>Port Said	</option>
                <option>Qalyubia</option>
                <option>Qena</option>
                <option>Red Sea	</option>
                <option>Sharqia</option>
                <option>Sohag</option>
                <option>South Sinai	</option>
                <option>Suez</option>
                <option>Dakahlia</option>
              </select>

              {/* Payment Methods */}
              <h2 className="text-2xl font-medium mt-12 mb-6">Payment Method</h2>
              <div className="space-y-4">
                <label className={`flex items-center gap-4 p-5 border rounded-2xl cursor-pointer transition ${paymentMethod === 'paymob' ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-400'}`}>
                  <input type="radio" name="payment" checked={paymentMethod === 'paymob'} onChange={() => setPaymentMethod('paymob')} />
                  <CreditCard size={26} />
                  <div>
                    <p className="font-medium">Credit / Debit Card</p>
                    <p className="text-sm text-gray-500">Visa, Mastercard via Paymob</p>
                  </div>
                </label>

                <label className={`flex items-center gap-4 p-5 border rounded-2xl cursor-pointer transition ${paymentMethod === 'fawry' ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-400'}`}>
                  <input type="radio" name="payment" checked={paymentMethod === 'fawry'} onChange={() => setPaymentMethod('fawry')} />
                  <Phone size={26} />
                  <div>
                    <p className="font-medium">Fawry</p>
                    <p className="text-sm text-gray-500">Pay at Fawry outlets</p>
                  </div>
                </label>

                <label className={`flex items-center gap-4 p-5 border rounded-2xl cursor-pointer transition ${paymentMethod === 'cod' ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-400'}`}>
                  <input type="radio" name="payment" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} />
                  <Truck size={26} />
                  <div>
                    <p className="font-medium">Cash on Delivery</p>
                    <p className="text-sm text-gray-500">Pay when you receive the order</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Right: Order Summary */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-3xl p-8 sticky top-8">
              <h2 className="text-2xl font-medium mb-8">Order Summary</h2>

              {items.map((item, index) => (
                <div key={index} className="flex justify-between py-6 border-b last:border-b-0">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-500">
                      Size: {item.size} • Color: {item.color} • Qty: {item.quantity}
                    </p>
                  </div>
                  <p className="font-medium">EGP {(item.price * item.quantity).toLocaleString()}</p>
                </div>
              ))}

              <div className="flex justify-between text-2xl font-medium mt-10 pt-8 border-t">
                <span>Total</span>
                <span>EGP {total.toLocaleString()}</span>
              </div>

              {error && <p className="text-red-600 text-center mt-6 font-medium">{error}</p>}

              <button
                onClick={handlePayment}
                disabled={loading}
                className="w-full mt-8 bg-black text-white py-5 rounded-full text-sm tracking-widest hover:bg-gray-800 disabled:opacity-50 transition"
              >
                {loading ? 'Processing...' : `PAY EGP ${total.toLocaleString()} • ${paymentMethod.toUpperCase()}`}
              </button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}