SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;

-- Réinitialiser le mot de passe à Admin123! pour a.elbekbachi@odyssee.co.ma
UPDATE dbo.users
SET
    password_hash = '$2a$10$eone.sEAqB7BnZ1erdDgouhdxMuYKztnnmUrbXtfr12xffsmNxd6e',
    failed_login_attempts = 0,
    locked_until = NULL
WHERE email = 'a.elbekbachi@odyssee.co.ma';

-- Vérification
SELECT email, LEN(password_hash) AS hash_len, password_hash FROM dbo.users WHERE email = 'a.elbekbachi@odyssee.co.ma';
