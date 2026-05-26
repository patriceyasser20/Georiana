'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabaseClient } from '../../../../lib/supabaseClient';
import { Check, ArrowLeft, Plus, Trash2 } from 'lucide-react';

// Default cities per country — extend as needed
const DEFAULT_CITIES: Record<string, string[]> = {
  EG: [
    'Cairo', 'Giza', 'Alexandria', 'Port Said', 'Suez', 'Luxor', 'Aswan',
    'Ismailia', 'Damietta', 'Sharqia', 'Dakahlia', 'Beheira', 'Kafr El Sheikh',
    'Matruh', 'Red Sea', 'South Sinai', 'North Sinai', 'Qena', 'Sohag',
    'Assiut', 'Beni Suef', 'Fayoum', 'Minya',
  ],
  SA: ['Riyadh', 'Jeddah', 'Mecca', 'Medina', 'Dammam', 'Khobar', 'Tabuk', 'Abha'],
  AE: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain'],
  US: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio'],
  GB: ['London', 'Manchester', 'Birmingham', 'Glasgow', 'Liverpool', 'Edinburgh', 'Bristol'],
  FR: ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg'],
  DE: ['Berlin', 'Hamburg', 'Munich', 'Cologne', 'Frankfurt', 'Stuttgart', 'Düsseldorf'],
  IT: ['Rome', 'Milan', 'Naples', 'Turin', 'Palermo', 'Genoa', 'Bologna'],
  TR: ['Istanbul', 'Ankara', 'Izmir', 'Bursa', 'Antalya', 'Adana', 'Konya'],
  JO: ['Amman', 'Zarqa', 'Irbid', 'Aqaba', 'Madaba', 'Jerash', 'Ajloun'],
  KW: ['Kuwait City', 'Salmiya', 'Hawalli', 'Farwaniya', 'Ahmadi', 'Jahra'],
  QA: ['Doha', 'Al Rayyan', 'Al Wakrah', 'Al Khor', 'Umm Salal'],
  BH: ['Manama', 'Riffa', 'Muharraq', 'Hamad Town', 'Sitra'],
  OM: ['Muscat', 'Salalah', 'Sohar', 'Nizwa', 'Sur'],
};

