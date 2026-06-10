# OptiCRM Sync Agent

Agent local de synchronisation bidirectionnelle entre **Sage 100** (SQL Server) et **OptiCRM** (cloud).
Livré sous deux formes : **EXE Windows** avec interface graphique, ou **service Windows** silencieux.

## Architecture

```
Sage SQL Server (LAN)  ◄──JDBC──  Agent  ──HTTPS──►  OptiCRM (kasoft.selfip.net)
```

- **Pull** : `F_COMPTET`, `F_CONTACTT`, `F_ARTICLE`, `F_ARTSTOCK` → POST `/api/v1/sage/push`
- **Push** : GET `/api/v1/agent/pending-exports` → INSERT `F_DOCENTETE`/`F_DOCLIGNE`/`F_REGLEMT` → POST `/api/v1/agent/export-result`

## Interface graphique (.exe)

Quatre onglets :

| Onglet | Contenu |
|--------|---------|
| **Statut** | Pings live Sage + OptiCRM, dernière sync pull/push, boutons "Lancer maintenant" |
| **OptiCRM** | URL serveur, Tenant ID, clé API ; bouton **Tester** appelle `/api/v1/agent/register` |
| **Sage 100** | Host/port/db/user/password/dossier ; **Tester** ouvre une connexion JDBC |
| **Logs** | Tail temps réel des logs Logback (INFO/WARN/ERROR), filtre + bouton Effacer |

Toutes les modifications sont persistées dans `agent-config.yml` à côté de l'EXE.

## Build de l'EXE

### Prérequis
- JDK 21 (inclut `jpackage`)
- Maven 3.9+
- (Optionnel) WiX Toolset 3.x pour produire un MSI

### Commandes

```cmd
:: app-image (dossier exécutable, pas d'installeur)
build-exe.bat
:: → build\dist\OptiCRMSyncAgent\OptiCRMSyncAgent.exe

:: MSI installeur (avec raccourci menu démarrer)
build-msi.bat
:: → build\dist\OptiCRMSyncAgent-1.0.0.msi
```

L'EXE embarque son propre JRE — **aucune installation Java requise sur la machine cliente**.

## Installation chez le client

1. Copier `OptiCRMSyncAgent\` sur le poste qui voit le SQL Server Sage
2. Double-clic sur `OptiCRMSyncAgent.exe`
3. Onglet **OptiCRM** : coller l'URL serveur et la clé générée depuis OptiCRM → Intégration Sage → Agent local
4. Onglet **Sage 100** : saisir host/port/DB/identifiants, cliquer Tester
5. Enregistrer → l'agent commence à synchroniser automatiquement

## Installation comme service Windows (sans GUI)

Si vous voulez que l'agent démarre automatiquement sans fenêtre :

```cmd
:: Prérequis : NSSM dans le PATH (https://nssm.cc/)
install\install-service.bat
nssm start OptiCRMSyncAgent
```

Le mode service utilise le même `agent-config.yml`. La GUI peut être lancée manuellement pour modifier la config — le service relit le fichier à chaque cycle.

## Documents synchronisés

| Direction | Document OptiCRM   | Sage cible          | Trigger              |
|-----------|--------------------|---------------------|----------------------|
| Pull      | accounts           | F_COMPTET           | cron toutes les 2h   |
| Pull      | contacts           | F_CONTACTT          | cron                 |
| Pull      | products           | F_ARTICLE           | cron                 |
| Pull      | stock_levels       | F_ARTSTOCK          | cron                 |
| Push      | Quote (Devis)      | F_DOCENTETE Type=0  | status = ACCEPTED    |
| Push      | SalesOrder (BC)    | F_DOCENTETE Type=1  | status = CONFIRMED   |
| Push      | DeliveryTour (BL)  | F_DOCENTETE Type=3  | status = CLOSED      |
| Push      | Payment (RG)       | F_REGLEMT           | status = CONFIRMED   |

## Sécurité

- Auth par clé API (`X-Agent-Key`) générée et révocable depuis l'UI OptiCRM
- Toutes les requêtes en HTTPS
- L'agent ne reçoit aucune commande entrante (sortant uniquement)
- Écriture Sage en transaction (rollback complet sur erreur)
- Mots de passe stockés en clair dans `agent-config.yml` — protégez le fichier via les ACL Windows
