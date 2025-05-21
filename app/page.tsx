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
    <div className="p-4 md:p-10">
      <h1 className="text-3xl font-bold mb-4">🛒 Market Products</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Input
          placeholder="🔍 Search products"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <Select onValueChange={(val) => setStore(val)}>
          <SelectTrigger>
            <SelectValue placeholder="🏬 Store" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="carrefour">Carrefour</SelectItem>
            <SelectItem value="lidl">Lidl</SelectItem>
            <SelectItem value="bonpreu">Bonpreu</SelectItem>
            <SelectItem value="bonarea">BonÀrea</SelectItem>
          </SelectContent>
        </Select>

        <div className="col-span-2">
          <label className="text-sm text-muted-foreground">
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filtered.map((product) => (
          <Card key={product.id}>
            <CardContent className="p-4">
              <h2 className="font-semibold text-lg mb-1">{product.name}</h2>
              <p className="text-muted-foreground text-sm mb-2">
                Category: {product.category}
              </p>
              <p className="text-muted-foreground text-sm mb-2">
                Store: {product.store_id}
              </p>
              <p className="text-xl font-bold">
                €{typeof product.price === "number" ? product.price.toFixed(2) : "N/A"}
              </p>
              <p className="text-xs mt-1">{product.quantity}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}