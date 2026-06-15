USE opticrm_ets_essaidi;
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;

-- notifications
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'notifications')
CREATE TABLE dbo.notifications (
    id uniqueidentifier NOT NULL DEFAULT NEWID(),
    user_id uniqueidentifier NOT NULL,
    type nvarchar(50) NOT NULL,
    title nvarchar(255) NOT NULL,
    message nvarchar(1000) NULL,
    link nvarchar(500) NULL,
    is_read bit NOT NULL DEFAULT 0,
    created_at datetime2 NOT NULL DEFAULT GETDATE(),
    version bigint NOT NULL DEFAULT 0,
    tenant_id uniqueidentifier NOT NULL,
    CONSTRAINT PK_notifications PRIMARY KEY (id)
);

-- chantier_photos
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'chantier_photos')
CREATE TABLE dbo.chantier_photos (
    id uniqueidentifier NOT NULL DEFAULT NEWID(),
    chantier_id uniqueidentifier NOT NULL,
    url nvarchar(500) NOT NULL,
    caption nvarchar(255) NULL,
    created_at datetime2 NOT NULL DEFAULT GETDATE(),
    created_by_id uniqueidentifier NULL,
    tenant_id uniqueidentifier NOT NULL,
    version bigint NOT NULL DEFAULT 0,
    CONSTRAINT PK_chantier_photos PRIMARY KEY (id)
);

-- kb_articles
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'kb_articles')
CREATE TABLE dbo.kb_articles (
    id uniqueidentifier NOT NULL DEFAULT NEWID(),
    title nvarchar(500) NOT NULL,
    content nvarchar(MAX) NULL,
    category nvarchar(100) NULL,
    tags nvarchar(500) NULL,
    is_published bit NOT NULL DEFAULT 0,
    created_at datetime2 NOT NULL DEFAULT GETDATE(),
    updated_at datetime2 NOT NULL DEFAULT GETDATE(),
    created_by_id uniqueidentifier NULL,
    tenant_id uniqueidentifier NOT NULL,
    version bigint NOT NULL DEFAULT 0,
    CONSTRAINT PK_kb_articles PRIMARY KEY (id)
);

-- kb_embeddings
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'kb_embeddings')
CREATE TABLE dbo.kb_embeddings (
    id uniqueidentifier NOT NULL DEFAULT NEWID(),
    article_id uniqueidentifier NOT NULL,
    chunk_index int NOT NULL DEFAULT 0,
    chunk_text nvarchar(MAX) NULL,
    embedding nvarchar(MAX) NULL,
    created_at datetime2 NOT NULL DEFAULT GETDATE(),
    tenant_id uniqueidentifier NOT NULL,
    CONSTRAINT PK_kb_embeddings PRIMARY KEY (id)
);

-- sav_auth_clients
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'sav_auth_clients')
CREATE TABLE dbo.sav_auth_clients (
    id uniqueidentifier NOT NULL DEFAULT NEWID(),
    email nvarchar(255) NOT NULL,
    phone nvarchar(50) NULL,
    nom nvarchar(255) NULL,
    otp_code nvarchar(10) NULL,
    otp_expires_at datetime2 NULL,
    otp_verified bit NOT NULL DEFAULT 0,
    created_at datetime2 NOT NULL DEFAULT GETDATE(),
    updated_at datetime2 NOT NULL DEFAULT GETDATE(),
    tenant_id uniqueidentifier NOT NULL,
    version bigint NOT NULL DEFAULT 0,
    CONSTRAINT PK_sav_auth_clients PRIMARY KEY (id)
);

-- sav_config_sla
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'sav_config_sla')
CREATE TABLE dbo.sav_config_sla (
    id uniqueidentifier NOT NULL DEFAULT NEWID(),
    criticite nvarchar(10) NOT NULL,
    delai_reponse_heures int NOT NULL DEFAULT 24,
    delai_resolution_heures int NOT NULL DEFAULT 72,
    created_at datetime2 NOT NULL DEFAULT GETDATE(),
    updated_at datetime2 NOT NULL DEFAULT GETDATE(),
    tenant_id uniqueidentifier NOT NULL,
    version bigint NOT NULL DEFAULT 0,
    CONSTRAINT PK_sav_config_sla PRIMARY KEY (id)
);

-- sav_escalades
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'sav_escalades')
CREATE TABLE dbo.sav_escalades (
    id uniqueidentifier NOT NULL DEFAULT NEWID(),
    ticket_id uniqueidentifier NOT NULL,
    raison nvarchar(500) NULL,
    escalade_par_id uniqueidentifier NULL,
    escalade_a_id uniqueidentifier NULL,
    created_at datetime2 NOT NULL DEFAULT GETDATE(),
    tenant_id uniqueidentifier NOT NULL,
    version bigint NOT NULL DEFAULT 0,
    CONSTRAINT PK_sav_escalades PRIMARY KEY (id)
);

