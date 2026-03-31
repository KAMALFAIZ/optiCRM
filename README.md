# OptiCRM - Application CRM Autonome

Application CRM complète avec gestion des contacts, comptes, leads, opportunités, devis, stock, finance et bien plus.

## Architecture

```
OptiCRM/
├── crm-backend/          # Backend Spring Boot (Multi-modules Maven)
│   ├── crm-common/       # Utilitaires partagés
│   ├── crm-security/     # Authentification & JWT
│   ├── crm-core/         # CRM (Contacts, Comptes, Leads, Opportunités)
│   ├── crm-stock/        # Gestion des stocks
│   ├── crm-finance/      # Facturation & Paiements
│   ├── crm-communication/# Email & Notifications
│   ├── crm-reporting/    # Rapports & Analytics
│   └── crm-api/          # Point d'entrée API REST
├── crm-web/              # Frontend React + Vite + TypeScript
└── docker-compose.yml    # Configuration Docker
```

## Stack Technique

### Backend
- Java 21 LTS
- Spring Boot 3.2+
- Spring Security + JWT
- Spring Data JPA + PostgreSQL
- Flyway (migrations)
- Redis (cache)

### Frontend
- React 18+
- TypeScript 5+
- Vite 5+
- Redux Toolkit
- Ant Design
- TailwindCSS

## Prérequis

- Java 21+
- Node.js 20+
- Docker & Docker Compose
- Maven 3.9+

## Démarrage rapide

### 1. Démarrer les services (PostgreSQL + Redis)

```bash
docker-compose -f docker-compose.dev.yml up -d
```

### 2. Backend

```bash
cd crm-backend
mvn clean install
mvn spring-boot:run -pl crm-api
```

Le backend démarre sur http://localhost:8080

### 3. Frontend

```bash
cd crm-web
npm install
npm run dev
```

Le frontend démarre sur http://localhost:3000

## Compte par défaut

- Email: `admin@opticrm.com`
- Mot de passe: `Admin123!`

## API Documentation

Swagger UI disponible sur: http://localhost:8080/swagger-ui.html

## Docker (Production)

```bash
docker-compose up -d
```

## Structure des modules

### crm-common
Classes partagées: DTOs, exceptions, utilitaires, validation

### crm-security
- Authentification JWT
- Gestion des utilisateurs, rôles, équipes
- Contrôle d'accès (RBAC)

### crm-core
- Contacts
- Comptes (entreprises)
- Leads (pistes)
- Opportunités
- Devis

### crm-stock
- Produits
- Catégories
- Entrepôts
- Niveaux de stock
- Mouvements

### crm-finance
- Factures
- Paiements
- Balance âgée

### crm-communication
- Templates email
- Envoi d'emails
- Logs

### crm-reporting
- Tableaux de bord
- Rapports personnalisés
- KPIs

## Fonctionnalités principales

- Authentification JWT avec refresh token
- Gestion complète des contacts et comptes
- Pipeline commercial (leads → opportunités → devis)
- Stock en temps réel dans les devis
- Facturation et suivi des paiements
- Balance âgée et situation client
- Gestion des objections commerciales
- Calendrier et activités
- Rapports et analytics

## Configuration

Variables d'environnement principales:

```
DATABASE_URL=jdbc:postgresql://localhost:5432/opticrm
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-secret-key
```

## Tests

```bash
# Backend
cd crm-backend
mvn test

# Frontend
cd crm-web
npm test
```

## Licence

Proprietary - All rights reserved
