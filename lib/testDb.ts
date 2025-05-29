import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export async function testDatabase() {
  try {
    console.log('🔍 Testing database connection...');

    // Test 1: Check if we can connect
    const { data: test, error: testError } = await supabase
      .from('products')
      .select('count');

    if (testError) {
      throw new Error(`Connection test failed: ${testError.message}`);
    }

    console.log('✅ Connection successful');

    // Test 2: Check if products table exists and has data
    const { count: productCount, error: countError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      throw new Error(`Failed to count products: ${countError.message}`);
    }

    console.log(`📊 Products table has ${productCount} rows`);

    // Test 3: Try to fetch one product
    const { data: sampleProduct, error: productError } = await supabase
      .from('products')
      .select('*')
      .limit(1)
      .single();

    if (productError) {
      throw new Error(`Failed to fetch sample product: ${productError.message}`);
    }

    console.log('📦 Sample product:', sampleProduct);

    // Test 4: Check nutrition_data table
    const { count: nutritionCount, error: nutritionError } = await supabase
      .from('nutrition_data')
      .select('*', { count: 'exact', head: true });

    if (nutritionError) {
      throw new Error(`Failed to count nutrition data: ${nutritionError.message}`);
    }

    console.log(`🥗 Nutrition data table has ${nutritionCount} rows`);

    // Test 5: Try a join query
    const { data: joinTest, error: joinError } = await supabase
      .from('products')
      .select(`
        *,
        nutrition_data (
          nutrition_score,
          health_score
        )
      `)
      .limit(1)
      .single();

    if (joinError) {
      throw new Error(`Failed to test join query: ${joinError.message}`);
    }

    console.log('🔄 Join query result:', joinTest);

    return {
      success: true,
      productCount,
      nutritionCount,
      sampleData: joinTest
    };

  } catch (error) {
    console.error('❌ Database test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
} 