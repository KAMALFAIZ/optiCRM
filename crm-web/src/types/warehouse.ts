export interface Warehouse {
  id: string;
  code: string;
  name: string;
  addressStreet?: string;
  addressCity?: string;
  addressPostalCode?: string;
  addressCountry?: string;
  fullAddress?: string;
  isDefault: boolean;
  isActive: boolean;
  productCount?: number;
  totalValue?: number;
  createdAt: string;
}

export interface WarehouseListItem {
  id: string;
  code: string;
  name: string;
  addressCity?: string;
  isDefault: boolean;
  isActive: boolean;
}

export interface CreateWarehouseRequest {
  code: string;
  name: string;
  addressStreet?: string;
  addressCity?: string;
  addressPostalCode?: string;
  addressCountry?: string;
  isDefault?: boolean;
  isActive?: boolean;
}

export interface UpdateWarehouseRequest extends Partial<Omit<CreateWarehouseRequest, 'code'>> {}
