# Documentation — Module CRM | OptiCRM

> **Version :** 1.0
> **Date :** 2026-03-26
> **Projet :** OptiCRM DEV

---

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Architecture technique](#2-architecture-technique)
3. [Navigation & Routes](#3-navigation--routes)
4. [Modules CRM](#4-modules-crm)
   - 4.1 [Contacts](#41-contacts)
   - 4.2 [Comptes (Accounts)](#42-comptes-accounts)
   - 4.3 [Pistes (Leads)](#43-pistes-leads)
   - 4.4 [Opportunités](#44-opportunités)
   - 4.5 [Devis (Quotes)](#45-devis-quotes)
   - 4.6 [Concurrents (Competitors)](#46-concurrents-competitors)
5. [API — Endpoints REST](#5-api--endpoints-rest)
6. [Gestion des permissions](#6-gestion-des-permissions)
7. [State Management (Redux)](#7-state-management-redux)
8. [Fichiers clés par module](#8-fichiers-clés-par-module)

---

## 1. Vue d'ensemble

Le module **CRM** d'OptiCRM est le cœur de la gestion de la relation client. Il regroupe six sous-modules permettant de gérer l'ensemble du cycle de vente :

```
CRM
├── Contacts         — Personnes physiques (prospects, clients, partenaires)
├── Comptes          — Entreprises / organisations
├── Pistes           — Leads entrants à qualifier
├── Opportunités     — Deals en cours dans le pipeline commercial
├── Devis            — Propositions commerciales chiffrées
└── Concurrents      — Veille concurrentielle
```

**Stack technique :**

| Couche | Technologie |
|--------|-------------|
| Frontend Web | React + TypeScript (Vite) |
| Frontend Mobile | React Native |
| Backend | Java Spring Boot (Maven multi-module) |
| State Management | Redux Toolkit |
| Base de données | JPA / Hibernate |
| Authentification | JWT + RBAC (rôles) |

---

## 2. Architecture technique

### Structure du projet

```
D:\OptiCRM_DEV\
├── crm-web/                    # Application web React/TypeScript
│   └── src/
│       ├── features/           # Modules fonctionnels (un dossier par module CRM)
│       ├── api/                # Clients HTTP Axios par ressource
│       ├── routes/             # Définition des routes avec guards de permissions
│       ├── store/              # Redux store (slices par module)
│       ├── types/              # Interfaces TypeScript
│       ├── components/         # Composants UI réutilisables
│       └── layouts/            # Layouts (sidebar, header)
│
├── crm-mobile/                 # Application mobile React Native
│
└── crm-backend/                # Backend Spring Boot (multi-module Maven)
    ├── crm-api/                # Application principale + endpoints REST
    ├── crm-core/               # Logique métier CRM (contacts, comptes, leads…)
    ├── crm-common/             # DTOs et utilitaires partagés
    ├── crm-security/           # Authentification et autorisation (RBAC)
    ├── crm-communication/      # Email, SMS, messagerie
    ├── crm-finance/            # Facturation, paiements
    ├── crm-workflow/           # Automatisations et workflows
    └── crm-reporting/          # Analytics et rapports
```

### Flux de données

```
Utilisateur → React (UI)
           → Redux Slice (state local)
           → API Client Axios (crm-web/src/api/)
           → REST Controller (crm-backend/crm-core/)
           → Service Layer
           → Repository (JPA)
           → Base de données
```

---

## 3. Navigation & Routes

### Fichier de navigation

**Fichier :** `crm-web/src/layouts/MainLayout.tsx`

Le menu CRM est une entrée avec sous-menu déroulant :

```
CRM
├── /contacts         → Contacts
├── /accounts         → Comptes
├── /leads            → Pistes
├── /opportunities    → Opportunités
├── /quotes           → Devis
└── /competitors      → Concurrents
```

### Définition des routes

**Fichier :** `crm-web/src/routes/index.tsx`

| Route | Composant | Description |
|-------|-----------|-------------|
| `/contacts` | `ContactsListPage` | Liste des contacts |
| `/contacts/:id` | `ContactDetailPage` | Détail d'un contact |
| `/accounts` | `AccountsListPage` | Liste des comptes |
| `/accounts/:id` | `AccountDetailPage` | Détail d'un compte |
| `/leads` | `LeadsListPage` | Liste des pistes |
| `/leads/:id` | `LeadDetailPage` | Détail d'une piste |
| `/opportunities` | `OpportunitiesListPage` | Vue liste du pipeline |
| `/quotes` | `QuotesListPage` | Liste des devis |
| `/competitors` | `CompetitorsListPage` | Liste des concurrents |

Toutes les routes sont protégées par un composant `PermissionPage` qui vérifie les droits de l'utilisateur connecté avant le rendu.

---

## 4. Modules CRM

---

### 4.1 Contacts

**Rôle :** Gérer les personnes physiques (prospects, clients, interlocuteurs).

#### Fonctionnalités

- Liste avec recherche, filtres et pagination
- Création / modification via modal
- Vue détail avec historique d'activités
- Champs personnalisables (custom fields)

#### Fichiers Frontend

| Fichier | Rôle |
|---------|------|
| `features/contacts/ContactsListPage.tsx` | Liste avec recherche et filtres |
| `features/contacts/ContactDetailPage.tsx` | Fiche détail + édition |
| `features/contacts/ContactFormModal.tsx` | Formulaire création/modification |
| `features/contacts/contactsSlice.ts` | État Redux |
| `api/contacts.ts` | Client HTTP (CRUD) |
| `types/contact.ts` | Interfaces TypeScript |

#### Fichiers Backend

| Fichier | Rôle |
|---------|------|
| `contact/ContactController.java` | Endpoints REST |
| `contact/ContactService.java` | Logique métier |
| `contact/Contact.java` | Entité JPA |
| `contact/ContactDto.java` | DTO réponse complète |
| `contact/ContactListDto.java` | DTO réponse liste (allégée) |
| `contact/CreateContactRequest.java` | Corps POST |
| `contact/UpdateContactRequest.java` | Corps PUT |

---

### 4.2 Comptes (Accounts)

**Rôle :** Gérer les entreprises et organisations clientes ou prospects.

#### Fonctionnalités

- Liste avec vue carte géolocalisée (`AccountsMap`)
- Indicateur de santé du compte (`HealthScore`)
- Timeline d'activités (`AccountTimeline`)
- Gestion de photos de compte
- Champs personnalisables
- Catégories de tarification et taux de TVA

#### Fichiers Frontend

| Fichier | Rôle |
|---------|------|
| `features/accounts/AccountsListPage.tsx` | Liste + option géolocalisation |
| `features/accounts/AccountDetailPage.tsx` | Fiche détail + timeline |
| `features/accounts/AccountFormModal.tsx` | Formulaire création/modification |
| `features/accounts/AccountTimeline.tsx` | Historique des activités |
| `features/accounts/AccountsMap.tsx` | Carte géographique |
| `features/accounts/HealthScoreWidget.tsx` | Score de santé du compte |
| `features/accounts/accountsSlice.ts` | État Redux |
| `api/accounts.ts` | Client HTTP (CRUD + photos + géoloc) |
| `api/accountTimeline.ts` | Client HTTP timeline |

#### Fichiers Backend

| Fichier | Rôle |
|---------|------|
| `account/AccountController.java` | Endpoints REST |
| `account/AccountService.java` | Logique métier |
| `account/Account.java` | Entité JPA |
| `account/AccountDto.java` | DTO réponse complète |
| `account/AccountListDto.java` | DTO liste |
| `account/AccountPhotoDto.java` | DTO photos |
| `account/HealthScoreDto.java` | DTO score santé |
| `account/HealthScoreService.java` | Calcul du score de santé |
| `account/IndustryService.java` | Données secteur d'activité |
| `account/PricingCategoryService.java` | Gestion des niveaux tarifaires |
| `account/TaxRateController.java` | Configuration TVA |
| `account/CreateAccountRequest.java` | Corps POST |
| `account/UpdateAccountRequest.java` | Corps PUT |

---

### 4.3 Pistes (Leads)

**Rôle :** Gérer les leads entrants et les qualifier avant conversion en opportunité.

#### Fonctionnalités

- Liste avec score de qualification affiché
- Calcul automatique du score (`LeadScore`)
- Conversion d'une piste en opportunité
- Suivi de la source du lead

#### Fichiers Frontend

| Fichier | Rôle |
|---------|------|
| `features/leads/LeadsListPage.tsx` | Liste avec option de conversion |
| `features/leads/LeadDetailPage.tsx` | Fiche détail + score |
| `features/leads/LeadFormModal.tsx` | Formulaire création/modification |
| `features/leads/LeadScoreWidget.tsx` | Affichage du score |
| `features/leads/leadsSlice.ts` | État Redux |
| `api/leads.ts` | Client HTTP (CRUD + conversion) |

#### Fichiers Backend

| Fichier | Rôle |
|---------|------|
| `lead/LeadController.java` | Endpoints REST |
| `lead/LeadService.java` | Logique métier + conversion |
| `lead/Lead.java` | Entité JPA |
| `lead/LeadScoreService.java` | Algorithme de scoring |
| `lead/LeadDto.java` / `LeadListDto.java` | DTOs |
| `lead/ConvertLeadRequest.java` | Corps de la conversion |
| `lead/ConvertLeadResponse.java` | Réponse après conversion |
| `lead/CreateLeadRequest.java` | Corps POST |
| `lead/UpdateLeadRequest.java` | Corps PUT |

#### Processus de conversion

```
Piste (Lead) → [Qualification] → Opportunité
                                  └─ Compte (Account) créé ou lié
                                  └─ Contact associé
```

---

### 4.4 Opportunités

**Rôle :** Suivre les deals commerciaux à travers les étapes du pipeline de vente.

#### Fonctionnalités

- Vue liste tabulaire
- Vue Kanban par étape du pipeline
- Déplacement d'étape (drag & drop)
- Probabilité de closing et montant prévisionnel
- Résumé du pipeline (KPIs)

#### Fichiers Frontend

| Fichier | Rôle |
|---------|------|
| `features/opportunities/OpportunitiesListPage.tsx` | Vue liste |
| `features/opportunities/OpportunitiesKanbanPage.tsx` | Vue Kanban |
| `features/opportunities/OpportunityFormModal.tsx` | Formulaire création/modification |
| `features/opportunities/opportunitiesSlice.ts` | État Redux |
| `api/opportunities.ts` | Client HTTP (CRUD + move stage) |

#### Fichiers Backend

| Fichier | Rôle |
|---------|------|
| `opportunity/OpportunityController.java` | Endpoints REST |
| `opportunity/OpportunityService.java` | Gestion du pipeline |
| `opportunity/Opportunity.java` | Entité JPA |
| `opportunity/OpportunityStage.java` | Entité étape de vente |
| `opportunity/OpportunityDto.java` / `OpportunitiesListDto.java` | DTOs |
| `opportunity/PipelineStageDto.java` | DTO étape pipeline |
| `opportunity/PipelineSummaryDto.java` | DTO résumé pipeline |
| `opportunity/MoveStageRequest.java` | Corps de changement d'étape |
| `opportunity/CreateOpportunityRequest.java` | Corps POST |
| `opportunity/UpdateOpportunityRequest.java` | Corps PUT |

#### Pipeline de vente (étapes)

```
Prospection → Qualification → Proposition → Négociation → Clôture gagnée / perdue
```

---

### 4.5 Devis (Quotes)

**Rôle :** Créer et gérer les propositions commerciales chiffrées.

#### Fonctionnalités

- Liste des devis avec statuts
- Création de devis avec lignes d'articles (`QuoteLineItem`)
- Calcul automatique des totaux (HT, TVA, TTC)
- Lien vers l'opportunité associée

#### Fichiers Frontend

| Fichier | Rôle |
|---------|------|
| `features/quotes/QuotesListPage.tsx` | Liste des devis |
| `features/quotes/QuoteFormModal.tsx` | Formulaire création/modification |
| `features/quotes/quotesSlice.ts` | État Redux |
| `api/quotes.ts` | Client HTTP (CRUD) |

#### Fichiers Backend

| Fichier | Rôle |
|---------|------|
| `quote/QuoteController.java` | Endpoints REST |
| `quote/QuoteService.java` | Génération et gestion des devis |
| `quote/Quote.java` | Entité JPA (entête devis) |
| `quote/QuoteLineItem.java` | Entité ligne d'article |
| `quote/QuoteDto.java` / `QuoteListDto.java` | DTOs |
| `quote/QuoteLineItemDto.java` | DTO ligne article |
| `quote/CreateQuoteRequest.java` | Corps POST |
| `quote/UpdateQuoteRequest.java` | Corps PUT |

---

### 4.6 Concurrents (Competitors)

**Rôle :** Centraliser la veille concurrentielle pour alimenter les échanges commerciaux.

#### Fonctionnalités

- Liste des concurrents recensés
- Création / modification de fiches concurrents
- Association aux opportunités (pour suivi des compétiteurs par deal)

#### Fichiers Frontend

| Fichier | Rôle |
|---------|------|
| `features/competitors/CompetitorsListPage.tsx` | Liste des concurrents |
| `features/competitors/CompetitorFormModal.tsx` | Formulaire création/modification |
| `features/competitors/competitorsSlice.ts` | État Redux |
| `api/competitors.ts` | Client HTTP (CRUD) |

#### Fichiers Backend

| Fichier | Rôle |
|---------|------|
| `competitor/CompetitorController.java` | Endpoints REST |
| `competitor/CompetitorService.java` | Logique métier |
| `competitor/Competitor.java` | Entité JPA |
| `competitor/CompetitorDto.java` | DTO |
| `competitor/CreateCompetitorRequest.java` | Corps POST |
| `competitor/UpdateCompetitorRequest.java` | Corps PUT |

---

## 5. API — Endpoints REST

Tous les endpoints suivent la convention REST et sont préfixés par `/api/v1/`.

### Pattern général

| Méthode | URL | Description |
|---------|-----|-------------|
| `GET` | `/api/v1/{resource}` | Liste paginée avec filtres |
| `GET` | `/api/v1/{resource}/{id}` | Détail d'un enregistrement |
| `POST` | `/api/v1/{resource}` | Création |
| `PUT` | `/api/v1/{resource}/{id}` | Mise à jour |
| `DELETE` | `/api/v1/{resource}/{id}` | Suppression |

### Endpoints spéciaux par module

| Module | Endpoint | Description |
|--------|----------|-------------|
| Comptes | `GET /api/v1/accounts/geolocated` | Comptes avec coordonnées GPS |
| Comptes | `GET /api/v1/accounts/{id}/timeline` | Timeline d'activités |
| Comptes | `POST /api/v1/accounts/{id}/photos` | Upload de photos |
| Pistes | `POST /api/v1/leads/{id}/convert` | Conversion lead → opportunité |
| Opportunités | `PUT /api/v1/opportunities/{id}/stage` | Changement d'étape pipeline |
| Dashboard | `GET /api/v1/dashboard` | KPIs résumés |
| Recherche | `GET /api/v1/search?q=...` | Recherche globale |

---

## 6. Gestion des permissions

### Rôles disponibles

| Rôle | Description |
|------|-------------|
| `SUPER_ADMIN` | Accès total à toutes les fonctionnalités |
| `ADMIN` | Administration du compte, gestion des utilisateurs |
| `MANAGER` | Accès en lecture/écriture sur tous les modules CRM |
| `COMMERCIAL` | Accès limité à son portefeuille (comptes/contacts/opportunités) |
| `READ_ONLY` | Consultation uniquement |

### Implémentation Frontend

Les routes sont enveloppées dans un composant `PermissionPage` qui vérifie le rôle de l'utilisateur avant le rendu :

```tsx
// crm-web/src/routes/index.tsx
<PermissionPage requiredRole="COMMERCIAL">
  <ContactsListPage />
</PermissionPage>
```

### Implémentation Backend

Les controllers utilisent des annotations Spring Security pour contrôler l'accès par rôle :

```java
// Exemple dans AccountController.java
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL')")
@GetMapping("/accounts")
public ResponseEntity<Page<AccountListDto>> listAccounts(...) { ... }
```

---

## 7. State Management (Redux)

Chaque module CRM possède son propre slice Redux géré avec Redux Toolkit.

### Structure d'un slice

```
crm-web/src/store/
├── contactsSlice.ts
├── accountsSlice.ts
├── leadsSlice.ts
├── opportunitiesSlice.ts
├── quotesSlice.ts
└── competitorsSlice.ts
```

### Pattern type d'un slice

```ts
// Exemple : leadsSlice.ts
interface LeadsState {
  items: Lead[];
  selected: Lead | null;
  loading: boolean;
  error: string | null;
  pagination: PaginationMeta;
}
```

Les actions async utilisent `createAsyncThunk` pour appeler les fonctions du client API correspondant.

---

## 8. Fichiers clés par module

Tableau de référence rapide pour naviguer dans le code :

| Module | Frontend principal | Backend controller | Backend service |
|--------|-------------------|-------------------|-----------------|
| **Contacts** | `features/contacts/ContactsListPage.tsx` | `contact/ContactController.java` | `contact/ContactService.java` |
| **Comptes** | `features/accounts/AccountsListPage.tsx` | `account/AccountController.java` | `account/AccountService.java` |
| **Pistes** | `features/leads/LeadsListPage.tsx` | `lead/LeadController.java` | `lead/LeadService.java` |
| **Opportunités** | `features/opportunities/OpportunitiesKanbanPage.tsx` | `opportunity/OpportunityController.java` | `opportunity/OpportunityService.java` |
| **Devis** | `features/quotes/QuotesListPage.tsx` | `quote/QuoteController.java` | `quote/QuoteService.java` |
| **Concurrents** | `features/competitors/CompetitorsListPage.tsx` | `competitor/CompetitorController.java` | `competitor/CompetitorService.java` |
| **Navigation** | `layouts/MainLayout.tsx` | — | — |
| **Routes** | `routes/index.tsx` | — | — |
| **API Client** | `api/` (un fichier par module) | — | — |

---

*Documentation générée le 2026-03-26 — OptiCRM DEV*
