// Pricing Category Types

export interface PricingCategory {
  id: string;
  code: string;
  name: string;
  description?: string;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt?: string;
}

export interface CreatePricingCategoryRequest {
  code: string;
  name: string;
  description?: string;
  isDefault?: boolean;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdatePricingCategoryRequest {
  name?: string;
  description?: string;
  isDefault?: boolean;
  isActive?: boolean;
  sortOrder?: number;
}

// Product price per category
export interface ProductPrice {
  id: string;
  categoryId: string;
  categoryCode: string;
  categoryName: string;
  categoryIsDefault: boolean;
  unitPrice: number;
  currency: string;
}

export interface SetProductPriceRequest {
  pricingCategoryId: string;
  unitPrice: number;
  currency?: string;
}
