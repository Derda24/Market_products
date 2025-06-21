"use client";

import { useEffect, useState } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductCard } from "@/components/ProductCard";
import { calculateValueScore, calculatePriceMetrics, formatPrice } from '@/lib/priceUtils';
import { LoadingScreen } from "@/components/LoadingScreen";

// Debug flag for detailed logging
const DEBUG = process.env.NODE_ENV === 'development';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
);

// Types
interface Product {
  id: string;
  name: string;
  price: number;
  quantity: string;
  category: string;
  store_id: string;
  last_updated?: string;
  nutriscore?: 'a' | 'b' | 'c' | 'd' | 'e';
  nova_group?: 1 | 2 | 3 | 4;
  energy_kcal?: number;
  sugars_100g?: number;
  salt_100g?: number;
  saturated_fat_100g?: number;
}

// Enhanced sort options
type SortOption = 
  | 'price-asc' 
  | 'price-desc' 
  | 'name' 
  | 'best-value' 
  | 'price-per-unit' 
  | 'bulk-deals'
  | 'recent-changes'
  | 'nutriscore'
  | 'nova-score';

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [store, setStore] = useState("");
  const [priceRange, setPriceRange] = useState([0, 100]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('price-asc');
  const [compareMode, setCompareMode] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [initialLoading, setInitialLoading] = useState(true);

  // Add initial loading effect
  useEffect(() => {
    // Simulate initial loading time (you can adjust this)
    const timer = setTimeout(() => {
      setInitialLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Update the fetchProducts function
  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const { data } = await supabase.from("products").select("*");
      setProducts(data || []);
      setFiltered(data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Enhanced sorting function
  const sortProducts = (products: Product[]) => {
    return [...products].sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          if (!a.price) return 1;
          if (!b.price) return -1;
          return a.price - b.price;
          
        case 'price-desc':
          if (!a.price) return 1;
          if (!b.price) return -1;
          return b.price - a.price;
          
        case 'name':
          return a.name.localeCompare(b.name);
          
        case 'best-value':
          if (!a.price || !b.price) return !a.price ? 1 : -1;
          const aScore = calculateValueScore(a.price, a.quantity, a.category);
          const bScore = calculateValueScore(b.price, b.quantity, b.category);
          return bScore - aScore;
          
        case 'price-per-unit':
          if (!a.price || !b.price) return !a.price ? 1 : -1;
          const aMetrics = calculatePriceMetrics(a.price, a.quantity);
          const bMetrics = calculatePriceMetrics(b.price, b.quantity);
          return aMetrics.pricePerStandardUnit - bMetrics.pricePerStandardUnit;
          
        case 'bulk-deals':
          if (!a.price || !b.price) return !a.price ? 1 : -1;
          const aMetrics2 = calculatePriceMetrics(a.price, a.quantity);
          const bMetrics2 = calculatePriceMetrics(b.price, b.quantity);
          const aBulkScore = (aMetrics2.isMultiPack ? 1 : 0) * (1 / aMetrics2.pricePerStandardUnit);
          const bBulkScore = (bMetrics2.isMultiPack ? 1 : 0) * (1 / bMetrics2.pricePerStandardUnit);
          return bBulkScore - aBulkScore;
          
        case 'recent-changes':
          const aDate = new Date(a.last_updated || 0);
          const bDate = new Date(b.last_updated || 0);
          return bDate.getTime() - aDate.getTime();

        case 'nutriscore':
          const nutriScores = { 'a': 5, 'b': 4, 'c': 3, 'd': 2, 'e': 1 };
          const aNutriScore = nutriScores[a.nutriscore?.toLowerCase()] || 0;
          const bNutriScore = nutriScores[b.nutriscore?.toLowerCase()] || 0;
          return bNutriScore - aNutriScore;

        case 'nova-score':
          const aNova = a.nova_group || 5;
          const bNova = b.nova_group || 5;
          return aNova - bNova;  // Lower NOVA scores are better
          
        default:
          return 0;
      }
    });
  };

  // Toggle product selection for comparison
  const toggleProductSelection = (productId: string) => {
    const newSelection = new Set(selectedProducts);
    if (newSelection.has(productId)) {
      newSelection.delete(productId);
    } else if (newSelection.size < 4) { // Limit to comparing 4 products
      newSelection.add(productId);
    }
    setSelectedProducts(newSelection);
  };

  useEffect(() => {
    console.log('🔍 Filtering and sorting products...');
    
    const filteredProducts = products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchesStore = !store || p.store_id === store;
      const matchesPrice = typeof p.price === 'number' ? 
        (p.price >= priceRange[0] && p.price <= priceRange[1]) : 
        false;
      
      return matchesSearch && matchesStore && matchesPrice;
    });

    // Apply sorting
    const sortedProducts = sortProducts(filteredProducts);
    
    console.log('🔍 Filter and sort results:', {
      before: products.length,
      afterFilter: filteredProducts.length,
      afterSort: sortedProducts.length,
      sortBy
    });
    
    setFiltered(sortedProducts);
  }, [search, store, priceRange, products, sortBy]);

  return (
    <>
      <LoadingScreen isLoading={initialLoading} />
      
      <main className={`transition-opacity duration-500 ${initialLoading ? 'opacity-0' : 'opacity-100'}`}>
        <div className="p-4 md:p-10 bg-gradient-to-b from-white to-gray-100 min-h-screen">
          <h1 className="text-5xl font-extrabold text-center text-gray-800 mb-12 drop-shadow-sm">
            🛍 Barcelona Market Product Explorer
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10 items-end bg-white p-6 rounded-xl shadow-sm">
            <Input
              placeholder="🔍 Search products"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="shadow-md border-gray-300"
            />

            <Select onValueChange={(val) => setStore(val)}>
              <SelectTrigger className="shadow-md border-gray-300">
                <SelectValue placeholder="🏬 Filter by store" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lidl.es">Lidl</SelectItem>
                <SelectItem value="carrefour.es">Carrefour</SelectItem>
                <SelectItem value="aldi">Aldi</SelectItem>
                <SelectItem value="bonarea">BonÀrea</SelectItem>
                <SelectItem value="bonpreu">Bonpreu</SelectItem>
                <SelectItem value="condisline">Condisline</SelectItem>
                <SelectItem value="mercadona.es">Mercadona</SelectItem>
                <SelectItem value="El Corte InglEl Corte Inglés">El Corte Inglés</SelectItem>
                <SelectItem value="alcampo">Alcampo</SelectItem>
                <SelectItem value="dia.es">Alcampo</SelectItem>
              </SelectContent>
            </Select>

            <Select onValueChange={(val) => setSortBy(val as SortOption)}>
              <SelectTrigger className="shadow-md border-gray-300">
                <SelectValue placeholder="🔄 Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="price-asc">Price: Low to High</SelectItem>
                <SelectItem value="price-desc">Price: High to Low</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="best-value">Best Value</SelectItem>
                <SelectItem value="price-per-unit">Price per Unit</SelectItem>
                <SelectItem value="bulk-deals">Bulk Deals</SelectItem>
                <SelectItem value="recent-changes">Recently Updated</SelectItem>
                <SelectItem value="nutriscore">Best Nutrition (Nutri-Score)</SelectItem>
                <SelectItem value="nova-score">Least Processed (NOVA)</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => setCompareMode(!compareMode)}
              className={`${compareMode ? 'bg-blue-50' : ''}`}
            >
              {compareMode ? '🔍 Exit Compare' : '🔍 Compare Products'}
            </Button>

            <div className="col-span-2">
              <label className="text-sm text-muted-foreground mb-1 block">
                💶 Price Range (€{priceRange[0]} - €{priceRange[1]})
              </label>
              <Slider
                defaultValue={[0, 100]}
                min={0}
                max={100}
                step={1}
                onValueChange={(val) => setPriceRange(val)}
              />
            </div>
          </div>

          {/* Comparison View */}
          {compareMode && selectedProducts.size > 0 && (
            <div className="mb-8 bg-white p-6 rounded-xl shadow-sm overflow-x-auto">
              <h3 className="text-lg font-semibold mb-4">Product Comparison</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {filtered
                  .filter(p => selectedProducts.has(p.id))
                  .map(product => (
                    <div key={product.id} className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium">{product.name}</h4>
                      <div className="mt-2 space-y-2 text-sm">
                        <p>Price: {formatPrice(product.price, { style: 'detailed', quantity: product.quantity })}</p>
                        <p>Category: {product.category}</p>
                        <p>Store: {product.store_id}</p>
                        <p>Quantity: {product.quantity}</p>
                        {product.price && (
                          <p>Value Score: {calculateValueScore(product.price, product.quantity, product.category).toFixed(0)}/100</p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filtered.map((product) => (
              <div key={product.id} className="relative">
                {compareMode && (
                  <button
                    onClick={() => toggleProductSelection(product.id)}
                    className={`absolute top-2 right-2 z-10 p-2 rounded-full ${
                      selectedProducts.has(product.id)
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {selectedProducts.has(product.id) ? '✓' : '+'}
                  </button>
                )}
                <ProductCard
                  id={product.id}
                  name={product.name}
                  price={product.price}
                  category={product.category}
                  store_id={product.store_id}
                  quantity={product.quantity}
                  image_url={product.image_url}
                />
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <p className="text-center text-gray-500 mt-10">
              ❌ No matching products found. Try adjusting your filters.
            </p>
          )}
        </div>
      </main>
    </>
  );
}
