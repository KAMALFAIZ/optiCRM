SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- Fix: insérer admin@odyssee.ma dans opticrm_odyssee
-- À exécuter UNE FOIS directement sur la base opticrm_odyssee
-- Mot de passe : Admin123!

IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@odyssee.ma')
BEGIN
    INSERT INTO users (id, email, password_hash, first_name, last_name, role_id, is_active,
                       preferred_language, timezone, created_at, updated_at, version)
    SELECT
        NEWID(),
        'admin@odyssee.ma',
        '$2a$10$eone.sEAqB7BnZ1erdDgouhdxMuYKztnnmUrbXtfr12xffsmNxd6e',
        'Admin',
        'Odyssee',
        r.id,
        1,
        'fr',
        'Africa/Casablanca',
        GETUTCDATE(), GETUTCDATE(), 0
    FROM roles r WHERE r.name = 'SUPER_ADMIN';
    PRINT 'OK: admin@odyssee.ma inserted';
END
ELSE
BEGIN
    PRINT 'admin@odyssee.ma already exists — checking password hash...';
    UPDATE users
    SET password_hash = '$2a$10$eone.sEAqB7BnZ1erdDgouhdxMuYKztnnmUrbXtfr12xffsmNxd6e',
        failed_login_attempts = 0,
        locked_until = NULL,
        is_active = 1
    WHERE email = 'admin@odyssee.ma';
    PRINT 'OK: hash reset for admin@odyssee.ma';
END
GO

-- Marquer V76 comme réparée dans Flyway (si elle était en échec)
UPDATE flyway_schema_history
SET success = 1
WHERE script = 'V76__seed_tenant_odyssee.sql' AND success = 0;
GO

-- Vérification
SELECT email, is_active,
       CASE WHEN locked_until IS NOT NULL AND locked_until > GETUTCDATE()
            THEN 'LOCKED' ELSE 'OK' END AS lock_status,
       (SELECT name FROM roles WHERE id = role_id) AS role
FROM users WHERE email = 'admin@odyssee.ma';
GO
