"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
);

export default function Home() {
  const [products, setProducts] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [store, setStore] = useState("");
  const [priceRange, setPriceRange] = useState([0, 100]);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase.from("products").select("*");
      setProducts(data || []);
      setFiltered(data || []);
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    const f = products.filter(
      (p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) &&
        (!store || p.store_id === store) &&
        p.price >= priceRange[0] &&
        p.price <= priceRange[1]
    );
    setFiltered(f);
  }, [search, store, priceRange, products]);

  return (
    <div className="p-4 md:p-10 bg-gradient-to-b from-white to-gray-100 min-h-screen">
      <h1 className="text-5xl font-extrabold text-center text-gray-800 mb-12 drop-shadow-sm">
        🛍️ Barcelona Market Product Explorer
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

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filtered.map((product) => (
          <Card
            key={product.id}
            className="hover:shadow-2xl transition-shadow duration-300 border border-gray-200 rounded-xl overflow-hidden"
          >
            <CardContent className="p-6 bg-white h-full flex flex-col justify-between">
              <div>
                <h2 className="font-bold text-lg text-gray-800 mb-2">
                  {product.name}
                </h2>
                <p className="text-sm text-gray-500 mb-1">
                  🏷️ <span className="font-medium">{product.category}</span>
                </p>
                <p className="text-sm text-gray-500 mb-1">
                  🏪 <span className="font-medium">{product.store_id}</span>
                </p>
              </div>
              <div className="mt-4">
                <p className="text-xl font-semibold text-green-600">
                  €{typeof product.price === "number" ? product.price.toFixed(2) : "N/A"}
                </p>
                {product.quantity && (
                  <p className="text-xs text-gray-400 mt-1">📦 {product.quantity}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-gray-500 mt-10">
          ❌ No matching products found. Try adjusting your filters.
        </p>
      )}
    </div>
  );
}
