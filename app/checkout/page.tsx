'use client';

import { useEffect, useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
// import { createstripeCheckout } from '../actions/stripe';
import { useRouter } from 'next/navigation';
import { CreditCard, Truck } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';
import { useTranslation } from '../context/LanguageContext';
import { supabaseClient } from '../../lib/supabaseClient';
import { calculateAllOffers, type Offer } from '../../lib/offers';
import { createPaymobPayment } from '../actions/paymob';

type PaymentMethod = 'paymob' | 'fawry' | 'cod';

export default function Checkout() {
  const router = useRouter();
  const { formatPrice, currency, currentRate } = useCurrency();
  const { t } = useTranslation();

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('paymob');

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

  // First-order welcome discount — auto-applied, no code needed, for any
  // logged-in account that has never placed an order before.
  const FIRST_ORDER_DISCOUNT_PCT = 5;
  const [isFirstOrder, setIsFirstOrder] = useState(false);

  // Offers (Buy X Get Y deals)
  const [offers, setOffers] = useState<Offer[]>([]);

  // Dynamic cities based on selected country
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [cityLoading, setCityLoading] = useState(false);


  // ==================== PRE-FILL EMAIL & PHONE IF LOGGED IN ====================
  useEffect(() => {
    const init = async () => {
      const [
        { data: { user } },
        { data: countries },
        { data: offersData },
      ] = await Promise.all([
        supabaseClient.auth.getUser(),
        supabaseClient
          .from('supported_countries')
          .select('*')
          .eq('enabled', true)
          .order('name'),
        supabaseClient
          .from('offers')
          .select('*')
          .eq('is_active', true),
      ]);

      if (user?.email) setEmail(user.email);
      if (user?.user_metadata?.phone) setPhone(user.user_metadata.phone);
      setAllCountries(countries || []);
      setOffers((offersData || []) as Offer[]);

      // ── Check first-order eligibility ──
      // Guests aren't eligible (nothing to tie the discount to, and they
      // could just refresh/clear localStorage to "re-qualify" endlessly).
      // Only logged-in accounts with zero prior orders qualify.
      if (user?.id) {
        const { count, error: orderCountError } = await supabaseClient
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id);

        if (!orderCountError) {
          setIsFirstOrder((count || 0) === 0);
        }
      }
    };
    init();
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
    if (!country) {
      setIsCountrySupported(true);
      setAvailableCities([]);
      setGovernorate('');
      return;
    }

    const selected = allCountries.find(c => c.code === country);
    setIsCountrySupported(selected?.enabled || false);
    setGovernorate('');
    setDeliveryFee(0);
    setIsFreeShipping(false);

    // For other countries — fetch cities from DB
    const fetchCities = async () => {
      setCityLoading(true);
      const { data } = await supabaseClient
        .from('free_shipping_cities')
        .select('city_name, is_free_shipping')
        .eq('country_code', country)
        .order('city_name');

      setAvailableCities((data || []).map((c: any) => c.city_name));
      setCityLoading(false);
    };

    fetchCities();
  }, [country, allCountries]);


  useEffect(() => {
    if (!governorate) { setDeliveryFee(0); return; }
    setDeliveryFee(0);
    setIsFreeShipping(false);
  }, [governorate, country]);

  // ==================== CHECK FREE SHIPPING FROM DB ====================
  useEffect(() => {
    if (!governorate || !country) return;

    const checkFreeShipping = async () => {
      const { data } = await supabaseClient
        .from('free_shipping_cities')
        .select('is_free_shipping, delivery_fee')
        .eq('country_code', country)
        .eq('city_name', governorate)
        .single();

      if (data?.is_free_shipping) {
        setDeliveryFee(0);
        setIsFreeShipping(true);
      } else {
        setIsFreeShipping(false);
        setDeliveryFee(data?.delivery_fee && data.delivery_fee > 0 ? data.delivery_fee : 0);
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

  // ── Buy X Get Y offers ──
  const { results: offerResults, totalDiscount: offersDiscount } = calculateAllOffers(items, offers);

  // ── First-order welcome discount (5%, auto-applied) ──
  const firstOrderDiscountAmount = isFirstOrder ? subtotal * (FIRST_ORDER_DISCOUNT_PCT / 100) : 0;

  const finalTotal = Math.max(0, subtotal - discountAmount - offersDiscount - firstOrderDiscountAmount + deliveryFee);

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

  };

  // ==================== CREATE OR UPDATE ORDER ====================
    const createOrUpdateOrder = async () => {
    let orderId = localStorage.getItem('pendingOrderId');

    const paymentLabel = paymentMethod === 'cod' ? 'Cash on Delivery' : 'Credit / Debit Card';
    const { data: { user } } = await supabaseClient.auth.getUser();

    let verifiedFirstOrderDiscount = 0;
    if (user?.id) {
      const { count: existingOrderCount } = await supabaseClient
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if ((existingOrderCount || 0) === 0) {
        verifiedFirstOrderDiscount = subtotal * (FIRST_ORDER_DISCOUNT_PCT / 100);
      }
    }

    const rawDiscountAmount = (discountAmount + offersDiscount + verifiedFirstOrderDiscount) || 0;
    const totalDiscountAmount = Math.min(rawDiscountAmount, subtotal + deliveryFee);

    const offerScale = rawDiscountAmount > 0 ? totalDiscountAmount / rawDiscountAmount : 1;
    const appliedOffers = offerResults
      .filter((r) => r.offerApplied)
      .map((r) => ({
        name: r.offerApplied!.name,
        discount: Math.round(r.totalDiscount * offerScale * 100) / 100,
      }));

    if (verifiedFirstOrderDiscount > 0) {
      appliedOffers.push({
        name: 'Welcome — First Order',
        discount: Math.round(verifiedFirstOrderDiscount * offerScale * 100) / 100,
      });
    }

    if (!orderId) {
      const initialStatus = paymentMethod === 'cod' ? 'succeeded' : 'pending';
      const orderEmail = user?.email || email || 'guest@georgiana.com';

      // Generate the ID client-side instead of relying on `.select()`
      // after the insert. Postgres RLS applies the table's SELECT policy
      // to RETURNING rows, and a guest (auth.uid() = null, user_id = null)
      // never satisfies "auth.uid() = user_id" — so `.select().single()`
      // was throwing an RLS error and aborting the whole insert for every
      // guest order. Supplying the id ourselves means we never need it
      // read back.
      const newOrderId = crypto.randomUUID();

      const { error } = await supabaseClient
        .from('orders')
        .insert({
          id: newOrderId,
          user_id: user?.id || null,
          user_email: orderEmail,
          contact_email: email || orderEmail,
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
          discount_amount: totalDiscountAmount,
          applied_offers: appliedOffers,
          currency: currency,
          currency_rate: currentRate
        });

      if (error) {
        console.error('Failed to create order:', error);
        throw new Error('Failed to create order');
      }

      orderId = newOrderId;
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
      const updateOrderEmail = user?.email || email || 'guest@georgiana.com';
      const { error: updateError } = await supabaseClient
        .from('orders')
        .update({
          user_id: user?.id || null,
          user_email: updateOrderEmail,
          contact_email: email || updateOrderEmail,
          phone: phone || null,
          street: street || null,
          apartment: apartment || null,
          city: city || 'Cairo',
          governorate: governorate || 'Cairo',
          delivery_fee: deliveryFee,
          payment_method: paymentLabel,
          status: paymentMethod === 'cod' ? 'succeeded' : 'pending',
          promo_code: appliedPromo?.code || null,
          discount_amount: totalDiscountAmount,
          applied_offers: appliedOffers,
          currency: currency,
          currency_rate: currentRate
        })
        .eq('id', orderId);

      if (updateError) console.error('Update error:', updateError);
    }

    return { orderId, verifiedFirstOrderDiscount };
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
      const { orderId, verifiedFirstOrderDiscount } = await createOrUpdateOrder();

      // Reconcile the amount we're about to charge with what the server
      // actually verified, in case the optimistic isFirstOrder flag from
      // page load was stale (e.g. an order completed in another tab).
      const reconciledTotal = Math.max(
        0,
        finalTotal - (verifiedFirstOrderDiscount - firstOrderDiscountAmount)
      );

      if (paymentMethod === 'paymob') {
        const paymobItems = items.map(item => ({
          name: item.name,
          price: Number(item.price),
          quantity: Number(item.quantity)
        }));

        // const result = await createPaymobCheckout(reconciledTotal, paymobItems, orderId);

        // if (result?.url) {
        //   localStorage.setItem('last_created_order_id', orderId);
        //   localStorage.removeItem('reviewOrder');
        //   window.location.href = result.url;
        // } else {
        //   throw new Error("No paymob URL returned");
        // }
        const result = await createPaymobPayment(
          reconciledTotal,
          paymobItems,
          orderId,
          { firstName, lastName, email, phone, street, apartment, city: governorate },
          appliedPromo?.code,
          appliedPromo?.discount_percentage
        );

        if (result?.url) {
          localStorage.setItem('last_created_order_id', orderId);
          localStorage.removeItem('reviewOrder');
          window.location.href = result.url;
        } else {
          throw new Error("No payment URL returned");
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
    
      <div className="min-h-screen bg-gray-50 py-20 overflow-x-hidden">
        <div className="max-w-6xl mx-auto px-4 md:px-4 md:grid-cols-5 gap-6 md:gap-10">

          {/* ==================== LEFT: FORM ==================== */}
          <div className="md:col-span-3">
            <h1 className="text-4xl font-light tracking-widest mb-10">{t('checkout.title')}</h1>

            <div className="bg-white rounded-3xl p-8">
              <h2 className="text-2xl font-medium mb-6">{t('checkout.contactInfo')}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input type="text" placeholder={t('checkout.firstName')} value={firstName} onChange={e => setFirstName(e.target.value)} className="border rounded-2xl px-5 py-4 w-full" />
                <input type="text" placeholder={t('checkout.lastName')} value={lastName} onChange={e => setLastName(e.target.value)} className="border rounded-2xl px-5 py-4 w-full" />
              </div>
              <input type="email" placeholder={t('checkout.email')} value={email} onChange={e => setEmail(e.target.value)} className="border rounded-2xl px-5 py-4 w-full mt-4" />
              <input type="tel" placeholder={t('checkout.phone')} value={phone} onChange={e => setPhone(e.target.value)} className="border rounded-2xl px-5 py-4 w-full mt-4" />

              <h2 className="text-2xl font-medium mt-12 mb-6">{t('checkout.shippingAddress')}</h2>
              <input type="text" placeholder={t('checkout.street')} value={street} onChange={e => setStreet(e.target.value)} className="border rounded-2xl px-5 py-4 w-full" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <input type="text" placeholder={t('checkout.apartment')} value={apartment} onChange={e => setApartment(e.target.value)} className="border rounded-2xl px-5 py-4 w-full" />
                <input type="text" placeholder={t('checkout.postalCode')} value={postalCode} onChange={e => setPostalCode(e.target.value)} className="border rounded-2xl px-5 py-4 w-full" />
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
                <label className="block text-sm font-medium mb-2">
                  {country === 'EG' ? 'Governorate' : 'City'}
                </label>
                <select
                  value={governorate}
                  onChange={(e) => setGovernorate(e.target.value)}
                  disabled={!country || cityLoading || availableCities.length === 0}
                  className="border rounded-2xl px-5 py-4 w-full focus:outline-none focus:border-black disabled:opacity-50"
                >
                  <option value="">
                    {!country
                      ? 'Select a country first'
                      : cityLoading
                        ? 'Loading cities...'
                        : availableCities.length === 0
                          ? 'No cities available'
                          : country === 'EG' ? 'Select Governorate' : 'Select City'
                    }
                  </option>
                  {availableCities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
              {!isCountrySupported && country && (
                <p className="text-red-600 text-sm mt-3 font-medium">
                  {t('common.noShipment')}
                </p>
              )}

              {/* Payment Methods */}
              <h2 className="text-2xl font-medium mt-12 mb-6">{t('checkout.paymentMethod')}</h2>
              <div className="space-y-4">
                {/* <label className={`flex items-center gap-4 p-5 border rounded-2xl cursor-pointer transition ${paymentMethod === 'paymob' ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-400'}`}>
                  <input type="radio" name="payment" checked={paymentMethod === 'paymob'} onChange={() => setPaymentMethod('paymob')} />
                  <CreditCard size={26} />
                  <div>
                    <p className="font-medium">{t('checkout.paymob')}</p>
                  </div>
                </label> */}

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
          <div className="md:col-span-2 py-12">
            <div className="bg-white rounded-3xl p-8 sticky top-8">
              <h2 className="text-2xl font-medium mb-8">{t('checkout.orderSummary')}</h2>

              {items.map((item, index) => (
                <div key={index} className="flex justify-between py-6 border-b last:border-b-0">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-500">
                      Size: {item.size} • Color: {item.color} • Qty: {item.quantity}
                    </p>
                    {item.isOnSale && item.discountPercentage > 0 && (
                      <span className="inline-block bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full mt-1">
                        -{item.discountPercentage}% OFF
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    {item.isOnSale && item.originalPrice ? (
                      <>
                        <p className="text-gray-400 line-through text-sm">
                          {formatPrice(Number(item.originalPrice) * Number(item.quantity))}
                        </p>
                        <p className="font-medium text-red-600">
                          {formatPrice(Number(item.price) * Number(item.quantity))}
                        </p>
                      </>
                    ) : (
                      <p className="font-medium">{formatPrice(Number(item.price) * Number(item.quantity))}</p>
                    )}
                  </div>
                </div>
              ))}

              {/* Promo Code */}
               <div className="mt-8 border-t pt-8">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Promo Code"
                    value={promoCodeInput}
                    onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                    className="border rounded-2xl px-4 py-4 flex-1 min-w-0 text-base font-mono tracking-widest uppercase"
                  />
                  <button
                    onClick={applyPromoCode}
                    className="bg-black text-white px-6 py-4 rounded-2xl hover:bg-gray-800 transition shrink-0 text-sm font-medium"
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
                {items.some(i => i.isOnSale) && (
                  <div className="flex justify-between text-gray-400 line-through text-base">
                    <span>Original</span>
                    <span>{formatPrice(items.reduce((sum, i) => sum + Number(i.originalPrice || i.price) * Number(i.quantity), 0))}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                {items.some(i => i.isOnSale) && (
                  <div className="flex justify-between text-red-600 text-sm">
                    <span>Item Savings</span>
                    <span>-{formatPrice(items.reduce((sum, i) => sum + (Number(i.originalPrice || i.price) - Number(i.price)) * Number(i.quantity), 0))}</span>
                  </div>
                )}

                {/* Buy X Get Y offers */}
                {offerResults.length > 0 && offerResults.map((r, i) => (
                  <div key={i} className="flex justify-between items-start gap-4 text-emerald-600">
                    <span className="min-w-0">🏷️ {r.offerApplied?.name}</span>
                    <span className="shrink-0 whitespace-nowrap">-{formatPrice(r.totalDiscount)}</span>
                  </div>
                ))}

                {/* Welcome first-order discount — auto-applied, no code needed */}
                {isFirstOrder && firstOrderDiscountAmount > 0 && (
                  <div className="flex justify-between items-start gap-4 text-emerald-600">
                    <span className="min-w-0">🎉 Welcome offer ({FIRST_ORDER_DISCOUNT_PCT}% off)</span>
                    <span className="shrink-0 whitespace-nowrap">-{formatPrice(firstOrderDiscountAmount)}</span>
                  </div>
                )}

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
                  <div className="flex justify-between items-start gap-4 text-red-600">
                    <span className="min-w-0">Discount ({appliedPromo.discount_percentage}%)</span>
                    <span className="shrink-0 whitespace-nowrap">-{formatPrice(discountAmount)}</span>
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