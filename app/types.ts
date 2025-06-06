export interface Product {
  id: string;
  name: string;
  price: number | null;
  category: string;
  store_id: string;
  quantity: string;
  image_url?: string;
  nutriscore?: 'a' | 'b' | 'c' | 'd' | 'e';
  nova_group?: 1 | 2 | 3 | 4;
  energy_kcal?: number;
  sugars_100g?: number;
  salt_100g?: number;
  saturated_fat_100g?: number;
  last_updated?: string;
}

export interface ProductCardProps {
  product: Product;
  onSelect?: (id: string) => void;
  isSelected?: boolean;
  showComparison?: boolean;
} 