-- sav_evaluations
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'sav_evaluations')
CREATE TABLE dbo.sav_evaluations (
    id uniqueidentifier NOT NULL DEFAULT NEWID(),
    ticket_id uniqueidentifier NOT NULL,
    note int NULL,
    commentaire nvarchar(1000) NULL,
    created_at datetime2 NOT NULL DEFAULT GETDATE(),
    tenant_id uniqueidentifier NOT NULL,
    version bigint NOT NULL DEFAULT 0,
    CONSTRAINT PK_sav_evaluations PRIMARY KEY (id)
);

-- sav_messages
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'sav_messages')
CREATE TABLE dbo.sav_messages (
    id uniqueidentifier NOT NULL DEFAULT NEWID(),
    ticket_id uniqueidentifier NOT NULL,
    expediteur nvarchar(50) NOT NULL,
    contenu nvarchar(MAX) NULL,
    langue nvarchar(10) NULL,
    date datetime2 NOT NULL DEFAULT GETDATE(),
    tenant_id uniqueidentifier NOT NULL,
    version bigint NOT NULL DEFAULT 0,
    CONSTRAINT PK_sav_messages PRIMARY KEY (id)
);

-- sav_profil_client
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'sav_profil_client')
CREATE TABLE dbo.sav_profil_client (
    id uniqueidentifier NOT NULL DEFAULT NEWID(),
    email nvarchar(255) NOT NULL,
    nom nvarchar(255) NULL,
    phone nvarchar(50) NULL,
    historique nvarchar(MAX) NULL,
    created_at datetime2 NOT NULL DEFAULT GETDATE(),
    updated_at datetime2 NOT NULL DEFAULT GETDATE(),
    tenant_id uniqueidentifier NOT NULL,
    version bigint NOT NULL DEFAULT 0,
    CONSTRAINT PK_sav_profil_client PRIMARY KEY (id)
);

-- sav_tickets
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'sav_tickets')
CREATE TABLE dbo.sav_tickets (
    id uniqueidentifier NOT NULL DEFAULT NEWID(),
    numero nvarchar(50) NULL,
    email_client nvarchar(255) NOT NULL,
    nom_client nvarchar(255) NULL,
    phone_client nvarchar(50) NULL,
    domaine nvarchar(100) NULL,
    description nvarchar(MAX) NULL,
    statut nvarchar(50) NOT NULL DEFAULT 'OUVERT',
    criticite nvarchar(10) NULL,
    agent_id uniqueidentifier NULL,
    created_at datetime2 NOT NULL DEFAULT GETDATE(),
    updated_at datetime2 NOT NULL DEFAULT GETDATE(),
    resolved_at datetime2 NULL,
    tenant_id uniqueidentifier NOT NULL,
    version bigint NOT NULL DEFAULT 0,
    CONSTRAINT PK_sav_tickets PRIMARY KEY (id)
);

-- sav_agent_logs
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'sav_agent_logs')
CREATE TABLE dbo.sav_agent_logs (
    id uniqueidentifier NOT NULL DEFAULT NEWID(),
    ticket_id uniqueidentifier NULL,
    action nvarchar(100) NULL,
    details nvarchar(MAX) NULL,
    created_at datetime2 NOT NULL DEFAULT GETDATE(),
    tenant_id uniqueidentifier NOT NULL,
    version bigint NOT NULL DEFAULT 0,
    CONSTRAINT PK_sav_agent_logs PRIMARY KEY (id)
);

-- vehicle_load_item
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'vehicle_load_item')
CREATE TABLE dbo.vehicle_load_item (
    id uniqueidentifier NOT NULL DEFAULT NEWID(),
    vehicle_load_id uniqueidentifier NOT NULL,
    item_id nvarchar(255) NULL,
    quantity int NOT NULL DEFAULT 0,
    created_at datetime2 NOT NULL DEFAULT GETDATE(),
    updated_at datetime2 NOT NULL DEFAULT GETDATE(),
    tenant_id uniqueidentifier NOT NULL,
    version bigint NOT NULL DEFAULT 0,
    CONSTRAINT PK_vehicle_load_item PRIMARY KEY (id)
);

SELECT name FROM sys.tables WHERE name IN (
    'notifications','chantier_photos','kb_articles','kb_embeddings',
    'sav_auth_clients','sav_config_sla','sav_escalades','sav_evaluations',
    'sav_messages','sav_profil_client','sav_tickets','sav_agent_logs','vehicle_load_item'
) ORDER BY name;
