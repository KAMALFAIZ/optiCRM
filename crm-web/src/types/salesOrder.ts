export interface SalesOrderLine {
  id?: string;
  productId?: string;
  productCode?: string;
  productName: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  unitOfMeasure?: string;
  discountPercent?: number;
  discountAmount?: number;
  taxRate?: number;
  taxAmount?: number;
  lineTotal?: number;
  sortOrder?: number;
}

export interface SalesOrder {
  id: string;
  orderNumber: string;
  quoteId?: string;
  account: {
    id: string;
    name: string;
  };
  contactId?: string;
  status: OrderStatus;
  orderDate: string;
  expectedDeliveryDate?: string;
  lines?: SalesOrderLine[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  currency: string;
  shippingStreet?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingPostalCode?: string;
  shippingCountry?: string;
  notes?: string;
  assignedTo?: {
    id: string;
    fullName: string;
  };
  createdBy?: {
    id: string;
    fullName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface SalesOrderListItem {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  accountName: string;
  accountId: string;
  orderDate: string;
  expectedDeliveryDate?: string;
  total: number;
  currency: string;
  assignedToName?: string;
  createdByName?: string;
}

export interface SalesOrderLineRequest {
  productId?: string;
  productCode?: string;
  productName: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  unitOfMeasure?: string;
  discountPercent?: number;
  taxRate?: number;
  sortOrder?: number;
}

export interface CreateSalesOrderRequest {
  accountId: string;
  contactId?: string;
  quoteId?: string;
  orderDate: string;
  expectedDeliveryDate?: string;
  lines?: SalesOrderLineRequest[];
  subtotal?: number;
  discountAmount?: number;
  taxAmount?: number;
  total?: number;
  currency?: string;
  shippingStreet?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingPostalCode?: string;
  shippingCountry?: string;
  notes?: string;
  assignedToId?: string;
}

export interface UpdateSalesOrderRequest {
  status?: OrderStatus;
  contactId?: string;
  orderDate?: string;
  expectedDeliveryDate?: string;
  lines?: SalesOrderLineRequest[];
  subtotal?: number;
  discountAmount?: number;
  taxAmount?: number;
  total?: number;
  currency?: string;
  shippingStreet?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingPostalCode?: string;
  shippingCountry?: string;
  notes?: string;
  assignedToId?: string;
}

export type OrderStatus =
  | 'DRAFT'
  | 'CONFIRMED'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

export const ORDER_STATUS_CONFIG: Record<OrderStatus, { label: string; color: string }> = {
  DRAFT: { label: 'Brouillon', color: 'default' },
  CONFIRMED: { label: 'Confirmée', color: 'processing' },
  SHIPPED: { label: 'Expédiée', color: 'warning' },
  DELIVERED: { label: 'Livrée', color: 'success' },
  CANCELLED: { label: 'Annulée', color: 'error' },
};
