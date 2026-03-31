export interface StockLevel {
  id: string;
  product: ProductSummary;
  warehouse: WarehouseSummary;
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
  quantityOnOrder: number;
  averageCost: number;
  totalValue: number;
  lastCountDate?: string;
  updatedAt?: string;
  isLowStock: boolean;
  needsReorder: boolean;
  stockStatus: StockStatusLevel;
}

export interface ProductSummary {
  id: string;
  code: string;
  name: string;
  unitOfMeasure?: string;
  minStockLevel?: number;
  reorderLevel?: number;
}

export interface WarehouseSummary {
  id: string;
  code: string;
  name: string;
}

export type StockStatusLevel = 'OK' | 'LOW' | 'CRITICAL' | 'OUT_OF_STOCK';

export const STOCK_STATUS_LEVEL_CONFIG: Record<StockStatusLevel, { label: string; color: string }> = {
  'OK': { label: 'En stock', color: 'green' },
  'LOW': { label: 'Stock bas', color: 'orange' },
  'CRITICAL': { label: 'Stock critique', color: 'red' },
  'OUT_OF_STOCK': { label: 'Rupture', color: 'volcano' },
};

// Stock Movement Types
export interface StockMovement {
  id: string;
  product: ProductSummary;
  warehouse: WarehouseSummary;
  movementType: MovementType;
  movementTypeLabel: string;
  quantity: number;
  unitCost?: number;
  referenceType?: string;
  referenceId?: string;
  referenceLabel?: string;
  quantityAfter: number;
  notes?: string;
  createdBy?: UserSummary;
  createdAt: string;
}

export interface UserSummary {
  id: string;
  fullName: string;
}

export type MovementType = 'PURCHASE' | 'SALE' | 'ADJUSTMENT' | 'RETURN' | 'TRANSFER' | 'DAMAGE' | 'INVENTORY';

export interface CreateStockMovementRequest {
  productId: string;
  warehouseId: string;
  movementType: MovementType;
  quantity: number;
  unitCost?: number;
  referenceType?: string;
  referenceId?: string;
  notes?: string;
}

export const MOVEMENT_TYPES = [
  { value: 'PURCHASE', label: 'Achat', color: 'green' },
  { value: 'SALE', label: 'Vente', color: 'blue' },
  { value: 'ADJUSTMENT', label: 'Ajustement', color: 'purple' },
  { value: 'RETURN', label: 'Retour', color: 'cyan' },
  { value: 'TRANSFER', label: 'Transfert', color: 'geekblue' },
  { value: 'DAMAGE', label: 'Casse/Perte', color: 'red' },
  { value: 'INVENTORY', label: 'Inventaire', color: 'orange' },
];

export const MOVEMENT_TYPE_CONFIG: Record<MovementType, { label: string; color: string }> = {
  'PURCHASE': { label: 'Achat', color: 'green' },
  'SALE': { label: 'Vente', color: 'blue' },
  'ADJUSTMENT': { label: 'Ajustement', color: 'purple' },
  'RETURN': { label: 'Retour', color: 'cyan' },
  'TRANSFER': { label: 'Transfert', color: 'geekblue' },
  'DAMAGE': { label: 'Casse/Perte', color: 'red' },
  'INVENTORY': { label: 'Inventaire', color: 'orange' },
};
