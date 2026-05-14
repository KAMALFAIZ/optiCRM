/**
 * useGpsTracking — géolocalisation continue avec envoi périodique au backend.
 * Utilisé par le représentant pendant sa tournée.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import apiClient from '@/api/client';

export interface GpsPoint {
  latitude:  number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
}

interface TrackingOptions {
  representativeId?: string;
  deliveryTourId?: string;
  intervalMs?: number;    // intervalle d'envoi (défaut 60s)
  enabled?: boolean;
}

export function useGpsTracking(opts: TrackingOptions = {}) {
  const { representativeId, deliveryTourId, intervalMs = 60_000, enabled = false } = opts;

  const [position, setPosition]   = useState<GpsPoint | null>(null);
  const [error, setError]         = useState<string | null>(null);
  const [tracking, setTracking]   = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const watchRef    = useRef<number | null>(null);

  const sendPosition = useCallback(async (pos: GpsPoint, eventType = 'TRACK') => {
    if (!representativeId) return;
    try {
      await apiClient.post('/delivery/gps/track', {
        representativeId,
        deliveryTourId,
        latitude:  pos.latitude,
        longitude: pos.longitude,
        accuracy:  pos.accuracy,
        eventType,
      });
    } catch { /* silently ignore — offline fallback handled by SW */ }
  }, [representativeId, deliveryTourId]);

  const start = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setError('Géolocalisation non disponible sur cet appareil');
      return;
    }
    setTracking(true);
    setError(null);

    // Watch position en continu
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const pt: GpsPoint = {
          latitude:  pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy:  pos.coords.accuracy,
          timestamp: pos.timestamp,
        };
        setPosition(pt);
      },
      (err) => setError(err.message),
      { enableHighAccuracy: true, maximumAge: 30_000 }
    );

    // Envoi périodique
    intervalRef.current = setInterval(async () => {
      if (position) await sendPosition(position);
    }, intervalMs);
  }, [position, sendPosition, intervalMs]);

  const stop = useCallback(async () => {
    setTracking(false);
    if (watchRef.current != null) {
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    }
    if (intervalRef.current != null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (position) await sendPosition(position, 'TOUR_END');
  }, [position, sendPosition]);

  const sendEvent = useCallback(async (eventType: string, customerId?: string) => {
    if (!position) return;
    try {
      await apiClient.post('/delivery/gps/track', {
        representativeId,
        deliveryTourId,
        latitude:  position.latitude,
        longitude: position.longitude,
        accuracy:  position.accuracy,
        eventType,
        customerId,
      });
    } catch { /* ignore */ }
  }, [position, representativeId, deliveryTourId]);

  useEffect(() => {
    if (enabled) start();
    return () => { if (tracking) stop(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return { position, error, tracking, start, stop, sendEvent };
}
