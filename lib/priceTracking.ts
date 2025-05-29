import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
);

export interface PriceHistory {
  id: string;
  product_id: string;
  price: number;
  store_id: string;
  recorded_at: string;
  valid_until: string | null;
  is_current: boolean;
}

export interface PriceAnalytics {
  currentPrice: number;
  previousPrice: number | null;
  priceChange: number | null;
  percentageChange: number | null;
  weeklyAverage: number;
  monthlyAverage: number;
  lowestPrice: number;
  highestPrice: number;
  priceHistory: PriceHistory[];
}

export async function updateProductPrice(productId: string, newPrice: number, storeId: string) {
  try {
    const { data, error } = await supabase
      .from('products')
      .update({ price: newPrice })
      .eq('id', productId)
      .select();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating price:', error);
    throw error;
  }
}

export async function getPriceHistory(productId: string): Promise<PriceAnalytics> {
  try {
    // Get all price history for the product
    const { data: history, error } = await supabase
      .from('price_history')
      .select('*')
      .eq('product_id', productId)
      .order('recorded_at', { ascending: false });

    if (error) throw error;

    if (!history || history.length === 0) {
      throw new Error('No price history found');
    }

    // Current price is the most recent one
    const currentPrice = history[0].price;
    
    // Previous price is the second most recent
    const previousPrice = history.length > 1 ? history[1].price : null;
    
    // Calculate price change
    const priceChange = previousPrice ? currentPrice - previousPrice : null;
    const percentageChange = previousPrice ? ((currentPrice - previousPrice) / previousPrice) * 100 : null;

    // Calculate weekly average (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weeklyPrices = history.filter(p => new Date(p.recorded_at) >= weekAgo);
    const weeklyAverage = weeklyPrices.reduce((sum, p) => sum + p.price, 0) / weeklyPrices.length;

    // Calculate monthly average (last 30 days)
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    const monthlyPrices = history.filter(p => new Date(p.recorded_at) >= monthAgo);
    const monthlyAverage = monthlyPrices.reduce((sum, p) => sum + p.price, 0) / monthlyPrices.length;

    // Get lowest and highest prices
    const lowestPrice = Math.min(...history.map(p => p.price));
    const highestPrice = Math.max(...history.map(p => p.price));

    return {
      currentPrice,
      previousPrice,
      priceChange,
      percentageChange,
      weeklyAverage,
      monthlyAverage,
      lowestPrice,
      highestPrice,
      priceHistory: history
    };
  } catch (error) {
    console.error('Error fetching price history:', error);
    throw error;
  }
}

export async function getProductsWithPriceChanges(days: number = 7) {
  try {
    const date = new Date();
    date.setDate(date.getDate() - days);

    const { data, error } = await supabase
      .from('price_history')
      .select(`
        *,
        products (
          name,
          category,
          store_id
        )
      `)
      .gte('recorded_at', date.toISOString())
      .order('recorded_at', { ascending: false });

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error fetching price changes:', error);
    throw error;
  }
}

export async function analyzePriceTrends(productId: string) {
  const history = await getPriceHistory(productId);
  
  // Calculate weekly price volatility
  const weeklyPrices = history.priceHistory.slice(0, 7);
  const priceChanges = weeklyPrices.map((p, i) => {
    if (i === weeklyPrices.length - 1) return 0;
    return Math.abs(p.price - weeklyPrices[i + 1].price);
  });
  
  const volatility = priceChanges.reduce((sum, change) => sum + change, 0) / priceChanges.length;

  return {
    ...history,
    volatility,
    isVolatile: volatility > 0.5, // Consider prices volatile if average daily change is more than €0.50
    trend: history.priceChange && history.priceChange > 0 ? 'increasing' : 'decreasing'
  };
} 