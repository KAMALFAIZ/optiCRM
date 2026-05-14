-- ============================================================================
-- V66: Workflow automation tables
-- ============================================================================

-- Workflow definitions
CREATE TABLE workflows (
    id                  UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    name                NVARCHAR(200)    NOT NULL,
    description         NVARCHAR(MAX),
    entity_type         NVARCHAR(50)     NOT NULL,
    trigger_type        NVARCHAR(50)     NOT NULL,
    trigger_config      NVARCHAR(MAX),
    is_active           BIT              NOT NULL DEFAULT 0,
    version             INT              NOT NULL DEFAULT 1,
    created_by_id       UNIQUEIDENTIFIER,
    created_by_user_id  UNIQUEIDENTIFIER,
    created_at          DATETIME2        NOT NULL DEFAULT GETDATE(),
    updated_at          DATETIME2,
    CONSTRAINT pk_workflows PRIMARY KEY (id),
    CONSTRAINT fk_workflows_created_by FOREIGN KEY (created_by_id) REFERENCES users(id)
);

CREATE INDEX idx_workflows_entity_type ON workflows(entity_type);
CREATE INDEX idx_workflows_trigger_type ON workflows(trigger_type);
CREATE INDEX idx_workflows_active ON workflows(is_active);

-- Workflow steps (nodes in the visual editor)
CREATE TABLE workflow_steps (
    id              UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    workflow_id     UNIQUEIDENTIFIER NOT NULL,
    name            NVARCHAR(200)    NOT NULL,
    step_type       NVARCHAR(50)     NOT NULL,
    action_config   NVARCHAR(MAX),
    step_order      INT              NOT NULL DEFAULT 0,
    position_x      INT              DEFAULT 0,
    position_y      INT              DEFAULT 0,
    is_entry_point  BIT              DEFAULT 0,
    CONSTRAINT pk_workflow_steps PRIMARY KEY (id),
    CONSTRAINT fk_workflow_steps_workflow FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
);

CREATE INDEX idx_workflow_steps_workflow ON workflow_steps(workflow_id);

-- Transitions between steps (edges in the visual editor)
CREATE TABLE workflow_transitions (
    id                      UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    workflow_id             UNIQUEIDENTIFIER NOT NULL,
    from_step_id            UNIQUEIDENTIFIER NOT NULL,
    to_step_id              UNIQUEIDENTIFIER NOT NULL,
    label                   NVARCHAR(100),
    condition_expression    NVARCHAR(MAX),
    eval_order              INT              DEFAULT 0,
    CONSTRAINT pk_workflow_transitions PRIMARY KEY (id),
    CONSTRAINT fk_workflow_transitions_workflow FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE,
    CONSTRAINT fk_workflow_transitions_from FOREIGN KEY (from_step_id) REFERENCES workflow_steps(id),
    CONSTRAINT fk_workflow_transitions_to FOREIGN KEY (to_step_id) REFERENCES workflow_steps(id)
);

CREATE INDEX idx_workflow_transitions_workflow ON workflow_transitions(workflow_id);
CREATE INDEX idx_workflow_transitions_from ON workflow_transitions(from_step_id);

-- Workflow execution instances
CREATE TABLE workflow_executions (
    id              UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    workflow_id     UNIQUEIDENTIFIER NOT NULL,
    entity_type     NVARCHAR(50)     NOT NULL,
    entity_id       UNIQUEIDENTIFIER,
    status          NVARCHAR(30)     NOT NULL DEFAULT 'RUNNING',
    current_step_id UNIQUEIDENTIFIER,
    resume_at       DATETIME2,
    error_message   NVARCHAR(MAX),
    triggered_by_id UNIQUEIDENTIFIER,
    started_at      DATETIME2        NOT NULL DEFAULT GETDATE(),
    completed_at    DATETIME2,
    CONSTRAINT pk_workflow_executions PRIMARY KEY (id),
    CONSTRAINT fk_workflow_executions_workflow FOREIGN KEY (workflow_id) REFERENCES workflows(id),
    CONSTRAINT fk_workflow_executions_step FOREIGN KEY (current_step_id) REFERENCES workflow_steps(id)
);

CREATE INDEX idx_workflow_executions_workflow ON workflow_executions(workflow_id);
CREATE INDEX idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX idx_workflow_executions_entity ON workflow_executions(entity_type, entity_id);
CREATE INDEX idx_workflow_executions_resume ON workflow_executions(status, resume_at);

-- Execution step logs (audit trail)
CREATE TABLE workflow_execution_logs (
    id              UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    execution_id    UNIQUEIDENTIFIER NOT NULL,
    step_id         UNIQUEIDENTIFIER NOT NULL,
    status          NVARCHAR(30)     NOT NULL,
    input_data      NVARCHAR(MAX),
    output_data     NVARCHAR(MAX),
    error_message   NVARCHAR(MAX),
    duration_ms     BIGINT,
    executed_at     DATETIME2        NOT NULL DEFAULT GETDATE(),
    CONSTRAINT pk_workflow_execution_logs PRIMARY KEY (id),
    CONSTRAINT fk_workflow_logs_execution FOREIGN KEY (execution_id) REFERENCES workflow_executions(id) ON DELETE CASCADE,
    CONSTRAINT fk_workflow_logs_step FOREIGN KEY (step_id) REFERENCES workflow_steps(id)
);

CREATE INDEX idx_workflow_logs_execution ON workflow_execution_logs(execution_id);
