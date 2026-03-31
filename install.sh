#!/bin/bash
# =====================================================
# OptiCRM On-Premise — Script d'installation (Linux/Mac)
# Usage : chmod +x install.sh && ./install.sh
# =====================================================
set -e

COMPOSE_FILE="docker-compose.onpremise.yml"
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}  OptiCRM On-Premise — Installation   ${NC}"
echo -e "${GREEN}======================================${NC}"
echo ""

# 1. Vérifier Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}[ERREUR] Docker n'est pas installé.${NC}"
    echo "Installez Docker Desktop depuis https://www.docker.com/products/docker-desktop"
    exit 1
fi

DOCKER_VERSION=$(docker --version | grep -oP '[\d]+\.[\d]+')
echo -e "${GREEN}[OK]${NC} Docker détecté : $(docker --version)"

# 2. Vérifier Docker Compose
if ! docker compose version &> /dev/null; then
    echo -e "${RED}[ERREUR] Docker Compose (v2) n'est pas disponible.${NC}"
    exit 1
fi
echo -e "${GREEN}[OK]${NC} Docker Compose : $(docker compose version)"

# 3. Configurer le fichier .env
if [ ! -f ".env" ]; then
    echo ""
    echo -e "${YELLOW}[INFO]${NC} Fichier .env introuvable. Création depuis le modèle..."
    cp .env.onpremise.example .env

    # Générer automatiquement JWT_SECRET
    if command -v openssl &> /dev/null; then
        JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
        sed -i "s|CHANGEZ_CETTE_CLE_JWT_SUPER_SECRETE_MINIMUM_64_CARACTERES_ALEATOIRES|$JWT_SECRET|g" .env
        echo -e "${GREEN}[OK]${NC} JWT_SECRET généré automatiquement"
    fi

    echo ""
    echo -e "${YELLOW}[IMPORTANT]${NC} Veuillez configurer votre fichier .env :"
    echo "  - DB_SA_PASSWORD   : mot de passe SQL Server (requis)"
    echo "  - REDIS_PASSWORD   : mot de passe Redis (requis)"
    echo "  - LICENSE_KEY      : clé de licence (optionnel — mode communautaire sans clé)"
    echo ""
    read -p "Appuyez sur Entrée après avoir configuré .env pour continuer..."
fi

echo ""
echo -e "${GREEN}[INFO]${NC} Démarrage des services OptiCRM..."
docker compose -f "$COMPOSE_FILE" pull
docker compose -f "$COMPOSE_FILE" up -d

# 4. Attendre que l'API soit prête
echo ""
echo -e "${YELLOW}[INFO]${NC} Attente du démarrage de l'API (peut prendre 2-3 minutes)..."
MAX_RETRIES=30
COUNT=0
while [ $COUNT -lt $MAX_RETRIES ]; do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:${HTTP_PORT:-80}/actuator/health 2>/dev/null || echo "000")
    if [ "$STATUS" = "200" ]; then
        break
    fi
    COUNT=$((COUNT + 1))
    echo -n "."
    sleep 10
done
echo ""

if [ $COUNT -eq $MAX_RETRIES ]; then
    echo -e "${YELLOW}[AVERTISSEMENT]${NC} L'API n'a pas répondu dans les délais. Vérifiez les logs :"
    echo "  docker compose -f $COMPOSE_FILE logs api"
else
    echo -e "${GREEN}[OK]${NC} OptiCRM est démarré !"
fi

echo ""
echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}  OptiCRM est accessible sur :         ${NC}"
echo -e "${GREEN}  http://localhost:${HTTP_PORT:-80}          ${NC}"
echo -e "${GREEN}======================================${NC}"
echo ""
echo "Commandes utiles :"
echo "  Arrêter    : docker compose -f $COMPOSE_FILE down"
echo "  Logs       : docker compose -f $COMPOSE_FILE logs -f"
echo "  Mise à jour: OPTICRM_VERSION=x.y.z ./install.sh"
echo ""
