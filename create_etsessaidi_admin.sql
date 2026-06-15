-- Créer admin pour ETS ESSAIDI
-- tenant_id: E8D4EB35-EB35-484F-A697-FD268493BE19
-- role ADMIN: 6F0C8B94-537B-401C-8A69-4735BE20079A
-- password: Admin123! => $2a$10$UuDS9lKXP.WuB8pt1/HayeSChpEdOTDOPbH1prbUCrzO0qn5iRCEy

INSERT INTO opticrm_ets_essaidi.dbo.users (
    id, email, password_hash, first_name, last_name,
    is_active, failed_login_attempts, locked_until,
    role_id, tenant_id, created_at, updated_at, version
)
VALUES (
    NEWID(),
    'admin@etsessaidi.ma',
    '$2a$10$UuDS9lKXP.WuB8pt1/HayeSChpEdOTDOPbH1prbUCrzO0qn5iRCEy',
    'Admin',
    'ETS ESSAIDI',
    1, 0, NULL,
    '6F0C8B94-537B-401C-8A69-4735BE20079A',
    'E8D4EB35-EB35-484F-A697-FD268493BE19',
    GETDATE(), GETDATE(), 0
);

SELECT email, is_active, failed_login_attempts FROM opticrm_ets_essaidi.dbo.users;
