'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import { supabaseClient } from '../../lib/supabaseClient';
import { RefreshCw, X, Plus, Trash2, Check, Edit2, User, PackagePlus, Tag, ChevronDown } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';
import { adminApi } from '../../lib/adminApi';
import { invalidateCache } from '../../lib/productCache';
import Image from 'next/image';
import { useRequireAuth } from '../../lib/useRequireAuth';

// ==================== SKU AUTO-GENERATION ====================
const COLOR_CODES: Record<string, string> = {
  black: 'BLK', white: 'WHT', red: 'RED', blue: 'BLU', navy: 'NVY',
  green: 'GRN', yellow: 'YLW', pink: 'PNK', purple: 'PPL',
  gray: 'GRY', grey: 'GRY', brown: 'BRN', beige: 'BEG',
  orange: 'ORG', gold: 'GLD', silver: 'SLV', cream: 'CRM',
  maroon: 'MRN', olive: 'OLV', teal: 'TEA', turquoise: 'TRQ',
};

function colorCode(colorName: string): string {
  const key = colorName.trim().toLowerCase();
  if (COLOR_CODES[key]) return COLOR_CODES[key];
  const letters = key.replace(/[^a-z]/g, '');
  return (letters.slice(0, 3) || 'XXX').toUpperCase().padEnd(3, 'X');
}

function buildSku(prefix: string, typeCode: string, seq: number, color: string, size: string): string {
  const seqStr = String(seq).padStart(3, '0');
  return `${prefix}-${typeCode.toUpperCase()}-${seqStr}-${colorCode(color)}-${size.trim().toUpperCase()}`;
}

async function getNextSeqForType(typeCode: string): Promise<number> {
  const { data } = await supabaseClient
    .from('product_variants')
    .select('sku')
    .eq('type_code', typeCode.toUpperCase());

  let max = 0;
  (data || []).forEach((row: any) => {
    const match = row.sku?.match(new RegExp(`-${typeCode.toUpperCase()}-(\\d{3})-`));
    if (match) {
      const n = parseInt(match[1], 10);
      if (n > max) max = n;
    }
  });
  return max + 1;
}
async function compressImage(file: File, maxWidth = 1600, quality = 0.82): Promise<File> {
  let workingFile = file;
  

  // HEIC/HEIF isn't decodable by createImageBitmap in most browsers (Chrome, Firefox) —
  // convert to JPEG first so the rest of the pipeline works everywhere.
  const isHeic =
    file.type === 'image/heic' ||
    file.type === 'image/heif' ||
    /\.hei[cf]$/i.test(file.name);

  if (isHeic) {
    const heic2any = (await import('heic2any')).default;
    const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality });
    const convertedBlob = Array.isArray(converted) ? converted[0] : converted;
    workingFile = new File(
      [convertedBlob],
      file.name.replace(/\.hei[cf]$/i, '.jpg'),
      { type: 'image/jpeg' }
    );
  }

  const bitmap = await createImageBitmap(workingFile);
  const scale = Math.min(1, maxWidth / bitmap.width);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width * scale;
  canvas.height = bitmap.height * scale;

  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

  const blob: Blob = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b!), 'image/jpeg', quality)
  );

  return new File([blob], workingFile.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' });
}

