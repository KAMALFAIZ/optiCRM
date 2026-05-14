-- ============================================================
-- V67 : Workflow Templates
-- Tables pour les templates de workflows prédéfinis
-- ============================================================

CREATE TABLE workflow_templates (
    id              UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    name            NVARCHAR(200)    NOT NULL,
    description     NVARCHAR(MAX),
    category        NVARCHAR(100)    NOT NULL,        -- ex: 'Lead Management', 'Sales', 'Field Operations'
    icon            NVARCHAR(100),                    -- emoji ou nom d'icône Ant Design
    entity_type     NVARCHAR(50)     NOT NULL,        -- LEAD, OPPORTUNITY, ACCOUNT, CONTACT, QUOTE, VISIT, TICKET
    trigger_type    NVARCHAR(50)     NOT NULL,        -- ENTITY_CREATED, FIELD_CHANGED, STATUS_CHANGED, SCORE_REACHED, CRON, MANUAL
    trigger_config  NVARCHAR(MAX),                    -- JSON: config du déclencheur
    steps_config    NVARCHAR(MAX)    NOT NULL,        -- JSON array: [{name, stepType, actionConfig, stepOrder, isEntryPoint}]
    transitions_config NVARCHAR(MAX),                 -- JSON array: [{fromStepIndex, toStepIndex, label, conditionExpression}]
    tags            NVARCHAR(500),                    -- ex: 'lead,nurturing,email'
    is_system       BIT              NOT NULL DEFAULT 1,   -- 1 = template système non modifiable
    usage_count     INT              NOT NULL DEFAULT 0,
    created_at      DATETIME2        NOT NULL DEFAULT SYSDATETIME(),
    updated_at      DATETIME2
);

-- Index pour la recherche par catégorie et entité
CREATE INDEX idx_wf_templates_category       ON workflow_templates(category);
CREATE INDEX idx_wf_templates_entity_type    ON workflow_templates(entity_type);
CREATE INDEX idx_wf_templates_is_system      ON workflow_templates(is_system);
