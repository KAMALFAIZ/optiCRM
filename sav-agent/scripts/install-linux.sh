#!/bin/bash
# =============================================================================
#  SAV Agent - Installation Linux (systemd)
# =============================================================================
#  Prérequis : Java 21+, sudo
#  Usage     : sudo ./install-linux.sh <NOM_AGENT> <CLE_API> [URL_CRM]
# =============================================================================

set -e

AGENT_NAME="${1}"
API_KEY="${2}"
CENTRAL_URL="${3:-wss://crm.example.com/ws/agent}"
INSTALL_DIR="/opt/opticrm/sav-agent"
SERVICE_NAME="sav-agent"
SERVICE_USER="opticrm"

if [ -z "$AGENT_NAME" ] || [ -z "$API_KEY" ]; then
    echo ""
    echo "Usage: sudo $0 <NOM_AGENT> <CLE_API> [URL_CRM]"
    echo ""
    echo "Exemple:"
    echo "  sudo $0 \"SAV-Agent-01\" \"votre_cle_api\" \"wss://crm.example.com/ws/agent\""
    echo ""
    exit 1
fi

echo ""
echo "============================================"
echo "  Installation SAV Agent"
echo "============================================"
echo "  Nom         : $AGENT_NAME"
echo "  URL CRM     : $CENTRAL_URL"
echo "  Répertoire  : $INSTALL_DIR"
echo "============================================"
echo ""

# Créer l'utilisateur système
if ! id "$SERVICE_USER" &>/dev/null; then
    echo "Création de l'utilisateur $SERVICE_USER..."
    useradd -r -s /bin/false -d "$INSTALL_DIR" "$SERVICE_USER"
fi

# Créer les répertoires
mkdir -p "$INSTALL_DIR"/{config,logs,exports,imports}

# Copier le JAR
cp -f sav-agent.jar "$INSTALL_DIR/sav-agent.jar"
chmod +x "$INSTALL_DIR/sav-agent.jar"

# Générer la configuration
cat > "$INSTALL_DIR/config/application.yml" << EOF
# SAV Agent - Configuration
sav-agent:
  central-url: $CENTRAL_URL
  api-key: $API_KEY
  agent-name: $AGENT_NAME

  local-database:
    enabled: false
    # url: jdbc:postgresql://localhost:5432/erp_local
    # username: readonly_user
    # password: votre_mot_de_passe

  local-http:
    enabled: true
    base-url: http://localhost:8090

  shell:
    enabled: false

  security:
    strict-mode: true
    allowed-sql-patterns:
      - "^SELECT .+ FROM stock .+"
      - "^SELECT .+ FROM articles .+"
    allowed-http-prefixes:
      - "http://localhost:8090/api/"
    allowed-file-paths:
      - "$INSTALL_DIR/exports"
      - "$INSTALL_DIR/imports"

management:
  server:
    port: 9091

logging:
  file:
    name: $INSTALL_DIR/logs/sav-agent.log
EOF

# Permissions
chown -R "$SERVICE_USER:$SERVICE_USER" "$INSTALL_DIR"

# Créer le fichier systemd
cat > /etc/systemd/system/${SERVICE_NAME}.service << EOF
[Unit]
Description=OptiCRM SAV Agent - $AGENT_NAME
Documentation=https://opticrm.com/docs/agent
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=$SERVICE_USER
Group=$SERVICE_USER
WorkingDirectory=$INSTALL_DIR

ExecStart=/usr/bin/java \\
    -Xms128m -Xmx512m \\
    -Dspring.config.additional-location=file:$INSTALL_DIR/config/application.yml \\
    -jar $INSTALL_DIR/sav-agent.jar

# Redémarrage automatique
Restart=always
RestartSec=10
StartLimitInterval=60
StartLimitBurst=5

# Sécurité
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$INSTALL_DIR
PrivateTmp=true

# Logs
StandardOutput=journal
StandardError=journal
SyslogIdentifier=$SERVICE_NAME

[Install]
WantedBy=multi-user.target
EOF

# Activer et démarrer le service
systemctl daemon-reload
systemctl enable "$SERVICE_NAME"
systemctl start "$SERVICE_NAME"

echo ""
echo "============================================"
echo "  Installation terminée !"
echo "============================================"
echo "  Service     : $SERVICE_NAME"
echo "  Config      : $INSTALL_DIR/config/application.yml"
echo "  Logs        : $INSTALL_DIR/logs/sav-agent.log"
echo "  Health      : http://localhost:9091/actuator/health"
echo ""
echo "  Commandes utiles :"
echo "    systemctl status $SERVICE_NAME"
echo "    systemctl stop $SERVICE_NAME"
echo "    systemctl restart $SERVICE_NAME"
echo "    journalctl -u $SERVICE_NAME -f"
echo "============================================"
