import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getPriceHistory, PriceAnalytics } from '@/lib/priceTracking';
import { calculatePriceMetrics, formatPrice } from '@/lib/priceUtils';
import type { Product, ProductCardProps } from '@/app/types';

const ProductCard: React.FC<ProductCardProps> = ({ 
  product,
  onSelect, 
  isSelected, 
  showComparison 
}) => {
  const [priceAnalytics, setPriceAnalytics] = useState<PriceAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadPriceHistory = async () => {
    try {
      setIsLoading(true);
      const analytics = await getPriceHistory(product.id);
      setPriceAnalytics(analytics);
    } catch (error) {
      console.error('Error loading price history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const priceMetrics = product.price ? calculatePriceMetrics(product.price, product.quantity) : { pricePerStandardUnit: 0, standardUnit: '' };
  
  // Nutrition score display helper
  const getNutriscoreColor = (score: string) => {
    const colors: { [key: string]: string } = {
      'a': 'bg-green-500',
      'b': 'bg-light-green-400',
      'c': 'bg-yellow-400',
      'd': 'bg-orange-400',
      'e': 'bg-red-500'
    };
    return colors[score?.toLowerCase()] || 'bg-gray-300';
  };

  const getNovaGroupColor = (group: number) => {
    const colors = [
      'bg-green-500',
      'bg-yellow-400',
      'bg-orange-400',
      'bg-red-500'
    ];
    return colors[group - 1] || 'bg-gray-300';
  };

  return (
    <Card 
      className={`relative overflow-hidden transition-all duration-200 hover:shadow-lg
        ${isSelected ? 'ring-2 ring-blue-500 shadow-lg' : ''}
        ${showComparison ? 'cursor-pointer hover:scale-105' : ''}`}
      onClick={() => onSelect && onSelect(product.id)}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-800 flex-1">{product.name}</h3>
          {product.nutriscore && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <div className={`${getNutriscoreColor(product.nutriscore)} text-white px-2 py-1 rounded-full text-sm font-bold`}>
                    {product.nutriscore.toUpperCase()}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Nutri-Score: {product.nutriscore.toUpperCase()}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        <div className="text-sm text-gray-600 mb-4">{product.quantity}</div>
        
        <div className="flex justify-between items-center mb-2">
          <div className="text-2xl font-bold text-gray-900">
            {product.price ? `${formatPrice(product.price)}€` : 'Price not available'}
          </div>
          {product.nova_group && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <div className={`${getNovaGroupColor(product.nova_group)} text-white px-2 py-1 rounded-full text-sm`}>
                    NOVA {product.nova_group}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>NOVA Group: {product.nova_group}</p>
                  <p className="text-xs">Food processing classification</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {/* Nutrition Facts */}
        {(product.energy_kcal || product.sugars_100g || product.salt_100g || product.saturated_fat_100g) && (
          <div className="mt-4 p-2 bg-gray-50 rounded-lg">
            <div className="text-xs font-semibold text-gray-700 mb-1">Nutrition per 100g:</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {product.energy_kcal && (
                <div>Energy: {product.energy_kcal}kcal</div>
              )}
              {product.sugars_100g && (
                <div>Sugars: {product.sugars_100g}g</div>
              )}
              {product.salt_100g && (
                <div>Salt: {product.salt_100g}g</div>
              )}
              {product.saturated_fat_100g && (
                <div>Sat. Fat: {product.saturated_fat_100g}g</div>
              )}
            </div>
          </div>
        )}

        <div className="mt-2 text-sm text-gray-500">
          {priceMetrics.pricePerStandardUnit > 0 && (
            <div>{formatPrice(priceMetrics.pricePerStandardUnit)}€/{priceMetrics.standardUnit}</div>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          className="mt-4 w-full"
          onClick={(e) => {
            e.stopPropagation();
            loadPriceHistory();
          }}
          disabled={isLoading || !product.price}
        >
          {isLoading ? 'Loading...' : 
           !product.price ? 'Price not available' :
           priceAnalytics ? 'Refresh Price History' : 'View Price History'}
        </Button>
      </CardContent>
    </Card>
  );
};

export { ProductCard }; 