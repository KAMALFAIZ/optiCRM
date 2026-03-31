UPDATE users SET password_hash = '$2a$10$eV5matTo9gt1eo5CfM8BZOtJJ26PfSjKiNeChNnYcz3Clb3DRH/RW' WHERE email = 'admin@opticrm.com';
SELECT password_hash FROM users WHERE email = 'admin@opticrm.com';
