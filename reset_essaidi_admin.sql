UPDATE opticrm_ets_essaidi.dbo.users
SET password_hash = '$2a$10$UuDS9lKXP.WuB8pt1/HayeSChpEdOTDOPbH1prbUCrzO0qn5iRCEy',
    failed_login_attempts = 0,
    locked_until = NULL,
    is_active = 1
WHERE email = 'admin@etsessaidi.ma';
