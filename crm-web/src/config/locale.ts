// Configuration locale pour le Maroc

export const LOCALE_CONFIG = {
  // Devise par défaut
  defaultCurrency: 'MAD',

  // Devises disponibles
  currencies: [
    { code: 'MAD', label: 'Dirham marocain', symbol: 'DH' },
    { code: 'EUR', label: 'Euro', symbol: '€' },
    { code: 'USD', label: 'Dollar US', symbol: '$' },
  ],

  // Fuseau horaire
  timezone: 'Africa/Casablanca',

  // Langue par défaut
  defaultLanguage: 'fr',

  // Format de date
  dateFormat: 'DD/MM/YYYY',
  dateTimeFormat: 'DD/MM/YYYY HH:mm',

  // Pays par défaut
  defaultCountry: 'Maroc',
};

// Taux de TVA marocains
export const TVA_RATES = [
  { code: 'TVA20', rate: 20, label: 'TVA 20% (taux normal)', isDefault: true },
  { code: 'TVA14', rate: 14, label: 'TVA 14% (taux intermédiaire)', isDefault: false },
  { code: 'TVA10', rate: 10, label: 'TVA 10% (taux réduit)', isDefault: false },
  { code: 'TVA7', rate: 7, label: 'TVA 7% (taux réduit)', isDefault: false },
  { code: 'EXONERE', rate: 0, label: 'Exonéré de TVA', isDefault: false },
];

// Conditions de paiement marocaines
export const PAYMENT_TERMS = [
  { code: 'COMPTANT', days: 0, label: 'Paiement comptant' },
  { code: 'NET30', days: 30, label: 'Net 30 jours', isDefault: true },
  { code: 'NET60', days: 60, label: 'Net 60 jours' },
  { code: 'NET90', days: 90, label: 'Net 90 jours' },
  { code: 'FIN_MOIS', days: 30, label: 'Fin de mois' },
  { code: 'FIN_MOIS_30', days: 60, label: 'Fin de mois + 30 jours' },
  { code: 'TRAITE_30', days: 30, label: 'Traite 30 jours' },
  { code: 'TRAITE_60', days: 60, label: 'Traite 60 jours' },
  { code: 'TRAITE_90', days: 90, label: 'Traite 90 jours' },
  { code: 'CHEQUE', days: 0, label: 'Chèque à réception' },
];

// Formater un montant en Dirhams
export const formatCurrency = (amount: number | undefined, currency = 'MAD'): string => {
  if (amount === undefined || amount === null) return '-';

  const currencyInfo = LOCALE_CONFIG.currencies.find(c => c.code === currency);
  const symbol = currencyInfo?.symbol || currency;

  return new Intl.NumberFormat('fr-MA', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + ' ' + symbol;
};

// Formater un pourcentage
export const formatPercent = (value: number | undefined): string => {
  if (value === undefined || value === null) return '-';
  return `${value}%`;
};

// Villes principales du Maroc
export const MOROCCAN_CITIES = [
  'Casablanca',
  'Rabat',
  'Marrakech',
  'Fès',
  'Tanger',
  'Agadir',
  'Meknès',
  'Oujda',
  'Kénitra',
  'Tétouan',
  'Salé',
  'Nador',
  'Mohammedia',
  'El Jadida',
  'Béni Mellal',
  'Khouribga',
  'Settat',
  'Safi',
  'Essaouira',
  'Laâyoune',
];

// Régions du Maroc
export const MOROCCAN_REGIONS = [
  'Casablanca-Settat',
  'Rabat-Salé-Kénitra',
  'Tanger-Tétouan-Al Hoceïma',
  'Fès-Meknès',
  'Marrakech-Safi',
  'Souss-Massa',
  'Oriental',
  'Béni Mellal-Khénifra',
  'Drâa-Tafilalet',
  'Laâyoune-Sakia El Hamra',
  'Dakhla-Oued Ed-Dahab',
  'Guelmim-Oued Noun',
];
