SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- Migration V28: Table des tokens de réinitialisation de mot de passe
IF OBJECT_ID('password_reset_tokens', 'U') IS NULL
BEGIN
CREATE TABLE password_reset_tokens (
    id          UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    token       NVARCHAR(255) NOT NULL UNIQUE,
    user_id     UNIQUEIDENTIFIER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at  DATETIMEOFFSET NOT NULL,
    used_at     DATETIMEOFFSET,
    created_at  DATETIMEOFFSET NOT NULL DEFAULT GETUTCDATE()
)
END;

IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_prt_token' AND object_id = OBJECT_ID('password_reset_tokens'))
    CREATE INDEX idx_prt_token   ON password_reset_tokens(token);
IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_prt_user_id' AND object_id = OBJECT_ID('password_reset_tokens'))
    CREATE INDEX idx_prt_user_id ON password_reset_tokens(user_id);