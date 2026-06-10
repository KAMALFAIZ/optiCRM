-- Réinsère la clé d'agent existante après reset de la BDD.
-- Clé brute (à utiliser dans l'EXE Agent) :
--   agent_sk_9f69062f32f4ecfcf308244c9db49099990008d1e952ba93
-- Hash SHA-256 de cette clé :
--   d62f6126191e3cf9f2a4200c704d9064501aa8a04044b847f560441c7914606e

USE opticrm_system;
GO

DELETE FROM agent_api_keys;
INSERT INTO agent_api_keys
    (id, tenant_id, key_hash, key_prefix, label, enabled, created_at)
VALUES
    (NEWID(),
     '00000000-0000-0000-0000-000000000001',
     'd62f6126191e3cf9f2a4200c704d9064501aa8a04044b847f560441c7914606e',
     'agent_sk_9f690',
     'Agent Local',
     1,
     GETUTCDATE());
GO

SELECT id, key_prefix, label, enabled FROM agent_api_keys;
