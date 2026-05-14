import apiClient from './client';

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

export interface DeliveryTour {
  id?: string;
  name?: string;
  description?: string;
  tourDate: string;
  status?: string;
  region?: string;
  zone?: string;
  assignedToId?: string;
  assignedTo?: { id: string; fullName: string; email: string };
  totalVisits?: number;
  completedVisits?: number;
  notes?: string;
  vehicleType?: string;
}

export interface AvailableStock {
  itemId: string;
  loaded: number;
  delivered: number;
  available: number;
}

export interface DeliveryLine {
  id?: string;
  deliveryTourId: string;
  customerId?: string;
  itemId?: string;
  quantity?: number;
  unitPrice?: number;
  amount?: number;
  paymentMode?: string;
  paidAmount?: number;
  visitResult?: string;   // DELIVERED | ABSENT | REFUSED | CLOSED | PARTIAL
  visitNotes?: string;
}

export interface VehicleLoadItem {
  id?: string;
  itemId?: string;
  quantity?: number;
  batchId?: string;
  lotNumber?: string;
  expiryDate?: string;
}

export interface VehicleLoad {
  id?: string;
  deliveryTourId: string;
  loadDate?: string;
  warehouseFromId?: string;
  status?: string;
  items?: VehicleLoadItem[];
}

export interface ReturnEntry {
  id?: string;
  deliveryTourId: string;
  itemId?: string;
  quantity?: number;
  reason?: string;
  receivedDate?: string;
  warehouseToId?: string;
  status?: string;
}

export interface StockReplenishmentItem {
  id?: string;
  itemId?: string;
  quantity?: number;
  notes?: string;
}

export interface StockReplenishment {
  id?: string;
  sourceType: string;
  sourceId: string;
  targetType: string;
  targetId: string;
  motive: string;
  requestDate?: string;
  status?: string;
  approvedBy?: string;
  approvalDate?: string;
  items?: StockReplenishmentItem[];
}

export interface SettlementReport {
  id?: string;
  deliveryTourId?: string;
  totalAmount?: number;
  collectedAmount?: number;
  cashAmount?: number;
  chequeAmount?: number;
  creditAmount?: number;
  creditBalance?: number;
  unloadedValue?: number;
  discrepancy?: number;
  generatedAt?: string;
  status?: string;
}

export interface VehicleUnloadItem {
  id?: string;
  itemId?: string;
  quantityLoaded?: number;
  quantitySold?: number;
  quantityReturned?: number;
  quantityUnloaded?: number;
}

export interface VehicleUnload {
  id?: string;
  deliveryTourId?: string;
  unloadDate?: string;
  status?: string;       // DRAFT | CONFIRMED
  notes?: string;
  confirmedBy?: string;
  confirmedAt?: string;
  items?: VehicleUnloadItem[];
}

export interface AuditTrail {
  id?: number;
  action: string;
  entityType: string;
  entityId?: string;
  whoUserId?: string;
  whatChanged?: string;
  whenDate?: string;
  whereLocation?: string;
  whyReason?: string;
}

// ═══════════════════════════════════════════════════════════════
// Delivery Tour API
// ═══════════════════════════════════════════════════════════════

export const deliveryTourApi = {
  list: async (params?: { date?: string; status?: string }): Promise<DeliveryTour[]> => {
    const response = await apiClient.get<DeliveryTour[]>('/delivery/tour', { params });
    return response.data || [];
  },

  getById: async (id: string): Promise<DeliveryTour> => {
    const response = await apiClient.get<DeliveryTour>(`/delivery/tour/${id}`);
    return response.data;
  },

  create: async (data: DeliveryTour): Promise<DeliveryTour> => {
    const response = await apiClient.post<DeliveryTour>('/delivery/tour', data);
    return response.data;
  },

  validate: async (id: string): Promise<DeliveryTour> => {
    const response = await apiClient.put<DeliveryTour>(`/delivery/tour/${id}/validate`);
    return response.data;
  },

  close: async (id: string): Promise<DeliveryTour> => {
    const response = await apiClient.put<DeliveryTour>(`/delivery/tour/${id}/close`);
    return response.data;
  },
};

