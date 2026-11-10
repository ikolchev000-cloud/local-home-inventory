import type { CategoryId } from '@/types/inventory';

interface ProductSuggestion {
  name: string;
  brand?: string;
  category: CategoryId;
}

interface OpenFoodFactsResponse {
  product?: {
    product_name?: string;
    brands?: string;
    categories_tags?: string[];
  };
}

export async function lookupProduct(code: string): Promise<ProductSuggestion | null> {
  if (!/^\d{8,14}$/.test(code)) return null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6500);
  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=product_name,brands,categories_tags`,
      { headers: { Accept: 'application/json' }, signal: controller.signal },
    );
    if (!response.ok) return null;
    const data = await response.json() as OpenFoodFactsResponse;
    const name = data.product?.product_name?.trim();
    if (!name) return null;
    const tags = data.product?.categories_tags?.join(' ').toLowerCase() ?? '';
    let category: CategoryId = 'other';
    if (/milk|yogurt|cheese|dairy|egg/.test(tags)) category = 'dairy';
    else if (/fruit|vegetable|produce/.test(tags)) category = 'produce';
    else if (/meat|fish|chicken|seafood/.test(tags)) category = 'meat';
    else if (/frozen/.test(tags)) category = 'frozen';
    else if (/coffee|tea|juice|beverage|drink|water/.test(tags)) category = 'drinks';
    else if (/bread|bakery|pastry/.test(tags)) category = 'bakery';
    else if (/pasta|cereal|rice|grain|flour|grocery/.test(tags)) category = 'pantry';
    return { name, brand: data.product?.brands?.split(',')[0].trim() || undefined, category };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
