SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- V24: Catégories tarifaires et prix par produit

-- 1. Table des catégories tarifaires
IF OBJECT_ID('pricing_categories', 'U') IS NULL
BEGIN
CREATE TABLE pricing_categories (
    id           UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    code         NVARCHAR(50)  NOT NULL UNIQUE,
    name         NVARCHAR(100) NOT NULL,
    description  NVARCHAR(500),
    is_default   BIT           NOT NULL DEFAULT 0,
    is_active    BIT           NOT NULL DEFAULT 1,
    sort_order   INT           NOT NULL DEFAULT 0,
    created_at   DATETIMEOFFSET NOT NULL DEFAULT GETUTCDATE(),
    updated_at   DATETIMEOFFSET
)
END;

-- Catégorie par défaut
IF NOT EXISTS (SELECT 1 FROM pricing_categories WHERE code = 'STANDARD')
    INSERT INTO pricing_categories (code, name, is_default, sort_order)
    VALUES ('STANDARD', 'Tarif Standard', 1, 0);

-- 2. Matrice prix produit × catégorie tarifaire
IF OBJECT_ID('product_prices', 'U') IS NULL
BEGIN
CREATE TABLE product_prices (
    id                  UNIQUEIDENTIFIER  PRIMARY KEY DEFAULT NEWID(),
    product_id          UNIQUEIDENTIFIER  NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    pricing_category_id UNIQUEIDENTIFIER  NOT NULL REFERENCES pricing_categories(id),
    unit_price          DECIMAL(15,2) NOT NULL,
    currency            NVARCHAR(3)    NOT NULL DEFAULT 'MAD',
    created_at          DATETIMEOFFSET   NOT NULL DEFAULT GETUTCDATE(),
    UNIQUE (product_id, pricing_category_id)
)
END;

-- 3. Catégorie tarifaire sur les comptes clients
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('accounts') AND name = 'pricing_category_id')
    ALTER TABLE accounts ADD pricing_category_id UNIQUEIDENTIFIER REFERENCES pricing_categories(id);