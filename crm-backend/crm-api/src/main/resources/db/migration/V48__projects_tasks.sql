SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================
-- V48 : Projets, Milestones, Tâches
-- ============================================================

IF OBJECT_ID('projects', 'U') IS NULL
BEGIN
CREATE TABLE projects (
    id              UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    reference       NVARCHAR(20) NOT NULL UNIQUE,
    name            NVARCHAR(300) NOT NULL,
    description     NVARCHAR(MAX),
    status          NVARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    start_date      DATE,
    end_date        DATE,
    budget          DECIMAL(15,2),
    progress_pct    INTEGER NOT NULL DEFAULT 0,

    -- Relations CRM
    account_id      UNIQUEIDENTIFIER REFERENCES accounts(id) ON DELETE NO ACTION,
    opportunity_id  UNIQUEIDENTIFIER REFERENCES opportunities(id) ON DELETE NO ACTION,

    -- Équipe
    manager_id      UNIQUEIDENTIFIER REFERENCES users(id) ON DELETE NO ACTION,
    created_by_id   UNIQUEIDENTIFIER REFERENCES users(id) ON DELETE NO ACTION,

    -- Audit
    created_at      DATETIMEOFFSET NOT NULL DEFAULT GETUTCDATE(),
    updated_at      DATETIMEOFFSET DEFAULT GETUTCDATE()
)
END;

IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_projects_status' AND object_id = OBJECT_ID('projects'))
    CREATE INDEX idx_projects_status ON projects(status);
IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_projects_account' AND object_id = OBJECT_ID('projects'))
    CREATE INDEX idx_projects_account ON projects(account_id);
IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_projects_manager' AND object_id = OBJECT_ID('projects'))
    CREATE INDEX idx_projects_manager ON projects(manager_id);

-- ============================================================
-- Membres de projets
-- ============================================================

IF OBJECT_ID('project_members', 'U') IS NULL
BEGIN
CREATE TABLE project_members (
    id          UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    project_id  UNIQUEIDENTIFIER NOT NULL REFERENCES projects(id) ON DELETE NO ACTION,
    user_id     UNIQUEIDENTIFIER NOT NULL REFERENCES users(id) ON DELETE NO ACTION,
    role        NVARCHAR(30) NOT NULL DEFAULT 'MEMBRE',
    UNIQUE (project_id, user_id)
)
END;

IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_project_members_project' AND object_id = OBJECT_ID('project_members'))
    CREATE INDEX idx_project_members_project ON project_members(project_id);
IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_project_members_user' AND object_id = OBJECT_ID('project_members'))
    CREATE INDEX idx_project_members_user ON project_members(user_id);

-- ============================================================
-- Milestones
-- ============================================================

IF OBJECT_ID('milestones', 'U') IS NULL
BEGIN
CREATE TABLE milestones (
    id          UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    project_id  UNIQUEIDENTIFIER NOT NULL REFERENCES projects(id) ON DELETE NO ACTION,
    name        NVARCHAR(200) NOT NULL,
    description NVARCHAR(MAX),
    due_date    DATE,
    status      NVARCHAR(30) NOT NULL DEFAULT 'EN_ATTENTE',
    sort_order  INTEGER DEFAULT 0,
    created_at  DATETIMEOFFSET NOT NULL DEFAULT GETUTCDATE()
)
END;

IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_milestones_project' AND object_id = OBJECT_ID('milestones'))
    CREATE INDEX idx_milestones_project ON milestones(project_id);

-- ============================================================
-- Tâches
-- ============================================================

IF OBJECT_ID('tasks', 'U') IS NULL
BEGIN
CREATE TABLE tasks (
    id              UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    title           NVARCHAR(300) NOT NULL,
    description     NVARCHAR(MAX),
    status          NVARCHAR(30) NOT NULL DEFAULT 'A_FAIRE',
    priority        NVARCHAR(20) NOT NULL DEFAULT 'NORMALE',
    type            NVARCHAR(30) NOT NULL DEFAULT 'TACHE',
    estimated_hours DECIMAL(6,2),
    actual_hours    DECIMAL(6,2),
    start_date      DATE,
    due_date        DATE,
    completed_at    DATETIMEOFFSET,

    -- Relations
    project_id      UNIQUEIDENTIFIER NOT NULL REFERENCES projects(id) ON DELETE NO ACTION,
    milestone_id    UNIQUEIDENTIFIER REFERENCES milestones(id) ON DELETE NO ACTION,
    parent_task_id  UNIQUEIDENTIFIER REFERENCES tasks(id) ON DELETE NO ACTION,
    assignee_id     UNIQUEIDENTIFIER REFERENCES users(id) ON DELETE NO ACTION,
    created_by_id   UNIQUEIDENTIFIER REFERENCES users(id) ON DELETE NO ACTION,

    -- Audit
    created_at      DATETIMEOFFSET NOT NULL DEFAULT GETUTCDATE(),
    updated_at      DATETIMEOFFSET DEFAULT GETUTCDATE()
)
END;

IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_tasks_project' AND object_id = OBJECT_ID('tasks'))
    CREATE INDEX idx_tasks_project ON tasks(project_id);
IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_tasks_milestone' AND object_id = OBJECT_ID('tasks'))
    CREATE INDEX idx_tasks_milestone ON tasks(milestone_id);
IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_tasks_assignee' AND object_id = OBJECT_ID('tasks'))
    CREATE INDEX idx_tasks_assignee ON tasks(assignee_id);
IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_tasks_status' AND object_id = OBJECT_ID('tasks'))
    CREATE INDEX idx_tasks_status ON tasks(status);
IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_tasks_due_date' AND object_id = OBJECT_ID('tasks'))
    CREATE INDEX idx_tasks_due_date ON tasks(due_date);

-- ============================================================
-- Commentaires de tâches
-- ============================================================

IF OBJECT_ID('task_comments', 'U') IS NULL
BEGIN
CREATE TABLE task_comments (
    id          UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    task_id     UNIQUEIDENTIFIER NOT NULL REFERENCES tasks(id) ON DELETE NO ACTION,
    content     NVARCHAR(MAX) NOT NULL,
    author_id   UNIQUEIDENTIFIER REFERENCES users(id) ON DELETE NO ACTION,
    created_at  DATETIMEOFFSET NOT NULL DEFAULT GETUTCDATE()
)
END;

IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_task_comments_task' AND object_id = OBJECT_ID('task_comments'))
    CREATE INDEX idx_task_comments_task ON task_comments(task_id);