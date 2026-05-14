export type StatutVehicule = 'ACTIF' | 'MAINTENANCE' | 'INACTIF';
export type StatutChargement = 'EN_COURS' | 'VALIDE' | 'ANNULE';
export type StatutBonLivraison = 'BROUILLON' | 'VALIDE' | 'LIVRE' | 'ANNULE' | 'ERREUR_SAGE' | 'SYNCHRO_SAGE';
export type StatutRetour = 'EN_COURS' | 'VALIDE' | 'ANNULE';
export type MotifRetour = 'INVENDU' | 'ENDOMMAGE' | 'PERIME';

// ─── Véhicule ────────────────────────────────────────────────────────────────

export interface Vehicule {
  id: string;
  immatriculation: string;
  marque?: string;
  modele?: string;
  capaciteMaxKg?: number;
  statut: StatutVehicule;
  notes?: string;
  collaborateurId: string;
  collaborateurNom: string;
  createdAt: string;
  updatedAt?: string;
}

// ─── Stock voiture ────────────────────────────────────────────────────────────

export interface StockVoiture {
  id: string;
  vehiculeId: string;
  vehiculeImmatriculation: string;
  produitId: string;
  produitCode: string;
  produitNom: string;
  qteChargee: number;
  qteVendue: number;
  qteRetournee: number;
  qteDisponible: number;
  updatedAt?: string;
}

// ─── Chargement ───────────────────────────────────────────────────────────────

export interface ChargementLigneItem {
  id: string;
  produitId: string;
  produitCode: string;
  produitNom: string;
  qteDemandee: number;
  qteChargee: number;
  prixUnitaire: number;
  partiel: boolean;
}

export interface Chargement {
  id: string;
  vehiculeId: string;
  vehiculeImmatriculation: string;
  entrepotId: string;
  entrepotNom: string;
  dateChargement: string;
  statut: StatutChargement;
  validePar?: string;
  valideAt?: string;
  notes?: string;
  lignes?: ChargementLigneItem[];
  createdAt: string;
}

// ─── Bon de livraison ─────────────────────────────────────────────────────────

export interface BonLivraisonLigneItem {
  id: string;
  produitId: string;
  produitCode: string;
  produitNom: string;
  quantite: number;
  prixCatalogue: number;
  prixApplique: number;
  remisePct: number;
  tauxTva: number;
  montantHt: number;
  montantTva: number;
  montantTtc: number;
}

export interface BonLivraison {
  id: string;
  numero: string;
  vehiculeId: string;
  vehiculeImmatriculation: string;
  collaborateurId: string;
  collaborateurNom: string;
  clientId: string;
  clientNom: string;
  clientSageCode?: string;
  statut: StatutBonLivraison;
  montantHt: number;
  montantTva: number;
  montantTtc: number;
  latitude?: number;
  longitude?: number;
  signatureCapturee: boolean;
  sageReference?: string;
  sageSyncedAt?: string;
  sageErrorMessage?: string;
  notes?: string;
  lignes?: BonLivraisonLigneItem[];
  createdAt: string;
  updatedAt?: string;
}

export interface CreateBonLivraisonRequest {
  vehiculeId: string;
  clientId: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
  lignes: { produitId: string; quantite: number; prixApplique: number }[];
}

// ─── Retour voiture ───────────────────────────────────────────────────────────

export interface RetourLigneItem {
  id: string;
  produitId: string;
  produitCode: string;
  produitNom: string;
  qteRetournee: number;
  motif: MotifRetour;
}

export interface RetourVoiture {
  id: string;
  vehiculeId: string;
  vehiculeImmatriculation: string;
  entrepotId: string;
  entrepotNom: string;
  dateRetour: string;
  statut: StatutRetour;
  validePar?: string;
  valideAt?: string;
  notes?: string;
  lignes?: RetourLigneItem[];
  createdAt: string;
}

export interface CreateRetourRequest {
  vehiculeId: string;
  entrepotId: string;
  notes?: string;
  lignes: { produitId: string; qteRetournee: number; motif: MotifRetour }[];
}

// ─── Constantes d'affichage ───────────────────────────────────────────────────

export const STATUT_BL_CONFIG: Record<StatutBonLivraison, { label: string; color: string }> = {
  BROUILLON:    { label: 'Brouillon',    color: '#9E9E9E' },
  VALIDE:       { label: 'Validé',       color: '#2196F3' },
  LIVRE:        { label: 'Livré',        color: '#4CAF50' },
  ANNULE:       { label: 'Annulé',       color: '#F44336' },
  ERREUR_SAGE:  { label: 'Erreur Sage',  color: '#FF5722' },
  SYNCHRO_SAGE: { label: 'Sync. Sage',   color: '#009688' },
};

export const MOTIF_RETOUR_LABELS: Record<MotifRetour, string> = {
  INVENDU:   'Invendu',
  ENDOMMAGE: 'Endommagé',
  PERIME:    'Périmé',
};
