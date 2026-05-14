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

export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first?: boolean;
  last?: boolean;
  meta?: PageMeta;
}

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
