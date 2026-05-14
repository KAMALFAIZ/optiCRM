#!/bin/bash
# =============================================================================
#  SAV Agent - Désinstallation Linux
# =============================================================================

set -e

SERVICE_NAME="sav-agent"
INSTALL_DIR="/opt/opticrm/sav-agent"

echo "Arrêt du service..."
systemctl stop "$SERVICE_NAME" 2>/dev/null || true
systemctl disable "$SERVICE_NAME" 2>/dev/null || true

echo "Suppression du fichier systemd..."
rm -f "/etc/systemd/system/${SERVICE_NAME}.service"
systemctl daemon-reload

echo ""
echo "Service désinstallé."
echo "Les fichiers dans $INSTALL_DIR n'ont PAS été supprimés."
echo "Pour tout supprimer : rm -rf $INSTALL_DIR"
