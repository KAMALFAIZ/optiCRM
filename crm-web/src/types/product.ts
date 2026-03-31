// Product Category Types
export interface ProductCategory {
  id: string;
  code: string;
  name: string;
  description?: string;
  sortOrder: number;
  parentCategory?: CategorySummary;
  subCategories?: CategorySummary[];
  fullPath?: string;
  productCount?: number;
  createdAt: string;
}

export interface CategorySummary {
  id: string;
  code: string;
  name: string;
}

export interface ProductCategoryListItem {
  id: string;
  code: string;
  name: string;
  parentCategoryName?: string;
  sortOrder: number;
  productCount: number;
}

export interface CreateProductCategoryRequest {
  code: string;
  name: string;
  description?: string;
  parentCategoryId?: string;
  sortOrder?: number;
}

// Product Types
export interface Product {
  id: string;
  code: string;
  name: string;
  description?: string;
  category?: CategorySummary;
  brand?: string;
  unitPrice: number;
  costPrice?: number;
  currency: string;
  margin?: number;
  profit?: number;
  unitOfMeasure: string;
  isStockable: boolean;
  minStockLevel: number;
  reorderLevel: number;
  defaultTaxRate?: TaxRateSummary;
  isActive: boolean;
  isSellable: boolean;
  isPurchasable: boolean;
  imageUrl?: string;
  datasheetUrl?: string;
  datasheetName?: string;
  stockLevels?: StockInfo[];
  totalStock?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface TaxRateSummary {
  id: string;
  code: string;
  name: string;
  rate: number;
}

export interface StockInfo {
  warehouseId: string;
  warehouseName: string;
  warehouseCode: string;
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
}

export interface ProductListItem {
  id: string;
  code: string;
  name: string;
  categoryName?: string;
  brand?: string;
  unitPrice: number;
  costPrice?: number;
  currency: string;
  unitOfMeasure: string;
  isStockable: boolean;
  isActive: boolean;
  isSellable: boolean;
  totalStock: number;
  stockStatus: StockStatus;
  imageUrl?: string;
}

export type StockStatus = 'OK' | 'LOW' | 'OUT_OF_STOCK' | 'N/A';

export interface CreateProductRequest {
  code: string;
  name: string;
  description?: string;
  categoryId?: string;
  brand?: string;
  unitPrice: number;
  costPrice?: number;
  currency?: string;
  unitOfMeasure?: string;
  isStockable?: boolean;
  minStockLevel?: number;
  reorderLevel?: number;
  defaultTaxRateId?: string;
  isActive?: boolean;
  isSellable?: boolean;
  isPurchasable?: boolean;
  imageUrl?: string;
}

export interface UpdateProductRequest extends Partial<Omit<CreateProductRequest, 'code'>> {}

// Constants
export const CURRENCIES = [
  { value: 'MAD', label: 'MAD - Dirham marocain' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'USD', label: 'USD - Dollar américain' },
];

export const UNITS_OF_MEASURE = [
  { value: 'unité', label: 'Unité' },
  { value: 'pièce', label: 'Pièce' },
  { value: 'kg', label: 'Kilogramme' },
  { value: 'g', label: 'Gramme' },
  { value: 'l', label: 'Litre' },
  { value: 'ml', label: 'Millilitre' },
  { value: 'm', label: 'Mètre' },
  { value: 'cm', label: 'Centimètre' },
  { value: 'm²', label: 'Mètre carré' },
  { value: 'm³', label: 'Mètre cube' },
  { value: 'lot', label: 'Lot' },
  { value: 'carton', label: 'Carton' },
  { value: 'palette', label: 'Palette' },
  { value: 'heure', label: 'Heure' },
  { value: 'jour', label: 'Jour' },
];

export const STOCK_STATUS_CONFIG: Record<StockStatus, { label: string; color: string }> = {
  'OK': { label: 'En stock', color: 'green' },
  'LOW': { label: 'Stock bas', color: 'orange' },
  'OUT_OF_STOCK': { label: 'Rupture', color: 'red' },
  'N/A': { label: 'Non géré', color: 'default' },
};
