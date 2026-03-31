SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- User activity / audit log table
CREATE TABLE user_activities (
    id              UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    user_id         UNIQUEIDENTIFIER NOT NULL REFERENCES users(id) ON DELETE NO ACTION,
    action          NVARCHAR(50) NOT NULL,
    details         NVARCHAR(MAX),
    performed_by    UNIQUEIDENTIFIER REFERENCES users(id) ON DELETE NO ACTION,
    created_at      DATETIMEOFFSET NOT NULL DEFAULT GETUTCDATE()
);

CREATE INDEX idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX idx_user_activities_created_at ON user_activities(created_at DESC);