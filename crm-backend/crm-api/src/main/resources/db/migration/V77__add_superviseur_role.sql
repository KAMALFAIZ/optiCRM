SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- Add SUPERVISEUR system role
INSERT INTO roles (id, name, description, permissions, is_system, tenant_id) VALUES
(NEWID(), 'SUPERVISEUR', 'Superviseur - Supervision des commerciaux et suivi terrain', '{
    "users": {"read": true},
    "teams": {"read": true},
    "territories": {"read": true},
    "contacts": {"create": true, "read": true, "update": true, "delete": false, "export": true},
    "accounts": {"create": true, "read": true, "update": true, "delete": false, "export": true},
    "leads": {"create": true, "read": true, "update": true, "delete": false, "convert": true},
    "opportunities": {"create": true, "read": true, "update": true, "delete": false},
    "quotes": {"create": true, "read": true, "update": true, "delete": false, "send": true},
    "products": {"read": true},
    "stock": {"read": true},
    "invoices": {"read": true},
    "payments": {"read": true},
    "activities": {"create": true, "read": true, "update": true, "delete": true},
    "objections": {"create": true, "read": true, "update": true, "approve": true},
    "reports": {"read": true, "export": true}
}', 1, '00000000-0000-0000-0000-000000000001');
