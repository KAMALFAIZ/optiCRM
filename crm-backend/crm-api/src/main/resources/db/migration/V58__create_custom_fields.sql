-- Définitions des champs libres (informations libres)
CREATE TABLE custom_fields (
    id              UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    field_name      NVARCHAR(100)    NOT NULL,
    field_key       NVARCHAR(100)    NOT NULL,
    field_type      NVARCHAR(20)     NOT NULL,  -- TEXT, NUMBER, DATE, SELECT, BOOLEAN
    field_options   NVARCHAR(MAX)    NULL,       -- JSON array pour les options SELECT
    sort_order      INT              NOT NULL DEFAULT 0,
    required        BIT              NOT NULL DEFAULT 0,
    active          BIT              NOT NULL DEFAULT 1,
    created_at      DATETIME2        NOT NULL DEFAULT GETDATE(),
    updated_at      DATETIME2        NOT NULL DEFAULT GETDATE(),
    CONSTRAINT pk_custom_fields PRIMARY KEY (id),
    CONSTRAINT uq_custom_fields_key UNIQUE (field_key)
);

-- Valeurs des champs libres par compte
CREATE TABLE custom_field_values (
    id              UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    account_id      UNIQUEIDENTIFIER NOT NULL,
    field_id        UNIQUEIDENTIFIER NOT NULL,
    field_value     NVARCHAR(MAX)    NULL,
    created_at      DATETIME2        NOT NULL DEFAULT GETDATE(),
    updated_at      DATETIME2        NOT NULL DEFAULT GETDATE(),
    CONSTRAINT pk_custom_field_values PRIMARY KEY (id),
    CONSTRAINT uq_cfv_account_field UNIQUE (account_id, field_id),
    CONSTRAINT fk_cfv_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
    CONSTRAINT fk_cfv_field FOREIGN KEY (field_id) REFERENCES custom_fields(id) ON DELETE CASCADE
);

CREATE INDEX ix_cfv_account ON custom_field_values (account_id);
CREATE INDEX ix_cfv_field ON custom_field_values (field_id);
