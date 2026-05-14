import { message } from 'antd';

/** Notification toast pour une mutation sauvegardée en mode offline */
export function showOfflineQueued(): void {
  message.info('Sauvegardé localement — sera synchronisé au retour de la connexion.');
}

/** Notification toast après synchronisation réussie */
export function showSyncSuccess(count: number): void {
  message.success(`${count} modification${count > 1 ? 's' : ''} synchronisée${count > 1 ? 's' : ''} avec succès.`);
}

/** Notification toast quand un conflit de version est détecté */
export function showConflictDetected(): void {
  message.warning('Conflit détecté — résolution manuelle requise.');
}

/** Notification toast pour une erreur de synchronisation */
export function showSyncError(count: number): void {
  message.error(`${count} modification${count > 1 ? 's' : ''} en erreur lors de la synchronisation.`);
}
