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
  const [city, setCity] = useState(''); // kept for compatibility

  // Governorate + Delivery Fee
  const [governorate, setGovernorate] = useState('');
  const [deliveryFee, setDeliveryFee] = useState(0);

  // Free Shipping
  const [isFreeShipping, setIsFreeShipping] = useState(false);

  // Country
  const [country, setCountry] = useState('');
  const [allCountries, setAllCountries] = useState<any[]>([]);
  const [isCountrySupported, setIsCountrySupported] = useState(true);

  // Promo Code
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  const [promoError, setPromoError] = useState('');

  // Egyptian Governorates with delivery fees
  const governorateFees: { [key: string]: number } = {
    'Cairo': 50,
    'Giza': 50,
    'Alexandria': 80,
    'Port Said': 100,
    'Suez': 90,
    'Luxor': 120,
    'Aswan': 150,
    'Ismailia': 80,
    'Damietta': 70,
    'Sharqia': 60,
    'Dakahlia': 65,
    'Beheira': 55,
    'Kafr El Sheikh': 70,
    'Matruh': 120,
    'Red Sea': 130,
    'South Sinai': 140,
    'North Sinai': 110,
    'Qena': 110,
    'Sohag': 100,
    'Assiut': 95,
    'Beni Suef': 70,
    'Fayoum': 65,
    'Minya': 90,
  };

  // ==================== PRE-FILL EMAIL & PHONE IF LOGGED IN ====================
  useEffect(() => {
    const getUserData = async () => {
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (user?.email) setEmail(user.email);
      if (user?.user_metadata?.phone) setPhone(user.user_metadata.phone);
    };
    getUserData();
  }, []);

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

  // Load enabled countries
  useEffect(() => {
    const fetchCountries = async () => {
      const { data } = await supabaseClient
        .from('supported_countries')
        .select('*')
        .eq('enabled', true)
        .order('name');
      setAllCountries(data || []);
    };
    fetchCountries();
  }, []);

  useEffect(() => {
    if (!country) {
      setIsCountrySupported(true);
      return;
    }
    const selected = allCountries.find(c => c.code === country);
    setIsCountrySupported(selected?.enabled || false);
  }, [country, allCountries]);

  // Update delivery fee when governorate changes (standard fee)
  useEffect(() => {
    if (governorate && governorateFees[governorate]) {
      setDeliveryFee(governorateFees[governorate]);
    } else {
      setDeliveryFee(0);
    }
    // Reset free shipping when city changes (re-check below)
    setIsFreeShipping(false);
  }, [governorate]);

  // ==================== CHECK FREE SHIPPING FROM DB ====================
  useEffect(() => {
    if (!governorate || !country) return;

    const checkFreeShipping = async () => {
      const { data } = await supabaseClient
        .from('free_shipping_cities')
        .select('is_free_shipping')
        .eq('country_code', country)
        .eq('city_name', governorate)
        .single();

      if (data?.is_free_shipping) {
        setDeliveryFee(0);
        setIsFreeShipping(true);
      } else {
        setIsFreeShipping(false);
        // Restore the standard fee
        if (governorate && governorateFees[governorate]) {
          setDeliveryFee(governorateFees[governorate]);
        }
      }
    };

    checkFreeShipping();
  }, [governorate, country]);

  // Auto clear error when required fields are filled
  useEffect(() => {
    if (firstName && lastName && email && phone && street && apartment && governorate && country) {
      setError('');
    }
  }, [firstName, lastName, email, phone, street, apartment, governorate, country]);

  const subtotal = items.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);
  const discountAmount = appliedPromo ? (subtotal * appliedPromo.discount_percentage / 100) : 0;
  const finalTotal = subtotal - discountAmount + deliveryFee;

  // ==================== APPLY PROMO CODE ====================
  const applyPromoCode = async () => {
    if (!promoCodeInput.trim()) return;

    setPromoError('');
    setAppliedPromo(null);

    const code = promoCodeInput.trim().toUpperCase();

    const { data, error } = await supabaseClient
      .from('promo_codes')
      .select('*')
      .eq('code', code)
      .single();

    if (error || !data) {
      setPromoError('Invalid promo code');
      return;
    }

    const now = new Date();
    const expiryDate = data.expires_at ? new Date(data.expires_at) : null;

    if (expiryDate && expiryDate < now) {
      setPromoError('Invalid Promo Code');
      return;
    }

    setAppliedPromo(data);
    alert(`✅ Promo code applied! ${data.discount_percentage}% OFF`);
  };

  // ==================== CREATE OR UPDATE ORDER ====================
  const createOrUpdateOrder = async () => {
    let orderId = localStorage.getItem('pendingOrderId');

    const paymentLabel = paymentMethod === 'cod' ? 'Cash on Delivery' : 'Credit / Debit Card';
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!orderId) {
      const initialStatus = paymentMethod === 'cod' ? 'succeeded' : 'pending';

      const { data: newOrder, error } = await supabaseClient
        .from('orders')
        .insert({
          user_id: user?.id || null,
          user_email: email || 'guest@georgiana.com',
          phone: phone || null,
          total: subtotal,
          payment_method: paymentLabel,
          street: street || null,
          apartment: apartment || null,
          city: city || 'Cairo',
          governorate: governorate || 'Cairo',
          delivery_fee: deliveryFee,
          status: initialStatus,
          promo_code: appliedPromo?.code || null,
          discount_amount: discountAmount || 0
        })
        .select()
        .single();

      if (error || !newOrder) {
        console.error('Failed to create order:', error);
        throw new Error('Failed to create order');
      }

      orderId = newOrder.id as string;
      localStorage.setItem('pendingOrderId', orderId);

      const orderItemsData = items.map(item => ({
        order_id: orderId,
        product_name: item.name,
        size: item.size || null,
        color: item.color || null,
        quantity: item.quantity,
        price: item.price,
        image_url: item.image_url || null
      }));

      const { error: itemsError } = await supabaseClient
        .from('order_items')
        .insert(orderItemsData);

      if (itemsError) {
        console.error('Failed to insert order items:', itemsError);
      }
    } else {
      // Update existing order
      const { error: updateError } = await supabaseClient
        .from('orders')
        .update({
          user_id: user?.id || null,
          user_email: email || 'guest@georgiana.com',
          phone: phone || null,
          street: street || null,
          apartment: apartment || null,
          city: city || 'Cairo',
          governorate: governorate || 'Cairo',
          delivery_fee: deliveryFee,
          payment_method: paymentLabel,
          status: paymentMethod === 'cod' ? 'succeeded' : 'pending',
          promo_code: appliedPromo?.code || null,
          discount_amount: discountAmount || 0
        })
        .eq('id', orderId);

      if (updateError) console.error('Update error:', updateError);
    }

    return orderId;
  };

  const handlePayment = async () => {
    if (items.length === 0) return;
    if (!isCountrySupported) {
      setError(t('common.noShipment'));
      return;
    }
    if (!firstName || !lastName || !email || !phone || !street || !apartment || !governorate || !country) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const orderId = await createOrUpdateOrder();

      if (paymentMethod === 'stripe') {
        const stripeItems = items.map(item => ({
          name: item.name,
          price: Number(item.price),
          quantity: Number(item.quantity)
        }));

        const result = await createStripeCheckout(finalTotal, stripeItems);

        if (result?.url) {
          localStorage.setItem('last_created_order_id', orderId);
          localStorage.removeItem('reviewOrder');
          window.location.href = result.url;
        } else {
          throw new Error("No Stripe URL returned");
        }
      } else if (paymentMethod === 'cod') {
        localStorage.removeItem('reviewOrder');
        localStorage.removeItem('pendingOrderId');
        router.push(`/checkout/success?order_id=${orderId}`);
      } else {
        alert("Fawry coming soon");
      }
    } catch (err: any) {
      console.error("Full Payment Error:", err);
      setError(err.message || 'Payment failed');
      alert("Error: " + (err.message || 'Unknown error occurred'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-5 gap-10">

          {/* ==================== LEFT: FORM ==================== */}
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

              {/* Country Selector */}
              <div className="mt-6">
                <label className="block text-sm font-medium mb-2">{t('checkout.country')}</label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="border rounded-2xl px-5 py-4 w-full focus:outline-none focus:border-black"
                >
                  <option value="">Select Country</option>
                  {allCountries.map(c => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Governorate / City Selector */}
              <div className="mt-6">
                <label className="block text-sm font-medium mb-2">Governorate</label>
                <select
                  value={governorate}
                  onChange={(e) => setGovernorate(e.target.value)}
                  className="border rounded-2xl px-5 py-4 w-full focus:outline-none focus:border-black"
                >
                  <option value="">Select Governorate</option>
                  {Object.keys(governorateFees).map(gov => (
                    <option key={gov} value={gov}>{gov}</option>
                  ))}
                </select>

                {/* Free Shipping Badge — shown below governorate selector */}
                {isFreeShipping && governorate && (
                  <div className="mt-3 flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-5 py-3 rounded-2xl text-sm font-medium">
                    Free shipping available for <strong>{governorate}</strong>!
                  </div>
                )}
              </div>

              {!isCountrySupported && country && (
                <p className="text-red-600 text-sm mt-3 font-medium">
                  {t('common.noShipment')}
                </p>
              )}

              {/* Payment Methods */}
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

          {/* ==================== RIGHT: ORDER SUMMARY ==================== */}
          <div className="md:col-span-2 py-20">
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

              {/* Promo Code */}
              <div className="mt-8 border-t pt-8">
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Promo Code"
                    value={promoCodeInput}
                    onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                    className="border rounded-2xl px-5 py-4 flex-1 text-lg font-mono tracking-widest uppercase"
                  />
                  <button
                    onClick={applyPromoCode}
                    className="bg-black text-white px-8 rounded-2xl hover:bg-gray-800 transition"
                  >
                    Apply
                  </button>
                </div>
                {promoError && <p className="text-red-600 text-sm mt-2">{promoError}</p>}
                {appliedPromo && (
                  <p className="text-green-600 text-sm mt-2 font-medium">
                    ✅ {appliedPromo.code} applied • {appliedPromo.discount_percentage}% OFF
                  </p>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="mt-10 space-y-3 text-lg">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>

                {/* Delivery Fee Row — shows Free or amount */}
                {governorate && (
                  <div className="flex justify-between">
                    <span>Delivery Fee ({governorate})</span>
                    {isFreeShipping ? (
                      <span className="text-green-600 font-semibold flex items-center gap-1">
                        Free
                      </span>
                    ) : (
                      <span>{formatPrice(deliveryFee)}</span>
                    )}
                  </div>
                )}

                {appliedPromo && (
                  <div className="flex justify-between text-red-600">
                    <span>Discount ({appliedPromo.discount_percentage}%)</span>
                    <span>-{formatPrice(discountAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-2xl font-medium border-t pt-6">
                  <span>Total</span>
                  <span>{formatPrice(finalTotal)}</span>
                </div>
              </div>

              {error && <p className="text-red-600 text-center mt-6 font-medium">{error}</p>}

              <button
                onClick={handlePayment}
                disabled={loading || !isCountrySupported || !country || !governorate}
                className="w-full mt-8 bg-black text-white py-5 rounded-full text-sm tracking-widest hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading
                  ? t('common.processing')
                  : `${t('checkout.pay')} ${formatPrice(finalTotal)} • ${paymentMethod.toUpperCase()}`
                }
              </button>

              {!isCountrySupported && country && (
                <p className="text-red-600 text-center text-sm mt-4">{t('common.noShipment')}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}