export default function AdminPanel() {
  useRequireAuth();
  const router = useRouter();
  const { formatPrice, formatPriceAs } = useCurrency();

  const [tab, setTab] = useState<'products' | 'orders' | 'shipping' | 'sku-search' | 'promo-codes' | 'featured' | 'offers' | 'newsletter'>('featured');
  const [skuSearchTerm, setSkuSearchTerm] = useState('');
  const [skuSearchResult, setSkuSearchResult] = useState<any[]>([]);
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

  type ImageItem = { key: string; type: 'existing' | 'new'; url: string; file?: File; color: string };
  const [imageItems, setImageItems] = useState<ImageItem[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // ── Restock modal state ──
  const [restockModal, setRestockModal] = useState<{
    open: boolean;
    productId: string;
    productName: string;
    variants: any[];
  }>({ open: false, productId: '', productName: '', variants: [] });
  const [restockAmounts, setRestockAmounts] = useState<Record<string, number>>({});
  const [restocking, setRestocking] = useState(false);

  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [subscribers, setSubscribers] = useState<{ email: string; marketing_opt_out: boolean }[]>([]);
  const [subscribersOpen, setSubscribersOpen] = useState(false);
  const [loadingSubscribers, setLoadingSubscribers] = useState(false);

  const [newsletterForm, setNewsletterForm] = useState({
    subject: '',
    headline: '',
    bodyText: '',
    imageUrl: '',
    ctaText: '',
    ctaLink: '',
  });
  const [testEmail, setTestEmail] = useState('');
  const [sendingNewsletter, setSendingNewsletter] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);

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

  const [allVariants, setAllVariants] = useState<any[]>([]);
  const [featuredIds, setFeaturedIds] = useState<string[]>([]);
  // Tracks the next position to assign when featuring a product. A ref
  // (not state) so it updates synchronously and can never be stale even if
  // two cards are clicked in quick succession — unlike reading
  // featuredIds.length from a closure, which can lag behind rapid clicks
  // and cause two products to be written with the same position.
  const nextFeaturedPositionRef = useRef(0);
  const [featuredSaving, setFeaturedSaving] = useState<string | null>(null);
  const [offers, setOffers] = useState<any[]>([]);

  // ── Offers tab — local form state (inlined, no separate component) ──
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [editingOffer, setEditingOffer] = useState<any>(null);
  const [offerForm, setOfferForm] = useState({
    name: '',
    offer_type: 'bxgy_free' as 'bxgy_free' | 'bxgy_percent',
    buy_quantity: 2,
    get_quantity: 1,
    discount_percentage: 100,
    scope_type: 'product' as 'product' | 'category' | 'collection' | 'all',
    scope_value: '',
    require_same_variant: false,
    is_active: true,
    ends_at: '',
  });
  const [savingOffer, setSavingOffer] = useState(false);

  const markOrderAsShipped = async (order: any) => {
    if (!confirm("Mark this order as shipped?")) return;

    try {
      // Update database
      const { error } = await supabaseClient
        .from("orders")
        .update({
          status: "shipped",
        })
        .eq("id", order.id);

      if (error) throw error;

      // Send email
      await fetch("/api/send-shipped-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          order,
        }),
      });


      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Auto-search as the SKU input changes, debounced 400ms so it doesn't
  // fire a query on every keystroke — only after typing pauses briefly.
  useEffect(() => {
    if (tab !== 'sku-search') return;
    if (!skuSearchTerm.trim()) {
      setSkuSearchResult([]);
      return;
    }

    const timeout = setTimeout(() => {
      searchBySku();
    }, 400);

    return () => clearTimeout(timeout);
  }, [skuSearchTerm, tab]);

  useEffect(() => {
    if (tab !== 'newsletter') return;
    const fetchSubscribers = async () => {
      setLoadingSubscribers(true);
      try {
        const data = await adminApi.getSubscribers();
        setSubscribers(data);
      } catch (err: any) {
        console.error('Failed to load subscribers:', err);
      }
      setLoadingSubscribers(false);
    };
    fetchSubscribers();
  }, [tab]);

  useEffect(() => {
    const verifyAdmin = async () => {
      const token = localStorage.getItem('adminToken');
      if (!token) { router.push('/admin/login'); return; }

      // Verify token is real by hitting the protected API
      const res = await fetch('/api/admin-ops', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token,
        },
        body: JSON.stringify({ action: 'ping', payload: {} }),
      });

      if (res.status === 401) {
        localStorage.removeItem('isAdmin');
        localStorage.removeItem('adminToken');
        router.push('/admin/login');
        return;
      }

      loadData(); // or init() for the shipping page
    };

    verifyAdmin();
  }, [router]);

    const loadData = async () => {
    setLoading(true);

    const [
      [productsRes, countriesRes, promoRes, variantsRes, offersRes],
      featuredProductIds,
      ordersData,
    ] = await Promise.all([
      Promise.all([
        supabaseClient.from('products').select('*'),
        supabaseClient.from('supported_countries').select('*').order('name'),
        supabaseClient.from('promo_codes').select('*').order('created_at', { ascending: false }),
        supabaseClient.from('product_variants').select('*'),
        supabaseClient.from('offers').select('*').order('created_at', { ascending: false }),
      ]),
      adminApi.getFeatured('new_this_week').catch(() => [] as string[]),
      // Routed through the service role — orders' SELECT policy was
      // tightened to stop leaking customer PII to anonymous requests,
      // which also means the anon-key client here (correctly) can no
      // longer see any orders at all. Same pattern as every other
      // admin read/write on this page.
      adminApi.getOrders().catch(() => [] as any[]),
    ]);

    setProducts(productsRes.data || []);
    setOrders(ordersData);
    setSupportedCountries(countriesRes.data || []);
    setPromoCodes(promoRes.data || []);
    setAllVariants(variantsRes.data || []);
    setFeaturedIds(featuredProductIds);
    nextFeaturedPositionRef.current = featuredProductIds.length;
    setOffers(offersRes.data || []);

    const uniqueCollections = [...new Set(
      (productsRes.data || []).map((p: any) => p.collection).filter(Boolean)
    )];
    setCollections(uniqueCollections);

    setLoading(false);
  };

  //=====================NEWSLETTER===================
  const sendTestNewsletter = async () => {
    if (!testEmail.trim()) { alert('Enter an email to send the test to'); return; }
    if (!newsletterForm.subject.trim() || !newsletterForm.headline.trim() || !newsletterForm.bodyText.trim()) {
      alert('Subject, headline, and body are required'); return;
    }
    setSendingTest(true);
    try {
      await adminApi.sendNewsletter({ ...newsletterForm, testEmail: testEmail.trim() });
      alert('✅ Test email sent to ' + testEmail);
    } catch (err: any) {
      alert('Failed to send test: ' + err.message);
    }
    setSendingTest(false);
  };

  const handleBannerUpload = async (file: File) => {
    setUploadingBanner(true);
    try {
      const compressed = await compressImage(file, 1200, 0.82);
      const fileExt = compressed.name.split('.').pop();
      const fileName = `newsletter-${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

      const { error: uploadError } = await supabaseClient.storage
        .from('product-images')
        .upload(fileName, compressed, {
          cacheControl: '31536000',
          upsert: false,
        });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabaseClient.storage
        .from('product-images')
        .getPublicUrl(fileName);

      setNewsletterForm(prev => ({ ...prev, imageUrl: urlData.publicUrl }));
    } catch (err: any) {
      alert('Failed to upload image: ' + (err?.message || err));
    }
    setUploadingBanner(false);
  };

  const sendNewsletterToAll = async () => {
    if (!newsletterForm.subject.trim() || !newsletterForm.headline.trim() || !newsletterForm.bodyText.trim()) {
      alert('Subject, headline, and body are required'); return;
    }
    if (!confirm('Send this email to ALL subscribed users? This cannot be undone.')) return;

    setSendingNewsletter(true);
    try {
      const result = await adminApi.sendNewsletter(newsletterForm);
      alert(`✅ Sent to ${result.sent} of ${result.total} users${result.failed > 0 ? ` (${result.failed} failed)` : ''}`);
      setNewsletterForm({ subject: '', headline: '', bodyText: '', imageUrl: '', ctaText: '', ctaLink: '' });
    } catch (err: any) {
      alert('Failed to send: ' + err.message);
    }
    setSendingNewsletter(false);
  };

  // ==================== RESTOCK ====================
  const openRestockModal = async (product: any) => {
    const { data: productVariants } = await supabaseClient
      .from('product_variants')
      .select('*')
      .eq('product_id', product.id)
      .order('color');
 
    const initial: Record<string, number> = {};
    (productVariants || []).forEach((v: any) => { initial[v.id] = 0; });
 
    setRestockAmounts(initial);
    setRestockModal({
      open: true,
      productId: product.id,
      productName: product.name,
      variants: productVariants || [],
    });
  };
 
  const submitRestock = async () => {
    setRestocking(true);
    try {
      const updates = Object.entries(restockAmounts).filter(([, amt]) => amt > 0);
 
      await Promise.all(
        updates.map(([variantId, amount]) => {
          const variant = restockModal.variants.find((v: any) => v.id === variantId);
          return adminApi.restock(variantId, (variant?.stock || 0) + amount);
        })
      );
 
      alert('✅ Stock updated successfully!');
      setRestockModal({ open: false, productId: '', productName: '', variants: [] });
      loadData();
    } catch (err: any) {
      alert('Failed to restock: ' + err.message);
    }
    setRestocking(false);
  };
 
  // Helper: does a product have any out-of-stock variants?
  const hasOutOfStock = (productId: string) =>
    allVariants.some(v => v.product_id === productId && v.stock === 0);
 
  const isFullyOutOfStock = (productId: string) => {
    const pv = allVariants.filter(v => v.product_id === productId);
    return pv.length > 0 && pv.every(v => v.stock === 0);
  };

  // ==================== DELETE COLLECTION ====================
  const deleteCollection = async (colName: string) => {
    if (!confirm(`Delete collection "${colName}"?\n\nAll products will stay, but they will no longer belong to this collection.`)) return;

    try {
      await adminApi.clearCollection(colName);
      alert(`✅ Collection "${colName}" deleted. Products are kept.`);
      invalidateCache('all-products');
      invalidateCache('home-products');
      invalidateCache('header-collections');
      loadData();
    } catch (err: any) {
      alert('Failed: ' + err.message);
    }
  };

  // ==================== PROMO CODE FUNCTIONS ====================
  const addPromoCode = async () => {
    if (!promoForm.code.trim() || !promoForm.discountPercentage) {
      alert('Code and discount percentage are required'); return;
    }
    try {
      await adminApi.insertPromo({
        code: promoForm.code.trim().toUpperCase(),
        discount_percentage: Number(promoForm.discountPercentage),
        expires_at: promoForm.neverExpires ? null : promoForm.expiresAt || null,
      });
      alert('✅ Promo code added successfully!');
      setPromoForm({ code: '', discountPercentage: '', expiresAt: '', neverExpires: false });
      loadData();
    } catch (err: any) { alert('Error: ' + err.message); }
  };

  const renewPromoCode = async (id: string) => {
    const newDate = prompt('Enter new expiration date (YYYY-MM-DD):');
    if (!newDate) return;
    try { await adminApi.updatePromo(id, { expires_at: newDate }); loadData(); }
    catch (err: any) { alert('Error: ' + err.message); }
  };

  const deletePromoCode = async (id: string) => {
    if (!confirm('Delete this promo code?')) return;
    try { await adminApi.deletePromo(id); loadData(); }
    catch (err: any) { alert('Error: ' + err.message); }
  };

  const addVariant = async (typeCode?: string) => {
    let seq = 1;
    if (typeCode) {
      seq = await getNextSeqForType(typeCode);
    }
    setVariants([...variants, { color: '', size: '', stock: 0, sku: '', typeCode: typeCode || '', isOnSale: false, discountPercentage: 0 }]);
  };
  const removeNewImage = (index: number) => {
    setForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };


  const updateVariant = (index: number, field: string, value: any) => {
    const newVariants = [...variants];
    newVariants[index][field] = value;
    setVariants(newVariants);
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const addNewImages = async (files: File[]) => {
  const results = await Promise.allSettled(files.map(f => compressImage(f)));

  const compressed: File[] = [];
  const failed: string[] = [];

  results.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      compressed.push(r.value);
    } else {
      failed.push(`${files[i].name}: ${r.reason?.message || r.reason}`);
    }
  });

  if (failed.length > 0) {
    alert(`Some images couldn't be processed:\n${failed.join('\n')}`);
  }

  const newItems: ImageItem[] = compressed.map(file => ({
    key: `new-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type: 'new',
    url: URL.createObjectURL(file),
    file,
    color: '',
  }));
  setImageItems(prev => [...prev, ...newItems]);
};

const setImageColor = (key: string, color: string) => {
  setImageItems(prev => prev.map(item => item.key === key ? { ...item, color } : item));
};

const removeImageItem = (key: string) => {
  setImageItems(prev => {
    const target = prev.find(i => i.key === key);
    if (target?.type === 'new') URL.revokeObjectURL(target.url);
    return prev.filter(i => i.key !== key);
  });
};

const handleDragStart = (index: number) => setDraggedIndex(index);

const handleDragOver = (e: React.DragEvent, index: number) => {
  e.preventDefault();
  if (draggedIndex === null || draggedIndex === index) return;
  setImageItems(prev => {
    const updated = [...prev];
    const [moved] = updated.splice(draggedIndex, 1);
    updated.splice(index, 0, moved);
    return updated;
  });
  setDraggedIndex(index);
};

const handleDragEnd = () => setDraggedIndex(null);

  const openModal = async (product?: any) => {
    if (product) {
      setEditingProduct(product);

      const byColor: Record<string, string[]> = product.images_by_color || {};
      const urlToColor = new Map<string, string>();
      Object.entries(byColor).forEach(([color, urls]) => {
        (urls as string[]).forEach(u => { if (!urlToColor.has(u)) urlToColor.set(u, color); });
      });

      setImageItems(
        (product.images || []).map((url: string, i: number) => ({
          key: `existing-${i}-${url}`,
          type: 'existing' as const,
          url,
          color: urlToColor.get(url) || '',
        }))
      );

      setForm({ /* unchanged */ 
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
          typeCode: v.type_code || '',
          isOnSale: v.is_on_sale || false,
          discountPercentage: v.discount_percentage || 0,
        }))
      );
    } else {
      setEditingProduct(null);
      setImageItems([]);
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
      imageItems.length === 0 ||
      variants.length === 0 ||
      variants.some((v) => !v.color?.trim() || !v.size?.trim() || !v.sku?.trim() || !v.typeCode?.trim())
    ) {
      alert('Name, price, images, and for each variant: color, size, SKU, and Type Code are required');
      return;
    }

    setUploading(true);

    try {
      const imageUrls: string[] = [];
      const thumbUrls: string[] = [];
      const imagesByColor: Record<string, string[]> = {};

      for (const item of imageItems) {
        let url: string;
        let thumbUrl: string;

        if (item.type === 'existing') {
          url = item.url;
          // No original File to re-derive a thumb from without fetching the
          // remote image — fall back to the full image for now. The backfill
          // script (below) upgrades these in bulk after this ships.
          thumbUrl = item.url;
        } else if (item.file) {
          const fileExt = item.file.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

          const { error: uploadError } = await supabaseClient.storage
            .from('product-images')
            .upload(fileName, item.file, {
              cacheControl: '31536000',
              upsert: false,
            });
          if (uploadError) throw uploadError;

          const { data: urlData } = supabaseClient.storage
            .from('product-images')
            .getPublicUrl(fileName);
          url = urlData.publicUrl;

          // ── Thumbnail (grid-sized) ──
          const thumbFile = await compressImage(item.file, 400, 0.75);
          const thumbFileName = `thumb-${fileName}`;
          const { error: thumbUploadError } = await supabaseClient.storage
            .from('product-images')
            .upload(thumbFileName, thumbFile, {
              cacheControl: '31536000',
              upsert: false,
            });
          if (thumbUploadError) throw thumbUploadError;

          const { data: thumbUrlData } = supabaseClient.storage
            .from('product-images')
            .getPublicUrl(thumbFileName);
          thumbUrl = thumbUrlData.publicUrl;
        } else {
          continue;
        }

        imageUrls.push(url);
        thumbUrls.push(thumbUrl);
        if (item.color) {
          if (!imagesByColor[item.color]) imagesByColor[item.color] = [];
          imagesByColor[item.color].push(url);
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
        images: imageUrls,           // ← thumbnail is imageUrls[0]
        thumbnail_url: thumbUrls[0] || imageUrls[0] || null,
        images_by_color: imagesByColor,
      };

      if (editingProduct) {
        await adminApi.updateProduct(editingProduct.id, productData);

        // Existing variants (have an id) → update in place, full fields
        // not just the sale ones, so edits to stock/color/size/sku here
        // actually persist too.
        const existingVariants = variants.filter(v => v.id);
        await Promise.all(
          existingVariants.map(v =>
            adminApi.updateVariantDiscount(v.id, {
              color: v.color.trim(),
              size: v.size.trim(),
              stock: Number(v.stock),
              sku: v.sku.trim(),
              type_code: v.typeCode.trim().toUpperCase(),
              is_on_sale: v.isOnSale || false,
              discount_percentage: v.isOnSale ? Number(v.discountPercentage) || 0 : 0,
            })
          )
        );

        // Newly added variants (no id yet) → insert them
        const newVariants = variants.filter(v => !v.id);
        if (newVariants.length > 0) {
          await adminApi.insertVariants(newVariants.map((v) => ({
            product_id: editingProduct.id,
            color: v.color.trim(),
            size: v.size.trim(),
            stock: Number(v.stock),
            sku: v.sku.trim(),
            type_code: v.typeCode.trim().toUpperCase(),
            is_on_sale: v.isOnSale || false,
            discount_percentage: v.isOnSale ? Number(v.discountPercentage) || 0 : 0,
          })));
        }

        alert('✅ Product updated successfully!');
      } else {
        const { data: newProduct } = await adminApi.insertProduct(productData);
        if (!newProduct) throw new Error('Product was not created');

        await adminApi.insertVariants(variants.map((v) => ({
          product_id: newProduct.id,
          color: v.color.trim(),
          size: v.size.trim(),
          stock: Number(v.stock),
          sku: v.sku.trim(),
          type_code: v.typeCode.trim().toUpperCase(),
          is_on_sale: v.isOnSale || false,
          discount_percentage: v.isOnSale ? Number(v.discountPercentage) || 0 : 0,
        })));
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
      invalidateCache('all-products');
      invalidateCache('home-products');
      invalidateCache(`category-${form.category.toLowerCase()}`);
      if (form.collection) invalidateCache(`collection-${form.collection.toLowerCase().replace(/\s+/g, '-')}`);
      invalidateCache('header-categories');
      invalidateCache('header-collections');
      invalidateCache('active-offers');
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
      await adminApi.deleteProduct(id); 
      alert('✅ Product deleted successfully'); 
      loadData(); 
      invalidateCache('all-products');
      invalidateCache('home-products');
    }
    catch (err: any) { alert('Failed to delete: ' + err.message); }
  };

  const toggleCountry = async (code: string, currentEnabled: boolean) => {
    await adminApi.toggleCountry(code, !currentEnabled);
    loadData();
  };

  const searchBySku = async () => {
    if (!skuSearchTerm.trim()) return;

    setSearching(true);
    setSkuSearchResult([]);

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
          thumbnail_url,
          category,
          collection,
          is_on_sale,
          discount_percentage
        )
      `)
      .ilike('sku', `%${skuSearchTerm.trim().toUpperCase()}%`)
      .order('sku');

    if (error) {
      alert('Search failed: ' + error.message);
      setSkuSearchResult([]);
    } else {
      setSkuSearchResult(data || []);
    }

    setSearching(false);
  };

  // ==================== OFFERS FUNCTIONS (inlined) ====================
  const offerCategories = [...new Set(products.map((p: any) => p.category).filter(Boolean))];

  const openOfferModal = (offer?: any) => {
    if (offer) {
      setEditingOffer(offer);
      setOfferForm({
        name: offer.name,
        offer_type: offer.offer_type,
        buy_quantity: offer.buy_quantity,
        get_quantity: offer.get_quantity,
        discount_percentage: offer.discount_percentage,
        scope_type: offer.scope_type,
        scope_value: offer.scope_value,
        require_same_variant: offer.require_same_variant,
        is_active: offer.is_active,
        ends_at: offer.ends_at ? offer.ends_at.slice(0, 10) : '',
      });
    } else {
      setEditingOffer(null);
      setOfferForm({
        name: '',
        offer_type: 'bxgy_free',
        buy_quantity: 2,
        get_quantity: 1,
        discount_percentage: 100,
        scope_type: 'product',
        scope_value: '',
        require_same_variant: false,
        is_active: true,
        ends_at: '',
      });
    }
    setShowOfferModal(true);
  };

  const saveOffer = async () => {
    if (!offerForm.name.trim()) {
      alert('Offer name is required');
      return;
    }
    if (offerForm.scope_type !== 'all' && !offerForm.scope_value) {
      alert('Please select a target product/category/collection, or choose "All Products"');
      return;
    }
    if (offerForm.buy_quantity < 1 || offerForm.get_quantity < 1) {
      alert('Buy and Get quantities must be at least 1');
      return;
    }

    setSavingOffer(true);
    try {
      const payload = {
        name: offerForm.name.trim(),
        offer_type: offerForm.offer_type,
        buy_quantity: Number(offerForm.buy_quantity),
        get_quantity: Number(offerForm.get_quantity),
        discount_percentage: offerForm.offer_type === 'bxgy_free' ? 100 : Number(offerForm.discount_percentage),
        scope_type: offerForm.scope_type,
        scope_value: offerForm.scope_type === 'all' ? 'all' : offerForm.scope_value,
        require_same_variant: offerForm.scope_type === 'all' ? false : offerForm.require_same_variant,
        is_active: offerForm.is_active,
        ends_at: offerForm.ends_at || null,
      };

      if (editingOffer) {
        await adminApi.updateOffer(editingOffer.id, payload);
      } else {
        await adminApi.insertOffer(payload);
      }

      setShowOfferModal(false);
      setEditingOffer(null);
      invalidateCache('active-offers');
      loadData();
    } catch (err: any) {
      alert('Failed to save offer: ' + (err?.message || err));
    }
    setSavingOffer(false);
  };

  const deleteOffer = async (id: string) => {
    if (!confirm('Delete this offer?')) return;
    try {
      await adminApi.deleteOffer(id);
      invalidateCache('active-offers');
      loadData();
    } catch (err: any) {
      alert('Failed to delete: ' + err.message);
    }
  };

  const toggleOfferActive = async (offer: any) => {
    try {
      await adminApi.updateOffer(offer.id, { is_active: !offer.is_active });
      invalidateCache('active-offers');
      loadData();
    } catch (err: any) {
      alert('Failed to update: ' + err.message);
    }
  };

  const offerScopeOptions =
    offerForm.scope_type === 'product' ? products.map(p => ({ value: p.id, label: p.name })) :
    offerForm.scope_type === 'category' ? offerCategories.map(c => ({ value: c, label: c })) :
    offerForm.scope_type === 'collection' ? collections.map(c => ({ value: c, label: c })) :
    [];

  const describeOffer = (o: any) => {
    const action = o.offer_type === 'bxgy_free'
      ? `Get ${o.get_quantity} Free`
      : `Get ${o.get_quantity} at -${o.discount_percentage}%`;
    return `Buy ${o.buy_quantity} ${action}`;
  };

  const offerScopeLabel = (o: any) => {
    if (o.scope_type === 'all') return 'All Products';
    if (o.scope_type === 'product') {
      return products.find(p => p.id === o.scope_value)?.name || o.scope_value;
    }
    return o.scope_value;
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-20 md:py-22">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <h1 className="text-3xl md:text-5xl font-light tracking-widest mb-8">Admin Panel</h1>

          {/* Tabs — 2-col grid on mobile, single row on desktop */}
          <div className="grid grid-cols-2 md:flex md:flex-wrap gap-3 mb-8 border-b pb-4">
            <button
              onClick={() => setTab('featured')}
              className={`py-3 rounded-full text-sm md:text-base md:px-8 ${tab === 'featured' ? 'bg-black text-white' : 'bg-white border'}`}
            >
              <span className="md:hidden">Featured</span>
              <span className="hidden md:inline">Home Page</span>
            </button>
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
            <button
              onClick={() => setTab('offers')}
              className={`py-3 rounded-full text-sm md:text-base md:px-8 ${tab === 'offers' ? 'bg-black text-white' : 'bg-white border'}`}
            >
              Offers
            </button>
            <button
              onClick={() => setTab('newsletter')}
              className={`py-3 rounded-full text-sm md:text-base md:px-8 ${tab === 'newsletter' ? 'bg-black text-white' : 'bg-white border'}`}
            >
              Newsletter
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
                <p className="text-center py-20 text-xl text-gray-500">No products yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products
                    .filter(p => selectedCollection === null || p.collection === selectedCollection)
                    .map((p) => {
                      const outOfStock = isFullyOutOfStock(p.id);
                      const partialStock = !outOfStock && hasOutOfStock(p.id);
                      return (
                        <div key={p.id} className={`bg-white rounded-3xl overflow-hidden border relative ${outOfStock ? 'border-red-300' : partialStock ? 'border-orange-300' : ''}`}>
                          {/* Out of stock overlay */}
                          {outOfStock && (
                            <div className="absolute top-3 left-3 z-10 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                              OUT OF STOCK
                            </div>
                          )}
                          {partialStock && (
                            <div className="absolute top-3 left-3 z-10 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                              LOW STOCK
                            </div>
                          )}
                          {(p.thumbnail_url || (p.images && p.images.length > 0)) && (
                            <div className="relative w-full h-64">
                              <Image
                                src={p.thumbnail_url || p.images[0]}
                                alt={p.name}
                                fill
                                sizes="(max-width: 768px) 100vw, 33vw"
                                className={`object-cover ${outOfStock ? 'opacity-50' : ''}`}
                              />
                            </div>
                          )}
                          <div className="p-6">
                            <h3 className="font-medium text-lg mb-1">{p.name}</h3>
                            <p className="text-2xl font-medium">{formatPrice(p.price)}</p>
                            <p className="text-sm text-gray-500 mt-1">
                              Category: <span className="font-medium text-black">{p.category || 'Uncategorized'}</span>
                            </p>
                            {p.collection && (
                              <p className="text-sm text-gray-500 mt-1">Collection: <span className="font-medium text-black">{p.collection}</span></p>
                            )}
                            {p.is_on_sale && (
                              <p className="text-red-600 text-sm font-medium mt-1">On Sale • -{p.discount_percentage}%</p>
                            )}
 
                            {/* Stock summary */}
                            <div className="mt-3">
                              {allVariants
                                .filter(v => v.product_id === p.id)
                                .map((v: any) => (
                                  <span key={v.id} className={`inline-flex items-center gap-1 text-xs mr-2 mb-1 px-2 py-0.5 rounded-full ${
                                    v.stock === 0 ? 'bg-red-100 text-red-700' : v.stock <= 3 ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                                  }`}>
                                    {v.color} / {v.size}: {v.stock === 0 ? 'Out' : v.stock}
                                  </span>
                                ))
                              }
                            </div>
 
                            <div className="mt-4 flex gap-2">
                              <button onClick={() => openModal(p)} className="flex-1 bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition flex items-center justify-center gap-2 text-sm">
                                <Edit2 size={16} /> Edit
                              </button>
                              {/* Restock button */}
                              <button
                                onClick={() => openRestockModal(p)}
                                className="flex-1 bg-emerald-600 text-white py-3 rounded-xl hover:bg-emerald-700 transition flex items-center justify-center gap-2 text-sm"
                              >
                                <PackagePlus size={16} /> Restock
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); if (confirm(`Delete "${p.name}" permanently?`)) deleteProduct(p.id); }}
                                className="text-red-600 hover:text-red-700 py-3 px-3 border border-red-200 hover:border-red-400 rounded-xl transition"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
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
                  const orderTotal = Math.max(0, Number(order.total || 0) + Number(order.delivery_fee || 0) - Number(order.discount_amount || 0));

                  // Orders placed before this feature shipped have no stored
                  // currency/rate — default to EGP at a 1:1 rate, matching
                  // how every amount on the order was already stored.
                  const orderCurrency = order.currency || 'EGP';
                  const orderRate = order.currency_rate || 1;
                  const orderFormatPrice = (egpAmount: number) => formatPriceAs(egpAmount, orderCurrency, orderRate);

                  return (
                    <div key={order.id} className="bg-white rounded-3xl p-8 border">

                      {/* ── Top row: order meta + badges ── */}
                      <div className="flex flex-wrap justify-between gap-4 mb-6">
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Order #{order.id.slice(0, 8)}...</p>
                          {(order.first_name || order.last_name) && (
                            <p className="font-medium">
                              Name: {[order.first_name, order.last_name].filter(Boolean).join(' ')}
                            </p>
                          )}
                          <p className="font-medium">Account Email: {order.user_email}</p>
                          {order.contact_email && order.contact_email !== order.user_email && (
                            <p className="font-medium text-blue-600">Confirmation sent to: {order.contact_email}</p>
                          )}
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
                            <div className="relative w-16 h-16 rounded-xl shrink-0 overflow-hidden">
                              <Image
                                src={item.image_url}
                                alt={item.product_name}
                                fill
                                sizes="64px"
                                className="object-cover"
                              />
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="font-medium">{item.product_name}</p>
                            <p className="text-sm text-gray-500">
                              Size: {item.size} • Color: {item.color} • Qty: {item.quantity}
                            </p>
                          </div>
                          <p className="font-medium">{orderFormatPrice(item.price)}</p>
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
                          <span className="font-medium">{orderFormatPrice(Number(order.delivery_fee))}</span>
                        )}
                      </div>

                      {/* ── Buy X Get Y Offer Rows (if any) ── */}
                      {Array.isArray(order.applied_offers) && order.applied_offers.length > 0 && (
                        order.applied_offers.map((o: any, i: number) => (
                          <div key={i} className="flex justify-between text-lg mt-2 text-emerald-600">
                            <span>🏷️ {o.name}</span>
                            <span className="font-medium">-{orderFormatPrice(Number(o.discount))}</span>
                          </div>
                        ))
                      )}

                      {/* ── Promo Code Row (if any) ── */}
                      {order.promo_code && (
                        <div className="flex justify-between text-lg mt-2">
                          <span className="text-gray-600">Promo ({order.promo_code})</span>
                          <span className="font-medium text-red-600">
                            -{orderFormatPrice(Math.max(0, Number(order.discount_amount || 0) - (order.applied_offers || []).reduce((s: number, o: any) => s + Number(o.discount || 0), 0)))}
                          </span>
                        </div>
                      )}

                      {/* ── Fallback combined discount row — only when neither breakdown above applies ── */}
                      {!order.promo_code && (!order.applied_offers || order.applied_offers.length === 0) && Number(order.discount_amount) > 0 && (
                        <div className="flex justify-between text-lg mt-2">
                          <span className="text-gray-600">Discount</span>
                          <span className="font-medium text-red-600">
                            -{orderFormatPrice(Number(order.discount_amount))}
                          </span>
                        </div>
                      )}

                      {/* ── Total ── */}
                      <div className="mt-6 flex justify-between text-2xl font-medium border-t pt-6">
                        <span>Total</span>
                        <span>{orderFormatPrice(orderTotal)}</span>
                      </div>
                      <div className="mt-6 flex justify-end">
                        {order.status !== "shipped" ? (
                          <button
                            onClick={() => markOrderAsShipped(order)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-medium transition"
                          >
                            🚚 Mark as Shipped
                          </button>
                        ) : (
                          <div className="bg-emerald-100 text-emerald-700 px-5 py-3 rounded-xl font-medium">
                            🚚 On the Way
                          </div>
                        )}
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
                        <span className="hidden sm:inline">Delivery</span>
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
                Enter a full SKU or any part of it to find matching products + variants:
                <br />
              </p>

              <div className="w-full max-w-lg flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="Search"
                  value={skuSearchTerm}
                  onChange={(e) => setSkuSearchTerm(e.target.value.toUpperCase())}
                  className="border rounded-2xl px-5 py-4 w-full text-base md:text-lg font-mono tracking-widest uppercase"
                />
                <button
                  onClick={searchBySku}
                  disabled={searching || !skuSearchTerm.trim()}
                  className="bg-black text-white px-8 py-4 rounded-2xl hover:bg-gray-800 disabled:opacity-50 whitespace-nowrap"
                >
                  {searching ? 'Searching...' : 'Search Now'}
                </button>
              </div>

              {skuSearchResult.length > 0 && (
                <div className="mt-10">
                  <p className="text-sm text-gray-500 mb-6">{skuSearchResult.length} match{skuSearchResult.length !== 1 ? 'es' : ''} found</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {skuSearchResult.map((result: any) => (
                      <div key={result.id} className="bg-white rounded-3xl p-6 border">
                      {(result.products?.thumbnail_url || result.products?.images?.[0]) && (
                        <div className="relative w-full aspect-square">
                          <Image
                            src={result.products.thumbnail_url || result.products.images[0]}
                            alt={result.products.name}
                            fill
                            sizes="(max-width: 768px) 100vw, 33vw"
                            className="object-cover rounded-2xl"
                          />
                        </div>
                      )}

                      <div className="mt-6">
                        <div className="inline-flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-xl mb-4">
                          <span className="text-xs uppercase tracking-widest text-gray-500">SKU</span>
                          <span className="font-mono text-sm tracking-[2px] font-medium">{result.sku}</span>
                        </div>

                        <h3 className="text-2xl font-medium">{result.products?.name}</h3>
                        <p className="text-3xl font-medium text-black mt-1">
                          {formatPrice(result.products?.price)}
                        </p>

                        {result.products?.is_on_sale && (
                          <p className="text-red-600 text-sm font-medium mt-1">
                            Product Sale • -{result.products.discount_percentage}%
                          </p>
                        )}
                        {result.is_on_sale && (
                          <p className="text-orange-600 text-sm font-medium mt-1">
                            Color Sale • -{result.discount_percentage}% on {result.color}
                          </p>
                        )}

                        <div className="mt-6 bg-gray-50 rounded-2xl p-5 border border-gray-200">
                          <p className="text-xs uppercase tracking-widest text-gray-500 mb-4">Matched Variant</p>
                          <div className="grid grid-cols-3 gap-6 text-sm">
                            <div>
                              <p className="text-gray-500 mb-1">Color</p>
                              <p className="font-semibold text-base">{result.color}</p>
                            </div>
                            <div>
                              <p className="text-gray-500 mb-1">Size</p>
                              <p className="font-semibold text-base">{result.size}</p>
                            </div>
                            <div>
                              <p className="text-gray-500 mb-1">Stock</p>
                              <p className={`font-semibold text-base ${
                                result.stock === 0
                                  ? 'text-red-600'
                                  : result.stock <= 5
                                    ? 'text-orange-500'
                                    : 'text-green-600'
                              }`}>
                                {result.stock === 0 ? 'Out of stock' : result.stock}
                              </p>
                            </div>
                          </div>
                          {result.type_code && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <p className="text-gray-500 text-sm mb-1">Type Code</p>
                              <p className="font-mono font-semibold tracking-widest">{result.type_code}</p>
                            </div>
                          )}
                        </div>

                        {result.products?.category && (
                          <p className="text-sm text-gray-500 mt-4">
                            Category: <span className="font-medium text-black">{result.products.category}</span>
                            {result.products?.collection && (
                              <> · Collection: <span className="font-medium text-black">{result.products.collection}</span></>
                            )}
                          </p>
                        )}

                        {result.products?.description && (
                          <p className="mt-5 text-gray-600 text-sm border-t pt-5">
                            {result.products.description}
                          </p>
                        )}

                        <div className="mt-8 flex gap-3">
                          <button
                            onClick={() => openModal({ ...result.products, id: result.product_id })}
                            className="flex-1 bg-blue-600 text-white py-3.5 rounded-2xl hover:bg-blue-700 transition flex items-center justify-center gap-2"
                          >
                            <Edit2 size={18} /> Edit Product
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete "${result.products.name}" permanently?`)) {
                                deleteProduct(result.product_id);
                                setSkuSearchResult((prev: any[]) => prev.filter((r) => r.product_id !== result.product_id));
                              }
                            }}
                            className="flex-1 text-red-600 hover:text-red-700 py-3.5 border border-red-200 hover:border-red-400 rounded-2xl transition"
                          >
                            Delete Product
                          </button>
                        </div>
                      </div>
                   </div>
                    ))}
                  </div>
                </div>
              )}

              {skuSearchResult.length === 0 && skuSearchTerm && !searching && (
                <p className="mt-8 text-red-600 text-lg text-center">No variants found matching this SKU or prefix.</p>
              )}

              {skuSearchTerm === '' && (
                <p className="text-center py-20 text-gray-500">Enter a full SKU or prefix to search</p>
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

          {/* ==================== OFFERS TAB (inlined, no separate component) ==================== */}
          {tab === 'offers' && !loading && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-3xl font-light">Offers</h2>
                <button
                  onClick={() => openOfferModal()}
                  className="bg-black text-white px-6 py-3 rounded-full flex items-center gap-2 hover:bg-gray-800 transition text-sm"
                >
                  <Plus size={18} /> New Offer
                </button>
              </div>
              <p className="text-gray-500 mb-8 text-sm">
                Create promotions like "Buy 2 Get 1 Free" on a product, category, collection, or your whole store. These apply automatically in cart and checkout.
              </p>

              {offers.length === 0 ? (
                <p className="text-center py-20 text-xl text-gray-500">No offers yet. Create one to get started.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {offers.map((o) => {
                    const expired = o.ends_at && new Date(o.ends_at) < new Date();
                    return (
                      <div
                        key={o.id}
                        className={`bg-white border rounded-3xl p-6 ${expired ? 'border-red-300 bg-red-50' : o.is_active ? 'border-green-300' : 'border-gray-200 opacity-60'}`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2">
                            <Tag size={18} className="text-emerald-600" />
                            <p className="font-medium text-lg">{o.name}</p>
                          </div>
                          <button onClick={() => deleteOffer(o.id)} className="text-red-600 hover:text-red-700">
                            <Trash2 size={18} />
                          </button>
                        </div>

                        <p className="text-emerald-700 font-semibold">{describeOffer(o)}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          {o.scope_type === 'all' ? 'Scope' : o.scope_type === 'product' ? 'Product' : o.scope_type === 'category' ? 'Category' : 'Collection'}:{' '}
                          <span className="text-black font-medium">{offerScopeLabel(o)}</span>
                        </p>
                        {o.scope_type !== 'all' && (
                          <p className="text-xs text-gray-400 mt-1">
                            {o.require_same_variant ? 'Must be same size & color to qualify' : 'Any size/color mix qualifies — cheapest item is free'}
                          </p>
                        )}

                        {expired && <p className="text-red-600 text-sm font-medium mt-3">Expired</p>}
                        {o.ends_at && !expired && (
                          <p className="text-xs text-gray-500 mt-3">Ends: {new Date(o.ends_at).toLocaleDateString()}</p>
                        )}

                        <div className="mt-5 flex gap-2">
                          <button
                            onClick={() => openOfferModal(o)}
                            className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl hover:bg-blue-700 transition flex items-center justify-center gap-2 text-sm"
                          >
                            <Edit2 size={14} /> Edit
                          </button>
                          <button
                            onClick={() => toggleOfferActive(o)}
                            className={`flex-1 py-2.5 rounded-xl transition text-sm font-medium ${
                              o.is_active ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-emerald-600 text-white hover:bg-emerald-700'
                            }`}
                          >
                            {o.is_active ? 'Pause' : 'Activate'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ===================== NEWSLETTER ========================= */}
          {tab === 'newsletter' && !loading && (
            <div>
              <h2 className="text-3xl font-light mb-2">Newsletter</h2>
              <p className="text-gray-500 mb-8 text-sm">
                Send an email announcement to every signed-up user who hasn't unsubscribed from marketing emails.
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white border rounded-3xl p-8 space-y-5">
                  <input
                    type="text"
                    placeholder="Email subject line *"
                    value={newsletterForm.subject}
                    onChange={(e) => setNewsletterForm({ ...newsletterForm, subject: e.target.value })}
                    className="border rounded-2xl px-5 py-3.5 w-full"
                  />
                  <input
                    type="text"
                    placeholder="Headline (large text in the email) *"
                    value={newsletterForm.headline}
                    onChange={(e) => setNewsletterForm({ ...newsletterForm, headline: e.target.value })}
                    className="border rounded-2xl px-5 py-3.5 w-full"
                  />
                  <textarea
                    placeholder="Message body *"
                    value={newsletterForm.bodyText}
                    onChange={(e) => setNewsletterForm({ ...newsletterForm, bodyText: e.target.value })}
                    className="border rounded-2xl px-5 py-3.5 w-full h-32 resize-y"
                  />
                  <div>
                    <label className="block text-sm font-medium mb-2">Banner image (optional)</label>

                    {newsletterForm.imageUrl ? (
                      <div className="relative h-40 rounded-2xl overflow-hidden border">
                        <Image src={newsletterForm.imageUrl} alt="" fill sizes="600px" className="object-cover" />
                        <button
                          type="button"
                          onClick={() => setNewsletterForm(prev => ({ ...prev, imageUrl: '' }))}
                          className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-700 shadow"
                          title="Remove image"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) await handleBannerUpload(file);
                          e.target.value = '';
                        }}
                        disabled={uploadingBanner}
                        className="border rounded-2xl px-5 py-3.5 w-full disabled:opacity-50"
                      />
                    )}

                    {uploadingBanner && (
                      <p className="text-sm text-gray-500 mt-2">Uploading image...</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Button text (optional)"
                      value={newsletterForm.ctaText}
                      onChange={(e) => setNewsletterForm({ ...newsletterForm, ctaText: e.target.value })}
                      className="border rounded-2xl px-5 py-3.5 w-full"
                    />
                    <input
                      type="text"
                      placeholder="Button link (e.g. /sale)"
                      value={newsletterForm.ctaLink}
                      onChange={(e) => setNewsletterForm({ ...newsletterForm, ctaLink: e.target.value })}
                      className="border rounded-2xl px-5 py-3.5 w-full"
                    />
                  </div>
                  <div className="bg-white border rounded-3xl overflow-hidden">
                    <button
                      onClick={() => setSubscribersOpen(!subscribersOpen)}
                      className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition"
                    >
                      <span className="font-medium text-sm">
                        {loadingSubscribers
                          ? 'Loading subscribers...'
                          : `${subscribers.filter(s => !s.marketing_opt_out).length} subscribed users`}
                      </span>
                      <ChevronDown size={18} className={`text-gray-400 transition-transform ${subscribersOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {subscribersOpen && (
                      <div className="border-t max-h-64 overflow-y-auto">
                        {subscribers.length === 0 ? (
                          <p className="px-6 py-4 text-sm text-gray-400">No users found.</p>
                        ) : (
                          subscribers.map((s, i) => (
                            <div
                              key={i}
                              className={`flex items-center justify-between px-6 py-3 text-sm border-b last:border-b-0 ${
                                s.marketing_opt_out ? 'text-gray-400' : 'text-black'
                              }`}
                            >
                              <span>{s.email}</span>
                              {s.marketing_opt_out ? (
                                <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">Unsubscribed</span>
                              ) : (
                                <span className="text-xs bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full">Subscribed</span>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
                    <p className="text-sm font-medium mb-3">Send yourself a test first</p>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        placeholder="your@email.com"
                        value={testEmail}
                        onChange={(e) => setTestEmail(e.target.value)}
                        className="border rounded-xl px-4 py-2.5 flex-1 text-sm"
                      />
                      <button
                        onClick={sendTestNewsletter}
                        disabled={sendingTest}
                        className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm hover:bg-blue-700 disabled:opacity-60"
                      >
                        {sendingTest ? 'Sending...' : 'Send Test'}
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={sendNewsletterToAll}
                    disabled={sendingNewsletter}
                    className="w-full bg-black text-white py-4 rounded-2xl text-lg hover:bg-gray-800 disabled:opacity-70 transition"
                  >
                    {sendingNewsletter ? 'Sending to all users...' : 'Send to All Subscribers'}
                  </button>
                </div>

                <div className="bg-gray-100 rounded-3xl p-6">
                  <p className="text-xs uppercase tracking-widest text-gray-500 mb-4">Preview</p>
                  <div className="bg-white rounded-2xl overflow-hidden">
                    {newsletterForm.imageUrl && (
                      <div className="relative h-40">
                        <Image src={newsletterForm.imageUrl} alt="" fill sizes="600px" className="object-cover" />
                      </div>
                    )}
                    <div className="p-8 text-center">
                      <h3 className="text-2xl font-medium mb-3">{newsletterForm.headline || 'Headline goes here'}</h3>
                      <p className="text-gray-600 text-sm whitespace-pre-line mb-6">
                        {newsletterForm.bodyText || 'Your message will appear here...'}
                      </p>
                      {newsletterForm.ctaText && (
                        <span className="inline-block bg-black text-white px-8 py-3 rounded-full text-sm font-bold">
                          {newsletterForm.ctaText}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================== FEATURED / HOME PAGE TAB ==================== */}
          {tab === 'featured' && !loading && (
            <div>
              <h2 className="text-3xl font-light mb-2">Home Page — New This Week</h2>
              <p className="text-gray-500 mb-8 text-sm">
                Select which products appear in the <span className="font-medium text-black">"New This Week"</span> section on the home page. Selected products replace the default latest arrivals.
              </p>

              {/* Counter */}
              <div className="mb-6 flex items-center gap-3">
                <div className="bg-black text-white px-4 py-2 rounded-full text-sm font-medium">
                  {featuredIds.length} selected
                </div>
                {featuredIds.length > 0 && (
                  <button
                    onClick={async () => {
                      if (!confirm('Remove all featured products?')) return;
                      try {
                        await adminApi.clearFeatured('new_this_week');
                        setFeaturedIds([]);
                        nextFeaturedPositionRef.current = 0;
                        invalidateCache('home-products');
                      } catch (err: any) {
                        alert('Failed to clear featured products: ' + err.message);
                      }
                    }}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Clear all
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((p) => {
                  const isFeatured = featuredIds.includes(p.id);
                  return (
                    <div
                      key={p.id}
                      onClick={async () => {
                        setFeaturedSaving(p.id);
                        try {
                          if (isFeatured) {
                            await adminApi.unsetFeatured(p.id, 'new_this_week');
                            setFeaturedIds(prev => prev.filter(id => id !== p.id));
                          } else {
                            // Read-and-increment a ref, not featuredIds.length:
                            // the ref updates synchronously the instant this
                            // line runs, so two cards clicked back-to-back
                            // can never read the same position — whereas
                            // featuredIds.length could still be the stale
                            // pre-update value if the first click's state
                            // update hasn't flushed yet. Stays a small plain
                            // integer (unlike Date.now(), which overflows a
                            // standard 32-bit integer column).
                            const position = nextFeaturedPositionRef.current++;
                            await adminApi.setFeatured(p.id, 'new_this_week', position);
                            setFeaturedIds(prev => [...prev, p.id]);
                          }
                          invalidateCache('home-products');
                        } catch (err: any) {
                          alert('Failed to update home page selection: ' + err.message);
                        }
                        setFeaturedSaving(null);
                      }}
                      className={`bg-white rounded-3xl overflow-hidden border-2 cursor-pointer transition-all ${
                        isFeatured
                          ? 'border-black shadow-lg'
                          : 'border-transparent hover:border-gray-300'
                      } ${featuredSaving === p.id ? 'opacity-60 pointer-events-none' : ''}`}
                    >
                      {/* Featured badge */}
                      <div className="relative h-48">
                        {(p.thumbnail_url || p.images?.[0]) && (
                          <Image
                            src={p.thumbnail_url || p.images[0]}
                            alt={p.name}
                            fill
                            sizes="(max-width: 768px) 100vw, 33vw"
                            className="object-cover"
                          />
                        )}
                        {isFeatured && (
                          <div className="absolute top-3 left-3 bg-black text-white text-xs font-bold px-3 py-1 rounded-full">
                            ✓ On Home Page
                          </div>
                        )}
                        {/* Checkmark overlay */}
                        <div className={`absolute top-3 right-3 w-7 h-7 rounded-full border-2 flex items-center justify-center transition ${
                          isFeatured ? 'bg-black border-black' : 'bg-white border-gray-300'
                        }`}>
                          {isFeatured && <Check size={14} className="text-white" />}
                        </div>
                      </div>

                      <div className="p-4">
                        <p className="font-medium">{p.name}</p>
                        <p className="text-gray-500 text-sm mt-0.5">{formatPrice(p.price)}</p>
                        {p.is_on_sale && (
                          <p className="text-red-500 text-xs mt-1">On Sale -{p.discount_percentage}%</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>


      {/* ==================== RESTOCK MODAL ==================== */}
      {restockModal.open && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-8 relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setRestockModal({ open: false, productId: '', productName: '', variants: [] })} className="absolute top-6 right-6">
              <X size={24} />
            </button>
 
            <div className="flex items-center gap-3 mb-2">
              <PackagePlus size={24} className="text-emerald-600" />
              <h2 className="text-2xl font-medium">Restock</h2>
            </div>
            <p className="text-gray-500 text-sm mb-8">{restockModal.productName} — enter the amount to add per variant</p>
 
            <div className="space-y-4">
              {restockModal.variants.map((v: any) => (
                <div key={v.id} className={`flex items-center justify-between p-4 rounded-2xl border ${v.stock === 0 ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'}`}>
                  <div>
                    <p className="font-medium text-sm">{v.color} / {v.size}</p>
                    <p className="text-xs text-gray-500 font-mono">{v.sku}</p>
                    <p className={`text-xs mt-0.5 ${v.stock === 0 ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                      Current stock: {v.stock === 0 ? 'OUT OF STOCK' : v.stock}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-400">+ Add</span>
                    <input
                      type="number"
                      min={0}
                      value={restockAmounts[v.id] || ''}
                      onChange={(e) => setRestockAmounts(prev => ({ ...prev, [v.id]: Math.max(0, Number(e.target.value)) }))}
                      className="w-20 border rounded-xl px-3 py-2 text-center text-lg font-medium focus:outline-none focus:border-black"
                    />
                  </div>
                </div>
              ))}
            </div>
 
            {/* Summary */}
            {Object.values(restockAmounts).some(v => v > 0) && (
              <div className="mt-6 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-sm text-emerald-700">
                Adding stock to {Object.values(restockAmounts).filter(v => v > 0).length} variant(s) — total {Object.values(restockAmounts).reduce((a, b) => a + b, 0)} units
              </div>
            )}
 
            <button
              onClick={submitRestock}
              disabled={restocking || !Object.values(restockAmounts).some(v => v > 0)}
              className="mt-6 w-full bg-emerald-600 text-white py-4 rounded-2xl text-lg font-medium hover:bg-emerald-700 disabled:opacity-50 transition"
            >
              {restocking ? 'Updating stock...' : 'Confirm Restock'}
            </button>
          </div>
        </div>
      )}

      {/* ==================== OFFER ADD / EDIT MODAL (inlined) ==================== */}
      {showOfferModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-8 relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowOfferModal(false)} className="absolute top-6 right-6">
              <X size={24} />
            </button>

            <h2 className="text-2xl font-medium mb-8">{editingOffer ? 'Edit Offer' : 'New Offer'}</h2>

            <div className="space-y-5">
              <input
                type="text"
                placeholder="Offer name (e.g. Summer Jacket Deal)"
                value={offerForm.name}
                onChange={(e) => setOfferForm({ ...offerForm, name: e.target.value })}
                className="border rounded-2xl px-5 py-3.5 w-full"
              />

              <div>
                <label className="block text-sm font-medium mb-2">Offer Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setOfferForm({ ...offerForm, offer_type: 'bxgy_free' })}
                    className={`py-3 rounded-xl text-sm font-medium border transition ${offerForm.offer_type === 'bxgy_free' ? 'bg-black text-white border-black' : 'border-gray-300'}`}
                  >
                    Buy X Get Y Free
                  </button>
                  <button
                    onClick={() => setOfferForm({ ...offerForm, offer_type: 'bxgy_percent' })}
                    className={`py-3 rounded-xl text-sm font-medium border transition ${offerForm.offer_type === 'bxgy_percent' ? 'bg-black text-white border-black' : 'border-gray-300'}`}
                  >
                    Buy X Get Y % Off
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-2">Buy Quantity</label>
                  <input
                    type="number"
                    min={1}
                    value={offerForm.buy_quantity}
                    onChange={(e) => setOfferForm({ ...offerForm, buy_quantity: Number(e.target.value) })}
                    className="border rounded-2xl px-5 py-3.5 w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Get Quantity</label>
                  <input
                    type="number"
                    min={1}
                    value={offerForm.get_quantity}
                    onChange={(e) => setOfferForm({ ...offerForm, get_quantity: Number(e.target.value) })}
                    className="border rounded-2xl px-5 py-3.5 w-full"
                  />
                </div>
              </div>

              {offerForm.offer_type === 'bxgy_percent' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Discount % on the "Get" items</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={offerForm.discount_percentage}
                    onChange={(e) => setOfferForm({ ...offerForm, discount_percentage: Number(e.target.value) })}
                    className="border rounded-2xl px-5 py-3.5 w-full"
                  />
                </div>
              )}

              <p className="text-xs text-gray-500 bg-gray-50 rounded-xl px-4 py-3">
                Preview: <span className="font-medium text-black">
                  Buy {offerForm.buy_quantity} {offerForm.offer_type === 'bxgy_free' ? `Get ${offerForm.get_quantity} Free` : `Get ${offerForm.get_quantity} at -${offerForm.discount_percentage}%`}
                </span>
                {' '}— the cheapest qualifying item(s) get the discount.
              </p>

              <div>
                <label className="block text-sm font-medium mb-2">Applies To</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                  {(['product', 'category', 'collection', 'all'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setOfferForm({ ...offerForm, scope_type: type, scope_value: '' })}
                      className={`py-2.5 rounded-xl text-sm capitalize border transition ${offerForm.scope_type === type ? 'bg-black text-white border-black' : 'border-gray-300'}`}
                    >
                      {type === 'all' ? 'All Products' : type}
                    </button>
                  ))}
                </div>

                {offerForm.scope_type === 'all' ? (
                  <p className="text-xs text-gray-500 bg-gray-50 border rounded-2xl px-5 py-3.5">
                    This offer applies storewide — every product qualifies, no selection needed.
                  </p>
                ) : (
                  <select
                    value={offerForm.scope_value}
                    onChange={(e) => setOfferForm({ ...offerForm, scope_value: e.target.value })}
                    className="border rounded-2xl px-5 py-3.5 w-full bg-white"
                  >
                    <option value="">Select {offerForm.scope_type}</option>
                    {offerScopeOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                )}
              </div>

              {offerForm.scope_type !== 'all' && (
                <div className="flex items-center gap-3 bg-gray-50 border rounded-2xl px-5 py-4">
                  <input
                    type="checkbox"
                    checked={offerForm.require_same_variant}
                    onChange={(e) => setOfferForm({ ...offerForm, require_same_variant: e.target.checked })}
                    className="w-5 h-5 accent-black"
                  />
                  <div>
                    <p className="font-medium text-sm">Require same size & color</p>
                    <p className="text-xs text-gray-500">
                      {offerForm.require_same_variant
                        ? 'Customer must pick matching size & color to qualify — e.g. 2 of the same Red/M skirt to get a 3rd Red/M free.'
                        : `Leave unchecked (recommended) so the customer can mix any sizes/colors of this item — e.g. pick 2 different skirts and the cheapest of the ${offerForm.buy_quantity + offerForm.get_quantity} becomes free.`}
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">End Date (optional)</label>
                <input
                  type="date"
                  value={offerForm.ends_at}
                  onChange={(e) => setOfferForm({ ...offerForm, ends_at: e.target.value })}
                  className="border rounded-2xl px-5 py-3.5 w-full"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={offerForm.is_active}
                  onChange={(e) => setOfferForm({ ...offerForm, is_active: e.target.checked })}
                  className="w-5 h-5 accent-black"
                />
                <label className="text-sm font-medium">Active immediately</label>
              </div>

              <button
                onClick={saveOffer}
                disabled={savingOffer}
                className="w-full bg-black text-white py-4 rounded-2xl text-lg hover:bg-gray-800 disabled:opacity-70 transition"
              >
                {savingOffer ? 'Saving...' : editingOffer ? 'Update Offer' : 'Create Offer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== ADD / EDIT MODAL ==================== */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl w-full max-w-8xl p-12 relative max-h-[92vh] overflow-y-auto">
            <button onClick={() => { setShowAddModal(false); setEditingProduct(null); setImageItems([]); }} className="absolute top-8 right-8">
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
                  <option value="bags">Bags</option>
                  <option value="Lingerie">Lingerie</option>
                  <option value="Swimwear">Swimwear</option>
                  <option value="Activewear">Activewear</option>
                  <option value="Candle">Candles</option>
                  <option value="Vest">Vest</option>
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
                  onChange={async (e) => {
                    await addNewImages(Array.from(e.target.files || []));
                    e.target.value = '';
                  }}
                  className="border rounded-2xl px-6 py-5 w-full text-lg"
                />

                {imageItems.length > 0 && (
                <>
                  <p className="text-xs text-gray-500 mt-3 mb-2">
                    Drag to reorder — the <span className="font-medium text-black">first image</span> is the thumbnail.
                    Tag each photo with a color so customers see the right shots when they pick that color.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {imageItems.map((item, i) => (
                      <div
                        key={item.key}
                        draggable
                        onDragStart={() => handleDragStart(i)}
                        onDragOver={(e) => handleDragOver(e, i)}
                        onDrop={(e) => e.preventDefault()}
                        onDragEnd={handleDragEnd}
                        className={`relative aspect-square cursor-move select-none transition ${draggedIndex === i ? 'opacity-40 scale-95' : ''}`}
                      >
                        <Image
                          src={item.url}
                          alt=""
                          fill
                          unoptimized={item.type === 'new'}
                          sizes="200px"
                          className={`object-cover rounded-xl border-2 pointer-events-none ${
                            i === 0 ? 'border-black' : item.type === 'new' ? 'border-emerald-400' : 'border-gray-200'
                          }`}
                        />
                        {i === 0 && (
                          <span className="absolute top-1 left-1 bg-black text-white text-[10px] px-1.5 py-0.5 rounded-full font-medium">
                            Thumbnail
                          </span>
                        )}
                        {item.type === 'new' && (
                          <span className="absolute bottom-1 left-1 bg-emerald-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                            New
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => removeImageItem(item.key)}
                          className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-700 shadow z-10"
                          title="Remove image"
                        >
                          <X size={14} />
                        </button>

                        {/* ── Color tag selector ── */}
                        <select
                          value={item.color}
                          onChange={(e) => setImageColor(item.key, e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          draggable={false}
                          className="mt-2 w-full border rounded-lg px-9 py-1.5 text-xs bg-white"
                        >
                          <option value="">All Colors</option>
                          {[...new Set(variants.map(v => v.color?.trim()).filter(Boolean))].map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </>
              )}
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
                    onClick={() => addVariant()}
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
                    <div><strong>BAG</strong> = Bags</div>
                    <div><strong>CDL</strong> = Candles</div>
                    <div><strong>VST</strong> = Vest</div>
                  </div>
                </div>

                {variants.map((variant, index) => (
                  <div key={index} className="flex flex-wrap gap-4 mb-6 items-end border p-6 rounded-3xl bg-gray-50">
                    <input type="text" placeholder="Color (e.g. Black)" value={variant.color} onChange={(e) => updateVariant(index, 'color', e.target.value)} className="border rounded-2xl px-6 py-5 flex-1 min-w-[140px] text-lg" />
                    <input type="text" placeholder="Type (SHR/PNT/DRS...)" value={variant.typeCode || ''} onChange={(e) => updateVariant(index, 'typeCode', e.target.value.toUpperCase())} className="border rounded-2xl px-6 py-5 w-80 font-mono tracking-widest text-lg uppercase text-center" />
                    <input type="text" placeholder="SKU (e.g. GM-DR-25S-SHR-001-BLK-S)" value={variant.sku || ''} onChange={(e) => updateVariant(index, 'sku', e.target.value.toUpperCase())} className="border rounded-2xl px-6 py-5 flex-2 min-w-[260px] font-mono tracking-widest text-lg uppercase" />
                    <input type="text" placeholder="Size" value={variant.size} onChange={(e) => updateVariant(index, 'size', e.target.value)} className="border rounded-2xl px-6 py-5 w-28 text-lg" />
                    <input type="number" placeholder="Stock" value={variant.stock} onChange={(e) => updateVariant(index, 'stock', e.target.value)} className="border rounded-2xl px-6 py-5 w-32 text-lg" />

                    {/* ── Variant-level discount ── */}
                    <div className="flex items-center gap-2 border rounded-2xl px-4 py-3 bg-orange-50 border-orange-200 min-w-[180px]">
                      <input
                        type="checkbox"
                        checked={variant.isOnSale || false}
                        onChange={(e) => updateVariant(index, 'isOnSale', e.target.checked)}
                        className="w-4 h-4 accent-orange-600"
                      />
                      <span className="text-sm text-orange-700 whitespace-nowrap">Sale</span>
                      <input
                        type="number"
                        placeholder="0"
                        min={0}
                        max={100}
                        value={variant.discountPercentage || ''}
                        onChange={(e) => updateVariant(index, 'discountPercentage', e.target.value)}
                        disabled={!variant.isOnSale}
                        className="w-16 border rounded-xl px-2 py-1 text-center text-sm font-medium focus:outline-none disabled:opacity-40"
                      />
                      <span className="text-sm text-orange-700">%</span>
                    </div>

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