export interface AgedBalanceRow {
  accountId: string;
  accountName: string;
  commercialId: string | null;
  commercialName: string | null;

  /** Montant non encore échu (due_date >= aujourd'hui) */
  nonEchu: number;

  /** Retard 1 à 30 jours */
  echu1a30: number;

  /** Retard 31 à 60 jours */
  echu31a60: number;

  /** Retard 61 à 90 jours */
  echu61a90: number;

  /** Retard de plus de 90 jours */
  echu91plus: number;

  /** Total dû (somme de toutes les tranches) */
  totalDue: number;

  /** Nombre de factures ouvertes */
  invoiceCount: number;
}
