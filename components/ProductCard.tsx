import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getPriceHistory, PriceAnalytics } from '@/lib/priceTracking';

interface ProductCardProps {
  id: string;
  name: string;
  price: number | null;
  category: string;
  store_id: string;
  quantity: string;
  image_url?: string;
}

export function ProductCard({ id, name, price, category, store_id, quantity, image_url }: ProductCardProps) {
  const [priceAnalytics, setPriceAnalytics] = useState<PriceAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadPriceHistory = async () => {
    try {
      setIsLoading(true);
      const analytics = await getPriceHistory(id);
      setPriceAnalytics(analytics);
    } catch (error) {
      console.error('Error loading price history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Format price with fallback
  const formattedPrice = typeof price === 'number' ? `€${price.toFixed(2)}` : 'Price not available';

  return (
    <Card className="hover:shadow-2xl transition-shadow duration-300 border border-gray-200 rounded-xl overflow-hidden group">
      <div className="aspect-square w-full relative overflow-hidden bg-gray-100">
        <img
          src={image_url || `https://placehold.co/400x400/png?text=${encodeURIComponent(category)}`}
          alt={name}
          className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            e.currentTarget.src = `https://placehold.co/400x400/png?text=${encodeURIComponent(category)}`;
          }}
        />
      </div>
      <CardContent className="p-6 bg-white">
        <h2 className="font-bold text-lg text-gray-800 mb-2 line-clamp-2">
          {name}
        </h2>
        <p className="text-sm text-gray-500 mb-1">
          🏷️ <span className="font-medium">{category}</span>
        </p>
        <p className="text-sm text-gray-500 mb-1">
          🏪 <span className="font-medium">{store_id}</span>
        </p>
        
        <div className="mt-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-semibold text-green-600">
                    {formattedPrice}
                  </span>
                  {priceAnalytics?.priceChange && typeof price === 'number' && (
                    <span className={`text-sm font-medium ${
                      priceAnalytics.priceChange > 0 ? 'text-red-500' : 'text-green-500'
                    }`}>
                      {priceAnalytics.priceChange > 0 ? '↑' : '↓'}
                      {Math.abs(priceAnalytics.percentageChange || 0).toFixed(1)}%
                    </span>
                  )}
                </div>
              </TooltipTrigger>
              {priceAnalytics && typeof price === 'number' && (
                <TooltipContent className="p-4 w-64">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Price History</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <span>Weekly Avg:</span>
                      <span>€{priceAnalytics.weeklyAverage.toFixed(2)}</span>
                      <span>Monthly Avg:</span>
                      <span>€{priceAnalytics.monthlyAverage.toFixed(2)}</span>
                      <span>Lowest Price:</span>
                      <span>€{priceAnalytics.lowestPrice.toFixed(2)}</span>
                      <span>Highest Price:</span>
                      <span>€{priceAnalytics.highestPrice.toFixed(2)}</span>
                    </div>
                  </div>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
          
          {quantity && (
            <p className="text-xs text-gray-400 mt-1">📦 {quantity}</p>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          className="mt-4 w-full"
          onClick={loadPriceHistory}
          disabled={isLoading || typeof price !== 'number'}
        >
          {isLoading ? 'Loading...' : 
           typeof price !== 'number' ? 'Price not available' :
           priceAnalytics ? 'Refresh Price History' : 'View Price History'}
        </Button>
      </CardContent>
    </Card>
  );
} 