export default function ShippingCityManager() {
  const { countryCode } = useParams() as { countryCode: string };
  const router = useRouter();

  const [countryName, setCountryName] = useState('');
  const [cities, setCities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newCityInput, setNewCityInput] = useState('');

  useEffect(() => {
    if (localStorage.getItem('isAdmin') !== 'true') {
      router.push('/admin/login');
      return;
    }
    init();
  }, [countryCode]);

  const init = async () => {
    setLoading(true);

    // Get country name
    const { data: countryData } = await supabaseClient
      .from('supported_countries')
      .select('name')
      .eq('code', countryCode)
      .single();

    setCountryName(countryData?.name || countryCode);

    // Load existing cities from DB
    const { data: existingCities } = await supabaseClient
      .from('free_shipping_cities')
      .select('*')
      .eq('country_code', countryCode)
      .order('city_name');

    if (existingCities && existingCities.length > 0) {
      setCities(existingCities);
    } else {
      // Seed with defaults if nothing exists yet for this country
      const defaults = DEFAULT_CITIES[countryCode] || [];
      if (defaults.length > 0) {
        const toInsert = defaults.map((city) => ({
          country_code: countryCode,
          city_name: city,
          is_free_shipping: false,
        }));
        const { data: inserted } = await supabaseClient
          .from('free_shipping_cities')
          .insert(toInsert)
          .select();
        setCities(inserted || []);
      } else {
        setCities([]);
      }
    }

    setLoading(false);
  };

  const toggleCity = async (id: string, current: boolean) => {
    setSaving(true);
    await supabaseClient
      .from('free_shipping_cities')
      .update({ is_free_shipping: !current })
      .eq('id', id);

    setCities((prev) =>
      prev.map((c) => (c.id === id ? { ...c, is_free_shipping: !current } : c))
    );
    setSaving(false);
  };

  const toggleAll = async (enable: boolean) => {
    setSaving(true);
    await supabaseClient
      .from('free_shipping_cities')
      .update({ is_free_shipping: enable })
      .eq('country_code', countryCode);

    setCities((prev) => prev.map((c) => ({ ...c, is_free_shipping: enable })));
    setSaving(false);
  };

  const addCity = async () => {
    const name = newCityInput.trim();
    if (!name) return;

    const alreadyExists = cities.some(
      (c) => c.city_name.toLowerCase() === name.toLowerCase()
    );
    if (alreadyExists) {
      alert('City already exists in the list');
      return;
    }

    const { data, error } = await supabaseClient
      .from('free_shipping_cities')
      .insert({ country_code: countryCode, city_name: name, is_free_shipping: false })
      .select()
      .single();

    if (error) {
      alert('Failed to add city: ' + error.message);
    } else {
      setCities((prev) =>
        [...prev, data].sort((a, b) => a.city_name.localeCompare(b.city_name))
      );
      setNewCityInput('');
    }
  };

  const deleteCity = async (id: string) => {
    if (!confirm('Remove this city from the list?')) return;
    await supabaseClient.from('free_shipping_cities').delete().eq('id', id);
    setCities((prev) => prev.filter((c) => c.id !== id));
  };

  const freeCount = cities.filter((c) => c.is_free_shipping).length;

  return (
    <div className="min-h-screen bg-gray-50 py-30 px-4 md:px-6">
      <div className="max-w-4xl mx-auto">

        {/* Back Button */}
        <button
          onClick={() => router.push('/admin')}
          className="flex items-center gap-2 text-gray-500 hover:text-black mb-6 transition text-sm "
        >
          <ArrowLeft size={16} /> Back to Admin Panel
        </button>

        {/* Page Header */}
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="text-2xl md:text-4xl font-light tracking-widest">Free Shipping Cities</h1>
            <p className="text-gray-500 mt-2 text-sm">
              {countryName} ({countryCode}) —{' '}
              <span className="text-green-600 font-medium">{freeCount} free</span>{' '}
              of {cities.length} cities
            </p>
          </div>
          {saving && (
            <p className="text-sm text-gray-400 mt-1 animate-pulse">Saving...</p>
          )}
        </div>

        {/* Info Banner */}
        <div className="mt-5 mb-6 bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3 text-sm text-blue-700">
           Cities marked as <strong>Free Shipping</strong> will show a "Free" badge at checkout.
        </div>

        {/* Toggle All Buttons — stack on mobile */}
        {!loading && cities.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <button
              onClick={() => toggleAll(true)}
              className="w-full sm:w-auto px-6 py-3 bg-green-600 text-white rounded-full text-sm font-medium hover:bg-green-700 transition"
            >
              ✓ Free shipping for all cities
            </button>
            <button
              onClick={() => toggleAll(false)}
              className="w-full sm:w-auto px-6 py-3 bg-white border rounded-full text-sm font-medium hover:bg-gray-50 transition"
            >
              Clear all
            </button>
          </div>
        )}

        {loading ? (
          <p className="text-center py-20 text-gray-400">Loading cities...</p>
        ) : (
          <>
            {/* City Grid */}
            {cities.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <p className="text-lg mb-2">No cities yet for {countryName}</p>
                <p className="text-sm">Add cities manually using the form below.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-10">
                {cities.map((city) => (
                  <div
                    key={city.id}
                    className={`flex items-center justify-between px-4 py-3 border rounded-2xl transition ${
                      city.is_free_shipping
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 bg-white hover:border-gray-400'
                    }`}
                  >
                    {/* Toggle area */}
                    <div
                      className="flex items-center gap-3 flex-1 cursor-pointer"
                      onClick={() => toggleCity(city.id, city.is_free_shipping)}
                    >
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center border-2 shrink-0 transition ${
                          city.is_free_shipping
                            ? 'border-green-500 bg-green-500'
                            : 'border-gray-300'
                        }`}
                      >
                        {city.is_free_shipping && <Check size={12} className="text-white" />}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{city.city_name}</p>
                        {city.is_free_shipping && (
                          <p className="text-xs text-green-600 font-medium">Free shipping</p>
                        )}
                      </div>
                    </div>

                    {/* Delete */}
                    <button
                      onClick={() => deleteCity(city.id)}
                      className="text-gray-300 hover:text-red-500 transition ml-2 shrink-0"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Custom City */}
            <div className="bg-white border rounded-3xl p-6 md:p-8">
              <h3 className="text-lg font-medium mb-2">Add a Custom City</h3>
              <p className="text-sm text-gray-500 mb-5">
                Don't see a city? Add it manually and then toggle free shipping.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="City name..."
                  value={newCityInput}
                  onChange={(e) => setNewCityInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCity()}
                  className="border rounded-2xl px-5 py-4 w-full text-base md:text-lg"
                />
                <button
                  onClick={addCity}
                  disabled={!newCityInput.trim()}
                  className="bg-black text-white px-8 py-4 rounded-2xl hover:bg-gray-800 disabled:opacity-50 transition flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  <Plus size={18} /> Add City
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}