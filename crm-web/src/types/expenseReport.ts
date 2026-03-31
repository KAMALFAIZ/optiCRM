export type ExpenseReportStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'REIMBURSED';

export interface ExpenseReport {
  id: string;
  reportNumber: string;
  status: ExpenseReportStatus;
  title: string;
  description?: string;
  totalAmount: number;
  currency: string;
  submittedAt?: string;
  approvedAt?: string;
  reimbursedAt?: string;
  rejectionReason?: string;
  tour: { id: string; name: string; tourDate: string };
  submittedBy: { id: string; fullName: string };
  approvedBy?: { id: string; fullName: string };
  lines: ExpenseReportLine[];
  createdAt: string;
  updatedAt?: string;
}

export interface ExpenseReportListItem {
  id: string;
  reportNumber: string;
  status: ExpenseReportStatus;
  title: string;
  totalAmount: number;
  currency: string;
  tourName: string;
  tourId: string;
  submittedByName: string;
  submittedAt?: string;
  createdAt: string;
  lineCount: number;
}

export interface ExpenseReportLine {
  id?: string;
  category: string;
  description: string;
  amount: number;
  expenseDate: string;
  receiptUrl?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  sortOrder?: number;
}

export interface CreateExpenseReportRequest {
  tourId: string;
  title: string;
  description?: string;
  currency?: string;
  lines?: ExpenseReportLine[];
}

export interface UpdateExpenseReportRequest {
  title?: string;
  description?: string;
  currency?: string;
  lines?: ExpenseReportLine[];
}

export const EXPENSE_CATEGORIES = [
  { value: 'fuel', label: 'Carburant' },
  { value: 'meals', label: 'Repas' },
  { value: 'accommodation', label: 'Hébergement' },
  { value: 'transport', label: 'Transport' },
  { value: 'toll', label: 'Péage' },
  { value: 'parking', label: 'Parking' },
  { value: 'other', label: 'Autre' },
];

export const EXPENSE_REPORT_STATUSES: Record<ExpenseReportStatus, { label: string; color: string }> = {
  DRAFT: { label: 'Brouillon', color: 'default' },
  SUBMITTED: { label: 'Soumise', color: 'processing' },
  APPROVED: { label: 'Approuvée', color: 'success' },
  REJECTED: { label: 'Rejetée', color: 'error' },
  REIMBURSED: { label: 'Remboursée', color: 'cyan' },
};
