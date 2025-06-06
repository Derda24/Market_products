"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
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
import type { Product } from './types';

// Debug flag for detailed logging
const DEBUG = process.env.NODE_ENV === 'development';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
);

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

  // Enhanced sorting function with nutrition scores
  const sortProducts = (products: Product[]) => {
    return [...products].sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return (a.price || 0) - (b.price || 0);
          
        case 'price-desc':
          return (b.price || 0) - (a.price || 0);
          
        case 'name':
          return a.name.localeCompare(b.name);
          
        case 'best-value':
          const aScore = calculateValueScore(a.price || 0, a.quantity, a.category);
          const bScore = calculateValueScore(b.price || 0, b.quantity, b.category);
          return bScore - aScore;
          
        case 'price-per-unit':
          const aMetrics = calculatePriceMetrics(a.price || 0, a.quantity);
          const bMetrics = calculatePriceMetrics(b.price || 0, b.quantity);
          return aMetrics.pricePerStandardUnit - bMetrics.pricePerStandardUnit;
          
        case 'bulk-deals':
          const aMetrics2 = calculatePriceMetrics(a.price || 0, a.quantity);
          const bMetrics2 = calculatePriceMetrics(b.price || 0, b.quantity);
          const aBulkScore = (aMetrics2.isMultiPack ? 1 : 0) * (1 / aMetrics2.pricePerStandardUnit);
          const bBulkScore = (bMetrics2.isMultiPack ? 1 : 0) * (1 / bMetrics2.pricePerStandardUnit);
          return bBulkScore - aBulkScore;
          
        case 'recent-changes':
          const aDate = new Date(a.last_updated || 0);
          const bDate = new Date(b.last_updated || 0);
          return bDate.getTime() - aDate.getTime();

        case 'nutriscore':
          const nutriScores: Record<string, number> = { 'a': 5, 'b': 4, 'c': 3, 'd': 2, 'e': 1 };
          const aNutriScore = a.nutriscore ? nutriScores[a.nutriscore.toLowerCase()] || 0 : 0;
          const bNutriScore = b.nutriscore ? nutriScores[b.nutriscore.toLowerCase()] || 0 : 0;
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

  // Filter products
  useEffect(() => {
    const filteredProducts = products.filter((product: Product) => {
      const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase());
      const matchesStore = !store || product.store_id === store;
      const matchesPrice = typeof product.price === 'number' ? 
        (product.price >= priceRange[0] && product.price <= priceRange[1]) : 
        false;
      
      return matchesSearch && matchesStore && matchesPrice;
    });

    setFiltered(sortProducts(filteredProducts));
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
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              className="shadow-md border-gray-300"
            />

            <Select onValueChange={(val: string) => setStore(val)}>
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
                <SelectItem value="dia.es">Dia</SelectItem>
              </SelectContent>
            </Select>

            <Select onValueChange={(val: string) => setSortBy(val as SortOption)}>
              <SelectTrigger className="shadow-md border-gray-300">
                <SelectValue placeholder="🔄 Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="price-asc">💰 Price: Low to High</SelectItem>
                <SelectItem value="price-desc">💎 Price: High to Low</SelectItem>
                <SelectItem value="name">📝 Name</SelectItem>
                <SelectItem value="best-value">⭐ Best Value</SelectItem>
                <SelectItem value="price-per-unit">📊 Price per Unit</SelectItem>
                <SelectItem value="bulk-deals">📦 Bulk Deals</SelectItem>
                <SelectItem value="recent-changes">🔄 Recently Updated</SelectItem>
                <SelectItem value="nutriscore">🥗 Best Nutrition (Nutri-Score)</SelectItem>
                <SelectItem value="nova-score">🌱 Least Processed (NOVA)</SelectItem>
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
                onValueChange={(val: number[]) => setPriceRange(val)}
              />
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filtered.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelect={compareMode ? toggleProductSelection : undefined}
                isSelected={selectedProducts.has(product.id)}
                showComparison={compareMode}
              />
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
