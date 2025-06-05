import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

const sampleProducts = [
  {
    name: "Extra Virgin Olive Oil",
    price: 5.99,
    category: "Oils & Vinegars",
    store_id: "mercadona.es",
    quantity: "1L",
    image_url: "https://prod-mercadona.imgix.net/images/930c56fb6f1c4f8e9d0f1f6a6f0e6f0d.jpg"
  },
  {
    name: "Organic Olive Oil",
    price: 7.99,
    category: "Oils & Vinegars",
    store_id: "carrefour.es",
    quantity: "750ml",
    image_url: "https://static.carrefour.es/hd_510x_/img_pim_food/317013_00_1.jpg"
  },
  {
    name: "Fresh Whole Milk",
    price: 1.29,
    category: "Dairy",
    store_id: "lidl.es",
    quantity: "1L",
    image_url: "https://cdn.lidl-silvercrest.com/assets/mc/fresh-milk-1l.jpg"
  },
  {
    name: "White Bread",
    price: 0.99,
    category: "Bakery",
    store_id: "mercadona.es",
    quantity: "460g",
    image_url: "https://prod-mercadona.imgix.net/images/bread.jpg"
  }
];

const sampleNutritionData = [
  {
    product_id: "", // Will be filled after product creation
    nutrition_score: "b",
    health_score: 75
  },
  {
    product_id: "", // Will be filled after product creation
    nutrition_score: "a",
    health_score: 85
  },
  {
    product_id: "", // Will be filled after product creation
    nutrition_score: "b",
    health_score: 80
  },
  {
    product_id: "", // Will be filled after product creation
    nutrition_score: "c",
    health_score: 65
  }
];

export async function populateSampleData() {
  try {
    console.log('🌱 Starting to populate sample data...');

    // Insert products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .upsert(sampleProducts)
      .select();

    if (productsError) {
      throw new Error(`Failed to insert products: ${productsError.message}`);
    }

    console.log('✅ Products inserted:', products.length);

    // Link nutrition data with products
    const nutritionDataWithIds = sampleNutritionData.map((nutrition, index) => ({
      ...nutrition,
      product_id: products[index].id
    }));

    const { data: nutrition, error: nutritionError } = await supabase
      .from('nutrition_data')
      .upsert(nutritionDataWithIds)
      .select();

    if (nutritionError) {
      throw new Error(`Failed to insert nutrition data: ${nutritionError.message}`);
    }

    console.log('✅ Nutrition data inserted:', nutrition.length);

    return {
      success: true,
      productsInserted: products.length,
      nutritionInserted: nutrition.length
    };

  } catch (error) {
    console.error('❌ Failed to populate sample data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
} 