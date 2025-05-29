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

export function extractQuantityInfo(quantityStr: string): { 
  value: number;
  unit: string;
  isMultiPack: boolean;
  totalQuantity: number;
} {
  if (!quantityStr) {
    return { value: 1, unit: 'units', isMultiPack: false, totalQuantity: 1 };
  }

  // Normalize the quantity string
  const normalized = quantityStr.toLowerCase().replace(',', '.');

  for (const pattern of QUANTITY_PATTERNS) {
    const match = normalized.match(pattern);
    if (match) {
      // Handle multipack patterns
      if (pattern.source.includes('pack of')) {
        return {
          value: parseFloat(match[1]),
          unit: 'units',
          isMultiPack: true,
          totalQuantity: parseFloat(match[1])
        };
      }
      
      // Handle "6x500ml" pattern
      if (pattern.source.includes('x')) {
        const units = parseFloat(match[1]);
        const quantity = parseFloat(match[2]);
        const unit = match[4].toLowerCase();
        return {
          value: quantity,
          unit,
          isMultiPack: true,
          totalQuantity: units * quantity
        };
      }

      // Standard single unit pattern
      return {
        value: parseFloat(match[1]),
        unit: match[3].toLowerCase(),
        isMultiPack: false,
        totalQuantity: parseFloat(match[1])
      };
    }
  }

  // Default fallback
  return { value: 1, unit: 'units', isMultiPack: false, totalQuantity: 1 };
}

export function calculatePriceMetrics(price: number, quantity: string): PriceMetrics {
  const { value, unit, isMultiPack, totalQuantity } = extractQuantityInfo(quantity);
  
  // Get the conversion factor for the unit
  const conversionFactor = UNIT_CONVERSIONS[unit] || 1;
  
  // Calculate price per unit
  const pricePerUnit = price / value;
  
  // Calculate price per standard unit (per L, per kg, or per piece)
  const pricePerStandardUnit = price / (totalQuantity * conversionFactor);
  
  // Determine the standard unit for display
  let standardUnit = unit;
  if (UNIT_CONVERSIONS[unit]) {
    if (['ml', 'cl', 'l'].includes(unit)) standardUnit = 'L';
    if (['mg', 'g', 'kg'].includes(unit)) standardUnit = 'kg';
  }

  return {
    pricePerUnit,
    pricePerStandardUnit,
    standardUnit,
    isMultiPack,
    totalQuantity,
    originalQuantity: quantity
  };
}

export function calculateValueScore(price: number, quantity: string, category: string): number {
  const metrics = calculatePriceMetrics(price, quantity);
  
  // Base score is inverse of price per standard unit (lower price = higher score)
  let score = 100 / metrics.pricePerStandardUnit;
  
  // Bonus for bulk purchases (if it's a multipack)
  if (metrics.isMultiPack) {
    score *= 1.1; // 10% bonus for bulk purchases
  }
  
  // Normalize score to 0-100 range
  return Math.min(100, Math.max(0, score));
}

export function formatPrice(price: number, options: { 
  style?: 'standard' | 'detailed';
  quantity?: string;
} = {}): string {
  if (typeof price !== 'number') return 'Price not available';
  
  if (options.style === 'detailed' && options.quantity) {
    const metrics = calculatePriceMetrics(price, options.quantity);
    return `€${price.toFixed(2)} (€${metrics.pricePerStandardUnit.toFixed(2)}/${metrics.standardUnit})`;
  }
  
  return `€${price.toFixed(2)}`;
} 