SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF OBJECT_ID('push_subscriptions', 'U') IS NULL
BEGIN
CREATE TABLE push_subscriptions (
    id          UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    user_id     UNIQUEIDENTIFIER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    endpoint    NVARCHAR(500) NOT NULL,
    p256dh_key  NVARCHAR(255) NOT NULL,
    auth_key    NVARCHAR(255) NOT NULL,
    created_at  DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT uq_push_sub UNIQUE(user_id, endpoint)
)
END;
GO

IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_push_subscriptions_user_id' AND object_id = OBJECT_ID('push_subscriptions'))
    CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions(user_id);
GO
