SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'google_calendar_credentials')
BEGIN
    CREATE TABLE google_calendar_credentials (
        id              UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
        user_id         UNIQUEIDENTIFIER NOT NULL,
        access_token    NVARCHAR(MAX)    NOT NULL,
        refresh_token   NVARCHAR(MAX)    NULL,
        token_expiry    BIGINT           NULL,
        google_email    NVARCHAR(255)    NULL,
        calendar_id     NVARCHAR(255)    NOT NULL DEFAULT 'primary',
        sync_enabled    BIT              NOT NULL DEFAULT 1,
        created_at      DATETIME2        NOT NULL DEFAULT GETDATE(),
        updated_at      DATETIME2        NOT NULL DEFAULT GETDATE(),
        CONSTRAINT uq_gc_credentials_user UNIQUE (user_id)
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('activities') AND name = 'google_event_id')
    ALTER TABLE activities ADD google_event_id NVARCHAR(255) NULL;
GO
