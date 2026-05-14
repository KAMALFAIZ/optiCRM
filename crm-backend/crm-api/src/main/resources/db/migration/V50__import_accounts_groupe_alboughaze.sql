-- ═══════════════════════════════════════════════════════════════════════════
-- V50 : Import des comptes depuis GROUPE_ALBOUGHAZE (même serveur kasoft)
-- Source : GROUPE_ALBOUGHAZE.dbo.Chiffre_Affaires_Groupe + Clients
-- Cible  : opticrm.dbo.accounts
-- Logique : MERGE sur sage_code (insert si nouveau, update si existant)
-- ═══════════════════════════════════════════════════════════════════════════

SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;

DECLARE @imported   INT = 0;
DECLARE @updated    INT = 0;
DECLARE @skipped    INT = 0;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Table temporaire avec les données sources dédupliquées
-- ─────────────────────────────────────────────────────────────────────────────
IF OBJECT_ID('tempdb..#src_accounts') IS NOT NULL DROP TABLE #src_accounts;

SELECT DISTINCT
    LTRIM(RTRIM(ca.[Code client]))                                           AS sage_code,
    LTRIM(RTRIM(ca.[Intitulé client]))                                       AS name,
    LTRIM(RTRIM(ca.[Catégorie_]))                                            AS categorie_client,
    LTRIM(RTRIM(ca.[Représentant]))                                          AS representant,
    LTRIM(RTRIM(ca.[Région]))                                                AS billing_state,
    LTRIM(RTRIM(c.[Adresse]))                                                AS billing_street,
    LTRIM(RTRIM(c.[Ville]))                                                  AS billing_city,
    LTRIM(RTRIM(c.[Code postal]))                                            AS billing_postal_code,
    LTRIM(RTRIM(c.[RC_]))                                                    AS rc,
    LTRIM(RTRIM(c.[Identifiant fiscal_]))                                    AS identifiant_fiscal,
    LTRIM(RTRIM(
        REPLACE(REPLACE(c.[ICE_], 'ICE / ', ''), 'ICE', '')
    ))                                                                        AS ice
INTO #src_accounts
FROM GROUPE_ALBOUGHAZE.dbo.chiffre_Affaires_Groupe  ca
INNER JOIN GROUPE_ALBOUGHAZE.dbo.Clients            c
       ON  ca.[DB_Id]       = c.[DB_Id]
       AND ca.[Code client] = c.[Code client]
WHERE LTRIM(RTRIM(ca.[Code client])) IS NOT NULL
  AND LTRIM(RTRIM(ca.[Code client])) <> ''
  AND LTRIM(RTRIM(ca.[Intitulé client])) IS NOT NULL
  AND LTRIM(RTRIM(ca.[Intitulé client])) <> '';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. MERGE dans opticrm.dbo.accounts
-- ─────────────────────────────────────────────────────────────────────────────
MERGE INTO opticrm.dbo.accounts AS tgt
USING (
    -- Garder une seule ligne par sage_code (en cas de doublons résiduels)
    SELECT
        sage_code,
        name,
        categorie_client,
        representant,
        billing_state,
        billing_street,
        billing_city,
        billing_postal_code,
        rc,
        identifiant_fiscal,
        ice,
        ROW_NUMBER() OVER (PARTITION BY sage_code ORDER BY name) AS rn
    FROM #src_accounts
) AS src
ON src.sage_code = tgt.sage_code
AND src.rn = 1

-- ── Mise à jour des comptes existants ────────────────────────────────────────
WHEN MATCHED THEN
    UPDATE SET
        tgt.name               = src.name,
        tgt.categorie_client   = src.categorie_client,
        tgt.representant       = src.representant,
        tgt.billing_state      = src.billing_state,
        tgt.billing_street     = src.billing_street,
        tgt.billing_city       = src.billing_city,
        tgt.billing_postal_code= src.billing_postal_code,
        tgt.billing_country    = COALESCE(tgt.billing_country, N'Maroc'),
        tgt.rc                 = NULLIF(src.rc, ''),
        tgt.identifiant_fiscal = NULLIF(src.identifiant_fiscal, ''),
        tgt.ice                = NULLIF(src.ice, ''),
        tgt.sage_synced_at     = GETUTCDATE(),
        tgt.updated_at         = GETUTCDATE()

-- ── Insertion des nouveaux comptes ───────────────────────────────────────────
WHEN NOT MATCHED BY TARGET AND src.rn = 1 THEN
    INSERT (
        id,
        name,
        account_type,
        sage_code,
        categorie_client,
        representant,
        billing_street,
        billing_city,
        billing_postal_code,
        billing_state,
        billing_country,
        rc,
        identifiant_fiscal,
        ice,
        sage_synced_at,
        created_at,
        updated_at
    )
    VALUES (
        NEWID(),
        src.name,
        N'CLIENT',
        src.sage_code,
        NULLIF(src.categorie_client, ''),
        NULLIF(src.representant, ''),
        NULLIF(src.billing_street, ''),
        NULLIF(src.billing_city, ''),
        NULLIF(src.billing_postal_code, ''),
        NULLIF(src.billing_state, ''),
        N'Maroc',
        NULLIF(src.rc, ''),
        NULLIF(src.identifiant_fiscal, ''),
        NULLIF(src.ice, ''),
        GETUTCDATE(),
        GETUTCDATE(),
        GETUTCDATE()
    );

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Résumé
-- ─────────────────────────────────────────────────────────────────────────────
SELECT
    (SELECT COUNT(*) FROM #src_accounts)                                   AS [Source (total clients)],
    (SELECT COUNT(*) FROM opticrm.dbo.accounts WHERE account_type = N'CLIENT'
     AND sage_code IN (SELECT sage_code FROM #src_accounts))               AS [Dans OptiCRM après import],
    (SELECT COUNT(DISTINCT sage_code) FROM #src_accounts)                  AS [Codes clients uniques];

DROP TABLE #src_accounts;
GO
