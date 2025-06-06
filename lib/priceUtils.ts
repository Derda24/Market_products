// Standard units for conversion
const UNIT_CONVERSIONS: Record<string, number> = {
  // Volume
  ml: 0.001,
  l: 1,
  cl: 0.01,
  // Weight
  g: 0.001,
  kg: 1,
  mg: 0.000001,
  // Count
  units: 1,
  pack: 1,
  piece: 1,
  pieces: 1
};

// Common quantity patterns
const QUANTITY_PATTERNS = [
  // Match "1L", "1.5L", "1,5L"
  /(\d+([.,]\d+)?)\s*(ml|l|cl|g|kg|mg|units?|pack|pieces?)/i,
  // Match "Pack of 6", "Pack of 12"
  /pack\s+of\s+(\d+)/i,
  // Match "6x500ml", "6 x 500ml", "6 x 500 ml"
  /(\d+)\s*x\s*(\d+([.,]\d+)?)\s*(ml|l|cl|g|kg|mg)/i,
  // Match "500ml x 6"
  /(\d+([.,]\d+)?)\s*(ml|l|cl|g|kg|mg)\s*x\s*(\d+)/i
];

export interface PriceMetrics {
  pricePerUnit: number;
  pricePerStandardUnit: number;
  standardUnit: string;
  isMultiPack: boolean;
  totalQuantity: number;
  originalQuantity: string;
}

export function extractQuantityInfo(quantity: string) {
  if (!quantity) {
    return {
      value: 0,
      unit: '',
      isMultiPack: false,
      totalQuantity: 0
    };
  }

  // Handle multi-pack format (e.g., "6 x 500g")
  const multiPackMatch = quantity.match(/(\d+)\s*x\s*(\d+(?:\.\d+)?)\s*([a-zA-Z]+)/i);
  if (multiPackMatch) {
    const units = multiPackMatch[1] ? parseInt(multiPackMatch[1], 10) : 1;
    const value = multiPackMatch[2] ? parseFloat(multiPackMatch[2]) : 0;
    const unit = multiPackMatch[3] ? multiPackMatch[3].toLowerCase() : '';
    
    return {
      value,
      unit,
      isMultiPack: true,
      totalQuantity: units * value
    };
  }

  // Handle single quantity format (e.g., "500g", "1kg", "1L")
  const singleMatch = quantity.match(/(\d+(?:\.\d+)?)\s*([a-zA-Z]+)/i);
  if (singleMatch) {
    const value = singleMatch[1] ? parseFloat(singleMatch[1]) : 0;
    const unit = singleMatch[2] ? singleMatch[2].toLowerCase() : '';
    
    return {
      value,
      unit,
      isMultiPack: false,
      totalQuantity: value
    };
  }

  // Return default values if no pattern matches
  return {
    value: 0,
    unit: '',
    isMultiPack: false,
    totalQuantity: 0
  };
}

export function calculatePriceMetrics(price: number, quantity: string) {
  const quantityInfo = extractQuantityInfo(quantity);
  
  // Convert to standard units (kg or L)
  let standardUnit = '';
  let pricePerStandardUnit = 0;

  if (quantityInfo.unit) {
    const unit = quantityInfo.unit.toLowerCase();
    
    if (['g', 'gr', 'grams', 'gram'].includes(unit)) {
      standardUnit = 'kg';
      pricePerStandardUnit = (price / quantityInfo.totalQuantity) * 1000;
    } else if (['kg', 'kgs', 'kilos', 'kilogram'].includes(unit)) {
      standardUnit = 'kg';
      pricePerStandardUnit = price / quantityInfo.totalQuantity;
    } else if (['ml', 'milliliter', 'millilitre'].includes(unit)) {
      standardUnit = 'L';
      pricePerStandardUnit = (price / quantityInfo.totalQuantity) * 1000;
    } else if (['l', 'liter', 'litre'].includes(unit)) {
      standardUnit = 'L';
      pricePerStandardUnit = price / quantityInfo.totalQuantity;
    } else {
      // For units we don't recognize, just use the original unit
      standardUnit = quantityInfo.unit;
      pricePerStandardUnit = price / quantityInfo.totalQuantity;
    }
  }

  return {
    pricePerStandardUnit,
    standardUnit,
    ...quantityInfo
  };
}

export function calculateValueScore(price: number, quantity: string, category: string): number {
  const quantityInfo = extractQuantityInfo(quantity);
  // Base value calculation
  const valueScore = quantityInfo.totalQuantity / price;
  
  // Category-specific adjustments could be added here
  return valueScore;
}

export function formatPrice(price: number): string {
  return price.toFixed(2);
} 