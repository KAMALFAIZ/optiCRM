SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- V13: Galerie photos pour les comptes
-- Logo principal du compte
ALTER TABLE accounts ADD logo_url NVARCHAR(500);

-- Table galerie de photos
CREATE TABLE account_photos (
    id          UNIQUEIDENTIFIER                PRIMARY KEY DEFAULT NEWID(),
    account_id  UNIQUEIDENTIFIER                NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    url         NVARCHAR(500)                   NOT NULL,
    caption     NVARCHAR(255),
    display_order INT                           NOT NULL DEFAULT 0,
    uploaded_at DATETIMEOFFSET                  NOT NULL DEFAULT GETUTCDATE()
);

CREATE INDEX idx_account_photos_account_id ON account_photos(account_id);