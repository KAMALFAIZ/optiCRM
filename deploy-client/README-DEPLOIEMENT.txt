==================================================================
 OptiCRM - Package de deploiement client
==================================================================

CONTENU DU PACKAGE
------------------
  backend\crm-api-1.0.0-SNAPSHOT.jar   Application Spring Boot (fat-jar autonome)
  backend\start-backend.bat            Script de lancement (a editer)
  frontend\dist\                       Frontend React compile (servi par nginx)
  frontend\nginx-opticrm.conf          Bloc nginx a inclure


A INSTALLER SUR LE SERVEUR CLIENT
---------------------------------
  [OBLIGATOIRE] Java 21 (JRE ou JDK)   -> https://adoptium.net  (Temurin 21)
  [OBLIGATOIRE] Microsoft SQL Server   -> l'app utilise SQL SERVER (PAS PostgreSQL)
                                          Express suffit. Creer une base vide (ex: "opticrm").
                                          Le schema est cree AUTOMATIQUEMENT au 1er demarrage
                                          (migrations Flyway embarquees dans le jar).
  [OBLIGATOIRE] nginx                  -> pour servir le frontend + proxy /api

  [PAS BESOIN]  Maven      -> uniquement pour COMPILER. Le jar est deja compile.
  [PAS BESOIN]  PostgreSQL -> l'app tourne sur SQL Server.
  [OPTIONNEL]   Redis      -> seulement pour la synchro Google Calendar.
                             Sans Redis l'app demarre normalement ; seule cette
                             fonctionnalite est indisponible.
                             ATTENTION : sans Redis, /actuator/health renvoie DOWN.
                             Le start-backend.bat passe deja -Dmanagement.health.redis.enabled=false
                             pour neutraliser ce check (health repasse UP).
                             Si le client VEUT Google Calendar : installer Redis (ou Memurai
                             sous Windows) et retirer ce flag.
  [OPTIONNEL]   Cle Anthropic (ANTHROPIC_API_KEY) -> fonctions IA.


ETAPES
------
1) Installer Java 21 et SQL Server. Creer une base vide (ex: opticrm) + un login SQL.

2) Backend :
   - Copier le dossier backend\ sur le serveur (ex: C:\opticrm\backend).
   - Editer start-backend.bat :
       * DATABASE_URL / DATABASE_USERNAME / DATABASE_PASSWORD  -> base du client
       * JWT_SECRET  -> generer une valeur unique (64+ caracteres aleatoires)
       * FRONTEND_BASE_URL  -> URL publique du CRM chez le client
       * FLYWAY_ENABLED=true  -> OBLIGATOIRE au 1er deploiement, sinon les tables
                                 ne sont PAS creees (erreur "Nom d'objet ... non valide").
                                 Peut rester a true ensuite (Flyway ignore les migrations deja appliquees).
   - Lancer start-backend.bat. Au 1er run, Flyway cree toutes les tables.
   - Verifier : http://localhost:8082/actuator/health  -> {"status":"UP"}

3) Frontend :
   - Copier frontend\dist\ sur le serveur (ex: C:\opticrm\frontend\dist).
   - Adapter nginx-opticrm.conf (la ligne "root" = chemin du dist).
   - Inclure ce bloc dans nginx.conf, puis : nginx -s reload
   - Le frontend appelle /api (relatif) -> nginx proxifie vers 8082. Rien d'autre a configurer cote frontend.

4) Exposition publique : tunnel Cloudflare, reverse-proxy ou ouverture de port,
   selon l'infra du client (le bloc nginx ecoute sur 3200 par defaut, a adapter).

5) (Recommande) Installer le backend en service Windows pour qu'il redemarre tout seul,
   via NSSM :  nssm install OptiCRM-Backend "C:\...\java.exe" <les memes args que dans le .bat>
   (definir aussi les variables d'environnement DATABASE_* / JWT_SECRET dans le service).


PARAMETRES A CHANGER OBLIGATOIREMENT PAR CLIENT
-----------------------------------------------
  - DATABASE_URL / USERNAME / PASSWORD   (base du client)
  - JWT_SECRET                           (unique par client)
  - FRONTEND_BASE_URL                    (domaine du client)
  - Mot de passe admin par defaut        (a changer apres 1ere connexion)


NOTES
-----
  - Le driver JDBC SQL Server est deja inclus dans le jar (rien a installer).
  - Port backend par defaut : 8082 (modifiable via -Dserver.port=).
  - Logs backend : sortie console (rediriger vers un fichier si service).
==================================================================
