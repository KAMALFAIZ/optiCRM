export const COLORS = {
  primary: '#1976D2',
  secondary: '#FF9800',
  success: '#4CAF50',
  error: '#F44336',
  warning: '#FFC107',
  info: '#00BCD4',
  grey: '#607D8B',
};

export const STATUS_COLORS: Record<string, string> = {
  planned: '#2196F3',
  in_progress: '#FF9800',
  completed: '#4CAF50',
  cancelled: '#F44336',
  new: '#2196F3',
  contacted: '#00BCD4',
  qualified: '#4CAF50',
  unqualified: '#F44336',
  nurturing: '#9C27B0',
  converted: '#FFC107',
  Actif: '#4CAF50',
  Inactif: '#607D8B',
  'Archivé': '#F44336',
  Prospect: '#2196F3',
  Client: '#4CAF50',
  Partenaire: '#9C27B0',
  Fournisseur: '#FF9800',
};

export function getStatusColor(status: string | undefined): string {
  if (!status) return '#607D8B';
  return STATUS_COLORS[status] || '#607D8B';
}
