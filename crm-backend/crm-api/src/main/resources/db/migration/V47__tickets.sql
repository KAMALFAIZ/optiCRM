SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================
-- V47 : Tickets de support / SAV
-- ============================================================

IF OBJECT_ID('tickets', 'U') IS NULL
BEGIN
CREATE TABLE tickets (
    id              UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    reference       NVARCHAR(20) NOT NULL UNIQUE,
    title           NVARCHAR(300) NOT NULL,
    description     NVARCHAR(MAX),
    category        NVARCHAR(50) NOT NULL DEFAULT 'AUTRE',
    priority        NVARCHAR(20) NOT NULL DEFAULT 'NORMALE',
    status          NVARCHAR(30) NOT NULL DEFAULT 'OUVERT',
    sla_deadline    DATETIMEOFFSET,
    resolved_at     DATETIMEOFFSET,
    closed_at       DATETIMEOFFSET,

    -- Relations CRM
    account_id      UNIQUEIDENTIFIER REFERENCES accounts(id) ON DELETE NO ACTION,
    contact_id      UNIQUEIDENTIFIER REFERENCES contacts(id) ON DELETE NO ACTION,

    -- Assignation
    assigned_to_id  UNIQUEIDENTIFIER REFERENCES users(id) ON DELETE NO ACTION,
    created_by_id   UNIQUEIDENTIFIER REFERENCES users(id) ON DELETE NO ACTION,

    -- Audit
    created_at      DATETIMEOFFSET NOT NULL DEFAULT GETUTCDATE(),
    updated_at      DATETIMEOFFSET DEFAULT GETUTCDATE()
)
END;

IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_tickets_status' AND object_id = OBJECT_ID('tickets'))
    CREATE INDEX idx_tickets_status ON tickets(status);
IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_tickets_priority' AND object_id = OBJECT_ID('tickets'))
    CREATE INDEX idx_tickets_priority ON tickets(priority);
IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_tickets_account' AND object_id = OBJECT_ID('tickets'))
    CREATE INDEX idx_tickets_account ON tickets(account_id);
IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_tickets_assigned' AND object_id = OBJECT_ID('tickets'))
    CREATE INDEX idx_tickets_assigned ON tickets(assigned_to_id);
IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_tickets_created_at' AND object_id = OBJECT_ID('tickets'))
    CREATE INDEX idx_tickets_created_at ON tickets(created_at DESC);

-- ============================================================
-- Commentaires de tickets
-- ============================================================

IF OBJECT_ID('ticket_comments', 'U') IS NULL
BEGIN
CREATE TABLE ticket_comments (
    id          UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    ticket_id   UNIQUEIDENTIFIER NOT NULL REFERENCES tickets(id) ON DELETE NO ACTION,
    content     NVARCHAR(MAX) NOT NULL,
    is_internal BIT NOT NULL DEFAULT 0,
    author_id   UNIQUEIDENTIFIER REFERENCES users(id) ON DELETE NO ACTION,
    created_at  DATETIMEOFFSET NOT NULL DEFAULT GETUTCDATE()
)
END;

IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_ticket_comments_ticket' AND object_id = OBJECT_ID('ticket_comments'))
    CREATE INDEX idx_ticket_comments_ticket ON ticket_comments(ticket_id);