SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- V35 — Configuration accès serveur Sage 100
-- Ajoute les paramètres de connexion SQL Server dans app_settings

IF NOT EXISTS (SELECT 1 FROM app_settings WHERE [key] = 'sage.server.enabled')
    INSERT INTO app_settings ([key], value, category) VALUES ('sage.server.enabled',  'false', 'sage');
IF NOT EXISTS (SELECT 1 FROM app_settings WHERE [key] = 'sage.server.host')
    INSERT INTO app_settings ([key], value, category) VALUES ('sage.server.host',     '',      'sage');
IF NOT EXISTS (SELECT 1 FROM app_settings WHERE [key] = 'sage.server.port')
    INSERT INTO app_settings ([key], value, category) VALUES ('sage.server.port',     '1433',  'sage');
IF NOT EXISTS (SELECT 1 FROM app_settings WHERE [key] = 'sage.server.database')
    INSERT INTO app_settings ([key], value, category) VALUES ('sage.server.database', '',      'sage');
IF NOT EXISTS (SELECT 1 FROM app_settings WHERE [key] = 'sage.server.username')
    INSERT INTO app_settings ([key], value, category) VALUES ('sage.server.username', '',      'sage');
IF NOT EXISTS (SELECT 1 FROM app_settings WHERE [key] = 'sage.server.password')
    INSERT INTO app_settings ([key], value, category) VALUES ('sage.server.password', '',      'sage');
IF NOT EXISTS (SELECT 1 FROM app_settings WHERE [key] = 'sage.server.dossier')
    INSERT INTO app_settings ([key], value, category) VALUES ('sage.server.dossier',  '',      'sage');
