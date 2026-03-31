SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- Migration V30: Champs ODYSSÉE Distribution sur la table accounts
-- Famille Distribution : typeCompteOdyssee, prefecture, rolePrincipal, statutCompte, potentiel, suivi commercial

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('accounts') AND name = 'famille')
    ALTER TABLE accounts ADD famille              NVARCHAR(50);
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('accounts') AND name = 'type_compte_odyssee')
    ALTER TABLE accounts ADD type_compte_odyssee  NVARCHAR(50);
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('accounts') AND name = 'prefecture')
    ALTER TABLE accounts ADD prefecture           NVARCHAR(100);
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('accounts') AND name = 'role_principal')
    ALTER TABLE accounts ADD role_principal        NVARCHAR(30);
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('accounts') AND name = 'statut_compte')
    ALTER TABLE accounts ADD statut_compte         NVARCHAR(30);
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('accounts') AND name = 'potentiel')
    ALTER TABLE accounts ADD potentiel             NVARCHAR(20);
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('accounts') AND name = 'action_suivante')
    ALTER TABLE accounts ADD action_suivante       NVARCHAR(500);
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('accounts') AND name = 'date_prochaine_action')
    ALTER TABLE accounts ADD date_prochaine_action DATE;

-- Index pour filtrage fréquent par les commerciaux
IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_accounts_famille' AND object_id = OBJECT_ID('accounts'))
    CREATE INDEX idx_accounts_famille              ON accounts(famille);
IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_accounts_type_compte_odyssee' AND object_id = OBJECT_ID('accounts'))
    CREATE INDEX idx_accounts_type_compte_odyssee  ON accounts(type_compte_odyssee);
IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_accounts_statut_compte' AND object_id = OBJECT_ID('accounts'))
    CREATE INDEX idx_accounts_statut_compte        ON accounts(statut_compte);
IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_accounts_potentiel' AND object_id = OBJECT_ID('accounts'))
    CREATE INDEX idx_accounts_potentiel            ON accounts(potentiel);
IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_accounts_prefecture' AND object_id = OBJECT_ID('accounts'))
    CREATE INDEX idx_accounts_prefecture           ON accounts(prefecture);