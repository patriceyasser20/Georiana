'use client';

import { useEffect, useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { createStripeCheckout } from '../actions/stripe';
import { useRouter } from 'next/navigation';
import { CreditCard, Truck } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';
import { useTranslation } from '../context/LanguageContext';
import { supabaseClient } from '../../lib/supabaseClient';

type PaymentMethod = 'stripe' | 'fawry' | 'cod';

export default function Checkout() {
  const router = useRouter();
  const { formatPrice } = useCurrency();
  const { t } = useTranslation();

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('stripe');

  // Shipping form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [street, setStreet] = useState('');
  const [apartment, setApartment] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');

  // Country
  const [country, setCountry] = useState('');
  const [allCountries, setAllCountries] = useState<any[]>([]);
  const [isCountrySupported, setIsCountrySupported] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('reviewOrder');
    if (saved) {
      const parsed = JSON.parse(saved).map((item: any) => ({
        ...item,
        price: Number(item.price) || 0,
        quantity: Number(item.quantity) || 1,
      }));
      setItems(parsed);
    }
  }, []);

  // Load ALL countries
  useEffect(() => {
    const fetchCountries = async () => {
      const { data } = await supabaseClient
        .from('supported_countries')
        .select('*')
        .order('name');
      setAllCountries(data || []);
    };
    fetchCountries();
  }, []);

  // Check if selected country is enabled
  useEffect(() => {
    if (!country) {
      setIsCountrySupported(true);
      return;
    }
    const selected = allCountries.find(c => c.code === country);
    setIsCountrySupported(selected?.enabled || false);
  }, [country, allCountries]);

  const total = items.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);

  // Update the order in Supabase with real address & payment method
  const updateOrderDetails = async () => {
    const orderId = localStorage.getItem('pendingOrderId');
    if (!orderId) return;

    const selectedCountry = allCountries.find(c => c.code === country);
    const paymentLabel = paymentMethod === 'cod' ? 'Cash on Delivery' : 'Credit / Debit Card';

    const { error: updateError } = await supabaseClient
      .from('orders')
      .update({
        street: street,
        apartment: apartment,
        city: city,
        governorate: selectedCountry?.name || country,
        payment_method: paymentLabel,
        status: paymentMethod === 'cod' ? 'confirmed' : 'pending',
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('Failed to update order:', updateError);
    }

    // Clean up the pending order ID
    localStorage.removeItem('pendingOrderId');
  };

  const handlePayment = async () => {
    if (items.length === 0) return;
    if (!isCountrySupported) {
      setError(t('common.noShipment'));
      return;
    }

    setLoading(true);
    setError('');

    // Update order with real address & payment method before proceeding
    await updateOrderDetails();

    if (paymentMethod === 'stripe') {
      try {
        const stripeItems = items.map(item => ({
          name: item.name,
          price: Number(item.price),
          quantity: Number(item.quantity)
        }));

        const result = await createStripeCheckout(total, stripeItems);

        if (result?.url) {
          localStorage.removeItem('reviewOrder');
          window.location.href = result.url;
        }
      } catch (err: any) {
        setError(err.message || 'Stripe failed');
      }
    } else if (paymentMethod === 'cod') {
      localStorage.removeItem('reviewOrder');
      router.push('/checkout/success');
    } else {
      alert("Fawry coming soon");
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
            <h1 className="text-4xl font-light tracking-widest mb-10">{t('checkout.title')}</h1>

            <div className="bg-white rounded-3xl p-8">
              <h2 className="text-2xl font-medium mb-6">{t('checkout.contactInfo')}</h2>
              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder={t('checkout.firstName')} value={firstName} onChange={e => setFirstName(e.target.value)} className="border rounded-2xl px-5 py-4 w-full" />
                <input type="text" placeholder={t('checkout.lastName')} value={lastName} onChange={e => setLastName(e.target.value)} className="border rounded-2xl px-5 py-4 w-full" />
              </div>
              <input type="email" placeholder={t('checkout.email')} value={email} onChange={e => setEmail(e.target.value)} className="border rounded-2xl px-5 py-4 w-full mt-4" />
              <input type="tel" placeholder={t('checkout.phone')} value={phone} onChange={e => setPhone(e.target.value)} className="border rounded-2xl px-5 py-4 w-full mt-4" />

              <h2 className="text-2xl font-medium mt-12 mb-6">{t('checkout.shippingAddress')}</h2>
              <input type="text" placeholder={t('checkout.street')} value={street} onChange={e => setStreet(e.target.value)} className="border rounded-2xl px-5 py-4 w-full" />
              <div className="grid grid-cols-2 gap-4 mt-4">
                <input type="text" placeholder={t('checkout.apartment')} value={apartment} onChange={e => setApartment(e.target.value)} className="border rounded-2xl px-5 py-4" />
                <input type="text" placeholder={t('checkout.postalCode')} value={postalCode} onChange={e => setPostalCode(e.target.value)} className="border rounded-2xl px-5 py-4" />
              </div>
              <input type="text" placeholder={t('checkout.city')} value={city} onChange={e => setCity(e.target.value)} className="border rounded-2xl px-5 py-4 w-full mt-4" />

              {/* Country Selector */}
              <div className="mt-4">
                <label className="block text-sm font-medium mb-2">{t('checkout.country')}</label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="border rounded-2xl px-5 py-4 w-full focus:outline-none focus:border-black"
                >
                  <option value="">{t('checkout.selectCountry')}</option>
                  {allCountries.map(c => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {!isCountrySupported && country && (
                <p className="text-red-600 text-sm mt-3 font-medium">
                  {t('common.noShipment')}
                </p>
              )}

              <h2 className="text-2xl font-medium mt-12 mb-6">{t('checkout.paymentMethod')}</h2>
              <div className="space-y-4">
                <label className={`flex items-center gap-4 p-5 border rounded-2xl cursor-pointer transition ${paymentMethod === 'stripe' ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-400'}`}>
                  <input type="radio" name="payment" checked={paymentMethod === 'stripe'} onChange={() => setPaymentMethod('stripe')} />
                  <CreditCard size={26} />
                  <div>
                    <p className="font-medium">{t('checkout.stripe')}</p>
                  </div>
                </label>

                <label className={`flex items-center gap-4 p-5 border rounded-2xl cursor-pointer transition ${paymentMethod === 'cod' ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-400'}`}>
                  <input type="radio" name="payment" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} />
                  <Truck size={26} />
                  <div>
                    <p className="font-medium">{t('checkout.cod')}</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Right: Order Summary */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-3xl p-8 sticky top-8">
              <h2 className="text-2xl font-medium mb-8">{t('checkout.orderSummary')}</h2>

              {items.map((item, index) => (
                <div key={index} className="flex justify-between py-6 border-b last:border-b-0">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-500">
                      Size: {item.size} • Color: {item.color} • Qty: {item.quantity}
                    </p>
                  </div>
                  <p className="font-medium">{formatPrice(Number(item.price) * Number(item.quantity))}</p>
                </div>
              ))}

              <div className="flex justify-between text-2xl font-medium mt-10 pt-8 border-t">
                <span>{t('checkout.total')}</span>
                <span>{formatPrice(total)}</span>
              </div>

              {error && <p className="text-red-600 text-center mt-6 font-medium">{error}</p>}

              <button
                onClick={handlePayment}
                disabled={loading || !isCountrySupported || !country}
                className="w-full mt-8 bg-black text-white py-5 rounded-full text-sm tracking-widest hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading ? t('common.processing') : `${t('checkout.pay')} ${formatPrice(total)} • ${paymentMethod.toUpperCase()}`}
              </button>

              {!isCountrySupported && country && (
                <p className="text-red-600 text-center text-sm mt-4">{t('common.noShipment')}</p>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}