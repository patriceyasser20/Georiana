// lib/offers.ts
//
// Shared "Buy X Get Y" offer engine.
// Used by: ProductCard (badge), product page (badge), review-order page
// (line-item discounts), and checkout page (final totals).

export type Offer = {
  id: string;
  name: string;
  offer_type: 'bxgy_free' | 'bxgy_percent';
  buy_quantity: number;
  get_quantity: number;
  discount_percentage: number;
  scope_type: 'product' | 'category' | 'collection' | 'all';
  scope_value: string;
  require_same_variant: boolean;
  is_active: boolean;
  ends_at: string | null;
};

export type CartItem = {
  id: string;          // product id
  name: string;
  price: number;
  originalPrice?: number;
  size?: string;
  color?: string;
  quantity: number;
  category?: string;
  collection?: string;
  [key: string]: any;
};

export type OfferLineResult = {
  offerApplied: Offer | null;
  freeUnits: number;          // count of fully-free units across the cart for this offer
  discountedUnits: number;    // count of partially-discounted units
  totalDiscount: number;      // total EGP amount knocked off
};

export function isOfferLive(offer: Offer): boolean {
  if (!offer.is_active) return false;
  if (offer.ends_at && new Date(offer.ends_at) < new Date()) return false;
  return true;
}

function matchesScope(item: CartItem, offer: Offer): boolean {
  if (offer.scope_type === 'all') return true;
  if (offer.scope_type === 'product') return item.id === offer.scope_value;
  if (offer.scope_type === 'category') return item.category === offer.scope_value;
  if (offer.scope_type === 'collection') return item.collection === offer.scope_value;
  return false;
}

/**
 * Groups cart items into "buckets" that an offer should evaluate together.
 * If require_same_variant is true, each unique size+color combination is its
 * own bucket (so "buy 2 get 1 free" only counts matching size/color towards
 * each other). If false, every matching item across the whole product/
 * category/collection is pooled into a single bucket.
 */
function bucketItems(items: CartItem[], offer: Offer): CartItem[][] {
  const matching = items.filter((i) => matchesScope(i, offer));
  if (matching.length === 0) return [];

  if (!offer.require_same_variant) {
    return [matching];
  }

  const groups: Record<string, CartItem[]> = {};
  for (const item of matching) {
    const key = `${item.size || ''}__${item.color || ''}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  }
  return Object.values(groups);
}

/**
 * Expands cart items (which carry a `quantity`) into a flat list of
 * single-unit "tickets" sorted cheapest-first, so the discount always lands
 * on the cheapest qualifying units as specified.
 */
function expandToUnits(bucket: CartItem[]): { price: number; item: CartItem }[] {
  const units: { price: number; item: CartItem }[] = [];
  for (const item of bucket) {
    for (let i = 0; i < item.quantity; i++) {
      units.push({ price: Number(item.price), item });
    }
  }
  return units.sort((a, b) => a.price - b.price); // cheapest first
}

/**
 * Calculates the total discount a single offer contributes across the cart.
 */
export function calculateOfferDiscount(items: CartItem[], offer: Offer): OfferLineResult {
  if (!isOfferLive(offer)) {
    return { offerApplied: null, freeUnits: 0, discountedUnits: 0, totalDiscount: 0 };
  }

  const buckets = bucketItems(items, offer);
  if (buckets.length === 0) {
    return { offerApplied: null, freeUnits: 0, discountedUnits: 0, totalDiscount: 0 };
  }

  const groupSize = offer.buy_quantity + offer.get_quantity;
  let totalDiscount = 0;
  let freeUnits = 0;
  let discountedUnits = 0;

  for (const bucket of buckets) {
    const units = expandToUnits(bucket);
    const fullGroups = Math.floor(units.length / groupSize);
    if (fullGroups === 0) continue;

    // For each full group, the cheapest `get_quantity` units receive the
    // discount (units are already sorted cheapest-first across the bucket).
    const discountedCount = fullGroups * offer.get_quantity;
    const discountedUnitsSlice = units.slice(0, discountedCount);

    for (const u of discountedUnitsSlice) {
      if (offer.offer_type === 'bxgy_free') {
        totalDiscount += u.price;
        freeUnits += 1;
      } else {
        totalDiscount += u.price * (offer.discount_percentage / 100);
        discountedUnits += 1;
      }
    }
  }

  if (totalDiscount === 0) {
    return { offerApplied: null, freeUnits: 0, discountedUnits: 0, totalDiscount: 0 };
  }

  return {
    offerApplied: offer,
    freeUnits,
    discountedUnits,
    totalDiscount: Math.round(totalDiscount * 100) / 100,
  };
}

/**
 * Runs every active offer against the cart and returns the combined result.
 */
export function calculateAllOffers(
  items: CartItem[],
  offers: Offer[]
): { results: OfferLineResult[]; totalDiscount: number } {
  const liveOffers = offers.filter(isOfferLive);
  const results: OfferLineResult[] = [];
  let totalDiscount = 0;

  for (const offer of liveOffers) {
    const result = calculateOfferDiscount(items, offer);
    if (result.offerApplied) {
      results.push(result);
      totalDiscount += result.totalDiscount;
    }
  }

  return { results, totalDiscount: Math.round(totalDiscount * 100) / 100 };
}

/**
 * Quick check used for product badges: does this product/category/collection
 * currently have a live offer? Returns the first matching offer, if any.
 */
export function findOfferForProduct(
  product: { id: string; category?: string; collection?: string },
  offers: Offer[]
): Offer | null {
  const liveOffers = offers.filter(isOfferLive);
  for (const offer of liveOffers) {
    if (offer.scope_type === 'all') return offer;
    if (offer.scope_type === 'product' && offer.scope_value === product.id) return offer;
    if (offer.scope_type === 'category' && offer.scope_value === product.category) return offer;
    if (offer.scope_type === 'collection' && offer.scope_value === product.collection) return offer;
  }
  return null;
}

export function offerBadgeText(offer: Offer): string {
  return offer.offer_type === 'bxgy_free'
    ? `Buy ${offer.buy_quantity} Get ${offer.get_quantity} Free`
    : `Buy ${offer.buy_quantity} Get ${offer.get_quantity} -${offer.discount_percentage}%`;
}