import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
);

interface NutritionData {
  nutritionScore: string;
  healthScore?: number;
  error?: string;
  fromCache?: boolean;
}

export async function getProductNutrition(productId: string, productName: string): Promise<NutritionData> {
  try {
    // First check if we have cached nutrition data
    const { data: cachedData, error: cacheError } = await supabase
      .from('nutrition_data')
      .select('*')
      .eq('product_id', productId)
      .single();

    if (cachedData && !cacheError) {
      console.log('✅ Found cached nutrition data for:', productName);
      return {
        nutritionScore: cachedData.nutrition_score,
        healthScore: cachedData.health_score,
        fromCache: true
      };
    }

    // If not in cache, fetch from Open Food Facts
    console.log('🔍 Fetching nutrition data from API for:', productName);
    const searchQuery = encodeURIComponent(productName.toLowerCase());
    
    const response = await fetch(
      `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${searchQuery}&search_simple=1&action=process&json=1`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch nutrition data');
    }

    const data = await response.json();
    
    if (data.products && data.products.length > 0) {
      const product = data.products[0];
      const nutritionScore = product.nutrition_grades || product.nutriscore_grade || 'unknown';
      const healthScore = product.nutriments?.nutrition_score_fr;

      // Cache the nutrition data in Supabase
      const { error: upsertError } = await supabase.rpc('upsert_nutrition_data', {
        p_product_id: productId,
        p_nutrition_score: nutritionScore,
        p_health_score: healthScore || null
      });

      if (upsertError) {
        console.error('❌ Failed to cache nutrition data:', upsertError);
      } else {
        console.log('✅ Cached nutrition data for:', productName);
      }
      
      return {
        nutritionScore,
        healthScore,
        fromCache: false
      };
    }
    
    // If no data found, store unknown values
    await supabase.rpc('upsert_nutrition_data', {
      p_product_id: productId,
      p_nutrition_score: 'unknown',
      p_health_score: null
    });

    return {
      nutritionScore: 'unknown',
      error: 'No nutrition data found',
      fromCache: false
    };

  } catch (error) {
    console.error('❌ Error fetching nutrition data:', error);
    return {
      nutritionScore: 'unknown',
      error: error instanceof Error ? error.message : 'Failed to fetch nutrition data',
      fromCache: false
    };
  }
} 