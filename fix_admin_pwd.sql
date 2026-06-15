UPDATE opticrm_default.dbo.users
SET password_hash = '$2a$10$UuDS9lKXP.WuB8pt1/HayeSChpEdOTDOPbH1prbUCrzO0qn5iRCEy',
    failed_login_attempts = 0,
    locked_until = NULL
WHERE email = 'admin@opticrm.local';

SELECT email, password_hash FROM opticrm_default.dbo.users WHERE email = 'admin@opticrm.local';
