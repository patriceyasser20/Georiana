// lib/adminApi.ts
async function getToken(): Promise<string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
  if (!token) throw new Error('Not authenticated. Please log in to your admin account.');
  return token;
}

async function call(action: string, payload: any) {
  const token = await getToken();
  const res = await fetch('/api/admin-ops', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-token': token,
    },
    body: JSON.stringify({ action, payload }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Admin API error');
  return json;
}


export const adminApi = {
  insertProduct:         (payload: any)                   => call('insert-product',          payload),
  updateProduct:         (id: string, data: any)          => call('update-product',           { id, ...data }),
  deleteProduct:         (id: string)                     => call('delete-product',           { id }),
  insertVariants:        (variants: any[])                => call('insert-variants',          { variants }),
  updateVariantDiscount: (id: string, data: any)          => call('update-variant-discount',  { id, ...data }),
  restock:               (id: string, newStock: number)   => call('restock',                  { id, newStock }),
  insertPromo:           (payload: any)                   => call('insert-promo',             payload),
  updatePromo:           (id: string, data: any)          => call('update-promo',             { id, ...data }),
  deletePromo:           (id: string)                     => call('delete-promo',             { id }),
  toggleCountry:         (code: string, enabled: boolean) => call('toggle-country',           { code, enabled }),
  upsertShipping:        (payload: any)                   => call('upsert-shipping-city',     payload),
  insertOffer:           (payload: any)                   => call('insert-offer',             payload),
  updateOffer:           (id: string, data: any)          => call('update-offer',              { id, ...data }),
  deleteOffer:           (id: string)                     => call('delete-offer',             { id }),
  setFeatured:           (productId: string, section: string, position: number) =>
                                                               call('set-featured',             { productId, section, position }),
  unsetFeatured:         (productId: string, section: string) =>
                                                               call('unset-featured',           { productId, section }),
  clearFeatured:         (section: string)                 => call('clear-featured',           { section }),
  getFeatured:           async (section: string): Promise<string[]> => {
                                                               const res = await call('get-featured', { section });
                                                               return (res.data || []).map((r: any) => r.product_id);
                                                             },
  getShippingCities:     (countryCode: string)              => call('get-shipping-cities', { countryCode }),
  seedShippingCities:    (cities: any[])                     => call('seed-shipping-cities', { cities }),
  insertShippingCity:    (payload: any)                      => call('insert-shipping-city', payload),
  updateShippingCity:    (id: string, data: any)             => call('update-shipping-city', { id, ...data }),
  deleteShippingCity:    (id: string)                        => call('delete-shipping-city', { id }),
  toggleAllShippingCities: (countryCode: string, enable: boolean) =>
                                                                  call('toggle-all-shipping-cities', { countryCode, enable }),
  clearCollection:       (collection: string)              => call('clear-collection',        { collection }),
};