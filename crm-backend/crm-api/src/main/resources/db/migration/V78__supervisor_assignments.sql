SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- =====================================================
-- V78: Supervisor ↔ Collaborator assignments
-- Each SUPERVISEUR can be assigned specific collaborators
-- to monitor their KPIs, visits, and performance.
-- =====================================================

CREATE TABLE supervisor_assignments (
    id                UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    supervisor_id     UNIQUEIDENTIFIER NOT NULL,
    collaborator_id   UNIQUEIDENTIFIER NOT NULL,
    assigned_at       DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    assigned_by_id    UNIQUEIDENTIFIER NULL,
    notes             NVARCHAR(500)    NULL,
    is_active         BIT              NOT NULL DEFAULT 1,
    deactivated_at    DATETIME2        NULL,

    CONSTRAINT pk_supervisor_assignments PRIMARY KEY (id),
    CONSTRAINT fk_sa_supervisor   FOREIGN KEY (supervisor_id)   REFERENCES users(id),
    CONSTRAINT fk_sa_collaborator FOREIGN KEY (collaborator_id) REFERENCES users(id),
    CONSTRAINT fk_sa_assigned_by  FOREIGN KEY (assigned_by_id)  REFERENCES users(id),
    CONSTRAINT uq_sa_active_pair  UNIQUE (supervisor_id, collaborator_id, is_active)
);

CREATE INDEX idx_sa_supervisor   ON supervisor_assignments(supervisor_id)   WHERE is_active = 1;
CREATE INDEX idx_sa_collaborator ON supervisor_assignments(collaborator_id) WHERE is_active = 1;

-- Update SUPERVISEUR role permissions: add supervision + reporting
UPDATE roles
SET permissions = JSON_MODIFY(
        JSON_MODIFY(permissions, '$.supervision', JSON_QUERY('{"read": true, "update": true, "assign": true}')),
        '$.reporting', JSON_QUERY('{"read": true, "export": true}')
    )
WHERE name = 'SUPERVISEUR';
GO
