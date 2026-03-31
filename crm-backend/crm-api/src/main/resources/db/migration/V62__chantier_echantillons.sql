-- Demandes d'échantillons liées aux chantiers
CREATE TABLE chantier_echantillons (
    id               UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    chantier_id      UNIQUEIDENTIFIER NOT NULL,
    notes            NVARCHAR(MAX)    NULL,
    statut           NVARCHAR(30)     NOT NULL DEFAULT 'ENVOYE',
    requested_by_id  UNIQUEIDENTIFIER NULL,
    created_at       DATETIME2        NOT NULL DEFAULT GETDATE(),
    updated_at       DATETIME2        NOT NULL DEFAULT GETDATE(),
    CONSTRAINT pk_chantier_echantillons PRIMARY KEY (id),
    CONSTRAINT fk_echantillon_chantier FOREIGN KEY (chantier_id)
        REFERENCES chantiers(id) ON DELETE CASCADE
);

CREATE INDEX idx_echantillon_chantier ON chantier_echantillons(chantier_id);

-- Lignes produits de la demande
CREATE TABLE chantier_echantillon_lignes (
    id              UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    echantillon_id  UNIQUEIDENTIFIER NOT NULL,
    product_id      UNIQUEIDENTIFIER NULL,
    product_code    NVARCHAR(50)     NOT NULL,
    product_name    NVARCHAR(255)    NOT NULL,
    quantite        INT              NOT NULL DEFAULT 1,
    CONSTRAINT pk_echantillon_lignes PRIMARY KEY (id),
    CONSTRAINT fk_ligne_echantillon FOREIGN KEY (echantillon_id)
        REFERENCES chantier_echantillons(id) ON DELETE CASCADE
);

-- Email ADV pour réception des demandes d'échantillons
IF NOT EXISTS (SELECT 1 FROM app_settings WHERE [key] = 'adv.email')
    INSERT INTO app_settings ([key], value, category) VALUES ('adv.email', '', 'app');
