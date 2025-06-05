import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
);

interface ProductImage {
  imageUrl: string | null;
  error?: string;
  fromCache?: boolean;
}

// Fallback image patterns for different categories
const categoryFallbacks: { [key: string]: string } = {
  'Beverages': 'https://placehold.co/400x400/png?text=Beverage',
  'Food': 'https://placehold.co/400x400/png?text=Food',
  'Fruits': 'https://placehold.co/400x400/png?text=Fruit',
  'Vegetables': 'https://placehold.co/400x400/png?text=Vegetable',
  'Meat': 'https://placehold.co/400x400/png?text=Meat',
  'Dairy': 'https://placehold.co/400x400/png?text=Dairy',
  'Bakery': 'https://placehold.co/400x400/png?text=Bakery',
  'default': 'https://placehold.co/400x400/png?text=Product'
};

// Get fallback image URL based on category
function getFallbackImage(category: string): string {
  const normalizedCategory = Object.keys(categoryFallbacks).find(
    key => category.toLowerCase().includes(key.toLowerCase())
  );
  return categoryFallbacks[normalizedCategory || 'default'];
}

async function ensureProductImagesTable() {
  try {
    // Check if the table exists
    const { error: checkError } = await supabase
      .from('product_images')
      .select('id')
      .limit(1);

    if (checkError && checkError.message.includes('does not exist')) {
      console.log('Creating product_images table...');
      // Create the table using SQL
      const { error: createError } = await supabase.rpc('create_product_images_table');
      
      if (createError) {
        console.error('Failed to create table:', createError);
        return false;
      }
      console.log('Table created successfully');
      return true;
    }
    
    return true;
  } catch (error) {
    console.error('Error checking/creating table:', error);
    return false;
  }
}

export async function getProductImage(productName: string, category: string): Promise<ProductImage> {
  console.log('🔍 Getting image for:', { productName, category });
  
  try {
    // Ensure the table exists
    const tableExists = await ensureProductImagesTable();
    if (!tableExists) {
      console.log('⚠️ Using fallback due to table issues');
      return {
        imageUrl: getFallbackImage(category),
        error: 'Database table not available',
        fromCache: false
      };
    }

    // First check if we already have the image cached in Supabase
    console.log('📦 Checking cache...');
    const { data: existingImage, error: cacheError } = await supabase
      .from('product_images')
      .select('image_url')
      .eq('product_name', productName)
      .single();

    if (cacheError && !cacheError.message.includes('No rows found')) {
      console.log('⚠️ Cache check error:', cacheError.message);
    }

    if (existingImage?.image_url) {
      console.log('✅ Found cached image');
      return { imageUrl: existingImage.image_url, fromCache: true };
    }

    // Use fallback image
    const fallbackUrl = getFallbackImage(category);
    console.log('🎨 Using fallback image for category:', category);

    try {
      // Cache the fallback image
      const { error: insertError } = await supabase
        .from('product_images')
        .insert({
          product_name: productName,
          image_url: fallbackUrl,
          category: category,
          created_at: new Date().toISOString(),
          is_fallback: true
        });

      if (insertError) {
        console.log('⚠️ Failed to cache fallback image:', insertError.message);
      } else {
        console.log('✅ Fallback image cached successfully');
      }

      return { imageUrl: fallbackUrl, fromCache: false };
    } catch (insertError) {
      console.error('❌ Cache insertion error:', insertError);
      return { 
        imageUrl: fallbackUrl,
        error: 'Failed to cache image',
        fromCache: false 
      };
    }
  } catch (error) {
    console.error('❌ Error in getProductImage:', error);
    return { 
      imageUrl: getFallbackImage(category),
      error: error instanceof Error ? error.message : 'Failed to fetch image',
      fromCache: false
    };
  }
} 