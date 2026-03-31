import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

export function formatCurrency(amount: number | undefined | null): string {
  if (amount == null) return '—';
  return new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency: 'MAD',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string | undefined | null): string {
  if (!date) return '—';
  try { return format(parseISO(date), 'dd/MM/yyyy', { locale: fr }); }
  catch { return date; }
}

export function formatDateTime(date: string | undefined | null): string {
  if (!date) return '—';
  try { return format(parseISO(date), 'dd/MM/yyyy HH:mm', { locale: fr }); }
  catch { return date; }
}

export function formatRelativeDate(date: string | undefined | null): string {
  if (!date) return '—';
  try { return formatDistanceToNow(parseISO(date), { addSuffix: true, locale: fr }); }
  catch { return date; }
}

export function formatPhone(phone: string | undefined | null): string {
  if (!phone) return '—';
  return phone;
}

export function formatPercent(value: number | undefined | null): string {
  if (value == null) return '—';
  return `${Math.round(value)}%`;
}

export function formatNumber(value: number | undefined | null): string {
  if (value == null) return '—';
  return new Intl.NumberFormat('fr-MA').format(value);
}
