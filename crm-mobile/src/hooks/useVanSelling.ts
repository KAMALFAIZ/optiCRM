import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { vehiculesApi, chargementsApi, bonsLivraisonApi, retoursApi } from '../api/vanSelling';
import type { CreateBonLivraisonRequest, CreateRetourRequest, StatutBonLivraison } from '../types/vanSelling';

const enabled = () => {
  const { isHydrated, accessToken } = useAuthStore.getState();
  return isHydrated && !!accessToken;
};

// ─── Véhicule du collaborateur connecté ───────────────────────────────────────

export function useMonVehicule() {
  const { user, isHydrated, accessToken } = useAuthStore();
  return useQuery({
    queryKey: ['mon-vehicule', user?.id],
    queryFn: () => vehiculesApi.getByCollaborateur(user!.id),
    enabled: isHydrated && !!accessToken && !!user?.id,
    staleTime: 5 * 60 * 1000,
  });
}

// ─── Stock voiture ────────────────────────────────────────────────────────────

export function useStockVoiture(vehiculeId: string | undefined) {
  const { isHydrated, accessToken } = useAuthStore();
  return useQuery({
    queryKey: ['stock-voiture', vehiculeId],
    queryFn: () => vehiculesApi.getStock(vehiculeId!),
    enabled: isHydrated && !!accessToken && !!vehiculeId,
    staleTime: 60 * 1000, // 1 min — stock change fréquemment
  });
}

export function useStockDisponible(vehiculeId: string | undefined) {
  const { isHydrated, accessToken } = useAuthStore();
  return useQuery({
    queryKey: ['stock-disponible', vehiculeId],
    queryFn: () => vehiculesApi.getStockDisponible(vehiculeId!),
    enabled: isHydrated && !!accessToken && !!vehiculeId,
    staleTime: 60 * 1000,
  });
}

// ─── Chargements ──────────────────────────────────────────────────────────────

export function useChargements(vehiculeId: string | undefined) {
  const { isHydrated, accessToken } = useAuthStore();
  return useQuery({
    queryKey: ['chargements', vehiculeId],
    queryFn: () => chargementsApi.list(vehiculeId!),
    enabled: isHydrated && !!accessToken && !!vehiculeId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useChargement(id: string) {
  const { isHydrated, accessToken } = useAuthStore();
  return useQuery({
    queryKey: ['chargement', id],
    queryFn: () => chargementsApi.getById(id),
    enabled: isHydrated && !!accessToken && !!id,
  });
}

// ─── Bons de livraison ────────────────────────────────────────────────────────

export function useBonsLivraison(params: {
  vehiculeId?: string;
  collaborateurId?: string;
  statut?: StatutBonLivraison;
}) {
  const { isHydrated, accessToken } = useAuthStore();
  return useQuery({
    queryKey: ['bons-livraison', params],
    queryFn: () => bonsLivraisonApi.list(params),
    enabled: isHydrated && !!accessToken,
    staleTime: 60 * 1000,
  });
}

export function useBonLivraison(id: string) {
  const { isHydrated, accessToken } = useAuthStore();
  return useQuery({
    queryKey: ['bon-livraison', id],
    queryFn: () => bonsLivraisonApi.getById(id),
    enabled: isHydrated && !!accessToken && !!id,
  });
}

export function useCreateBonLivraison() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBonLivraisonRequest) => bonsLivraisonApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bons-livraison'] });
      qc.invalidateQueries({ queryKey: ['stock-voiture'] });
      qc.invalidateQueries({ queryKey: ['stock-disponible'] });
    },
  });
}

export function useValiderBL() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => bonsLivraisonApi.valider(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ['bons-livraison'] });
      qc.invalidateQueries({ queryKey: ['bon-livraison', id] });
      qc.invalidateQueries({ queryKey: ['stock-disponible'] });
    },
  });
}

export function useLivrerBL() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => bonsLivraisonApi.livrer(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ['bons-livraison'] });
      qc.invalidateQueries({ queryKey: ['bon-livraison', id] });
    },
  });
}

export function useAnnulerBL() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => bonsLivraisonApi.annuler(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ['bons-livraison'] });
      qc.invalidateQueries({ queryKey: ['bon-livraison', id] });
      qc.invalidateQueries({ queryKey: ['stock-disponible'] });
    },
  });
}

export function useEnregistrerSignature() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, signatureUrl }: { id: string; signatureUrl: string }) =>
      bonsLivraisonApi.enregistrerSignature(id, signatureUrl),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ['bon-livraison', id] });
    },
  });
}

// ─── Retours ──────────────────────────────────────────────────────────────────

export function useCreateRetour() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRetourRequest) => retoursApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stock-voiture'] });
      qc.invalidateQueries({ queryKey: ['stock-disponible'] });
    },
  });
}