// ═══════════════════════════════════════════════════════════════
// Delivery Line API
// ═══════════════════════════════════════════════════════════════

export const deliveryLineApi = {
  listByTour: async (tourId: string): Promise<DeliveryLine[]> => {
    const response = await apiClient.get<DeliveryLine[]>(`/delivery/line/tour/${tourId}`);
    return response.data || [];
  },

  getById: async (id: string): Promise<DeliveryLine> => {
    const response = await apiClient.get<DeliveryLine>(`/delivery/line/${id}`);
    return response.data;
  },

  create: async (data: DeliveryLine): Promise<DeliveryLine> => {
    const response = await apiClient.post<DeliveryLine>('/delivery/line', data);
    return response.data;
  },

  update: async (id: string, data: DeliveryLine): Promise<DeliveryLine> => {
    const response = await apiClient.put<DeliveryLine>(`/delivery/line/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/delivery/line/${id}`);
  },

  getAvailableStock: async (tourId: string): Promise<AvailableStock[]> => {
    const response = await apiClient.get<AvailableStock[]>(`/delivery/line/tour/${tourId}/available-stock`);
    return response.data || [];
  },
};

// ═══════════════════════════════════════════════════════════════
// Vehicle Load API
// ═══════════════════════════════════════════════════════════════

export const vehicleLoadApi = {
  listByTour: async (tourId: string): Promise<VehicleLoad[]> => {
    const response = await apiClient.get<VehicleLoad[]>(`/delivery/vehicle-load/tour/${tourId}`);
    return response.data || [];
  },

  getById: async (id: string): Promise<VehicleLoad> => {
    const response = await apiClient.get<VehicleLoad>(`/delivery/vehicle-load/${id}`);
    return response.data;
  },

  create: async (data: {
    deliveryTourId: string;
    warehouseFromId?: string;
    loadDate?: string;
    items?: Array<{ itemId?: string; quantity?: number }>;
  }): Promise<VehicleLoad> => {
    const response = await apiClient.post<VehicleLoad>('/delivery/vehicle-load', data);
    return response.data;
  },

  markLoaded: async (id: string): Promise<VehicleLoad> => {
    const response = await apiClient.put<VehicleLoad>(`/delivery/vehicle-load/${id}/confirm`);
    return response.data;
  },

  confirmSession: async (sessionId: string): Promise<VehicleLoad> => {
    const response = await apiClient.put<VehicleLoad>(`/delivery/vehicle-load/${sessionId}/confirm`);
    return response.data;
  },

  addItem: async (sessionId: string, data: { itemId: string; quantity: number }): Promise<VehicleLoadItem> => {
    const response = await apiClient.post<VehicleLoadItem>(`/delivery/vehicle-load/${sessionId}/items`, data);
    return response.data;
  },

  updateItem: async (itemId: string, data: { itemId?: string; quantity?: number }): Promise<VehicleLoadItem> => {
    const response = await apiClient.put<VehicleLoadItem>(`/delivery/vehicle-load/items/${itemId}`, data);
    return response.data;
  },

  deleteItem: async (itemId: string): Promise<void> => {
    await apiClient.delete(`/delivery/vehicle-load/items/${itemId}`);
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/delivery/vehicle-load/${id}`);
  },
};

// ═══════════════════════════════════════════════════════════════
// Return Entry API
// ═══════════════════════════════════════════════════════════════

export const returnEntryApi = {
  listByTour: async (tourId: string): Promise<ReturnEntry[]> => {
    const response = await apiClient.get<ReturnEntry[]>(`/delivery/return-entry/tour/${tourId}`);
    return response.data || [];
  },

  getById: async (id: string): Promise<ReturnEntry> => {
    const response = await apiClient.get<ReturnEntry>(`/delivery/return-entry/${id}`);
    return response.data;
  },

  create: async (data: ReturnEntry): Promise<ReturnEntry> => {
    const response = await apiClient.post<ReturnEntry>('/delivery/return-entry', data);
    return response.data;
  },

  receive: async (id: string): Promise<ReturnEntry> => {
    const response = await apiClient.put<ReturnEntry>(`/delivery/return-entry/${id}/receive`);
    return response.data;
  },

  validate: async (id: string): Promise<ReturnEntry> => {
    const response = await apiClient.put<ReturnEntry>(`/delivery/return-entry/${id}/validate`);
    return response.data;
  },
};

// ═══════════════════════════════════════════════════════════════
// Stock Replenishment API
// ═══════════════════════════════════════════════════════════════

export const stockReplenishmentApi = {
  list: async (params?: { status?: string; motive?: string }): Promise<StockReplenishment[]> => {
    const response = await apiClient.get<StockReplenishment[]>('/delivery/stock-replenishment', { params });
    return response.data || [];
  },

  getById: async (id: string): Promise<StockReplenishment> => {
    const response = await apiClient.get<StockReplenishment>(`/delivery/stock-replenishment/${id}`);
    return response.data;
  },

  create: async (data: StockReplenishment): Promise<StockReplenishment> => {
    const response = await apiClient.post<StockReplenishment>('/delivery/stock-replenishment', data);
    return response.data;
  },

  approve: async (id: string, approvedByUserId: string): Promise<void> => {
    await apiClient.put(`/delivery/stock-replenishment/${id}/approve`, null, {
      params: { approvedByUserId },
    });
  },

  apply: async (id: string): Promise<void> => {
    await apiClient.put(`/delivery/stock-replenishment/${id}/apply`);
  },

  transferToLoad: async (id: string, tourId?: string): Promise<VehicleLoad> => {
    const params = tourId ? { tourId } : {};
    const response = await apiClient.post<VehicleLoad>(
      `/delivery/stock-replenishment/${id}/transfer-to-load`,
      null,
      { params }
    );
    return response.data;
  },
};

// ═══════════════════════════════════════════════════════════════
// Settlement API
// ═══════════════════════════════════════════════════════════════

export const settlementApi = {
  generate: async (tourId: string): Promise<SettlementReport> => {
    const response = await apiClient.post<SettlementReport>(`/delivery/settlement/tour/${tourId}`);
    return response.data;
  },

  getByTour: async (tourId: string): Promise<SettlementReport> => {
    const response = await apiClient.get<SettlementReport>(`/delivery/settlement/tour/${tourId}`);
    return response.data;
  },
};

// ═══════════════════════════════════════════════════════════════
// Vehicle Unload API
// ═══════════════════════════════════════════════════════════════

export const vehicleUnloadApi = {
  getByTour: async (tourId: string): Promise<VehicleUnload | null> => {
    try {
      const response = await apiClient.get<VehicleUnload>(`/delivery/unload/tour/${tourId}`);
      return response.data;
    } catch {
      return null;
    }
  },

  generate: async (tourId: string): Promise<VehicleUnload> => {
    const response = await apiClient.post<VehicleUnload>(`/delivery/unload/tour/${tourId}/generate`);
    return response.data;
  },

  confirm: async (unloadId: string, confirmedBy?: string, items?: Partial<VehicleUnloadItem>[]): Promise<VehicleUnload> => {
    const response = await apiClient.post<VehicleUnload>(`/delivery/unload/${unloadId}/confirm`, {
      confirmedBy,
      items,
    });
    return response.data;
  },
};

// ═══════════════════════════════════════════════════════════════
// Audit Trail API
// ═══════════════════════════════════════════════════════════════

export const auditTrailApi = {
  getByEntity: async (entityType: string, entityId: string): Promise<AuditTrail[]> => {
    const response = await apiClient.get<AuditTrail[]>('/delivery/audit-trail/entity', {
      params: { entityType, entityId },
    });
    return response.data || [];
  },

  getByDateRange: async (from: string, to: string): Promise<AuditTrail[]> => {
    const response = await apiClient.get<AuditTrail[]>('/delivery/audit-trail/date-range', {
      params: { from, to },
    });
    return response.data || [];
  },
};

// Export unified API
export const deliveryApi = {
  tour: deliveryTourApi,
  line: deliveryLineApi,
  vehicleLoad: vehicleLoadApi,
  vehicleUnload: vehicleUnloadApi,
  return: returnEntryApi,
  replenishment: stockReplenishmentApi,
  settlement: settlementApi,
  audit: auditTrailApi,
};

export default deliveryApi;
