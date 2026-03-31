export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: PageMeta;
  timestamp: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: FieldError[];
}

export interface FieldError {
  field: string;
  message: string;
  rejectedValue?: unknown;
}

export interface PageMeta {
  page: number;
  size: number;
  perPage?: number;
  totalElements: number;
  total?: number;
  totalPages: number;
}

export interface PageRequest {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

// Type flexible pour supporter les deux formats de réponse paginée
export interface PagedResponse<T> {
  content: T[];
  // Format direct (backend PageResponse)
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first?: boolean;
  last?: boolean;
  // Format avec meta (ancien format) - optionnel
  meta?: PageMeta;
}

// Helper pour créer une réponse paginée à partir du format meta
export function fromMeta<T>(content: T[], meta: PageMeta): PagedResponse<T> {
  return {
    content,
    page: meta.page,
    size: meta.size,
    totalElements: meta.totalElements,
    totalPages: meta.totalPages,
    meta,
  };
}
