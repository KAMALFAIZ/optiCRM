SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- =====================================================
-- V76: Tenant Odyssée (client BTP / distribution)
-- =====================================================

-- 1. Créer le tenant Odyssée
IF NOT EXISTS (SELECT 1 FROM tenants WHERE slug = 'odyssee')
    INSERT INTO tenants (id, slug, name, status, plan_id, admin_email, primary_color)
    VALUES (
        '00000000-0000-0000-0000-000000000002',
        'odyssee',
        'Odyssée',
        'ACTIVE',
        'ENTERPRISE',
        'admin@odyssee.ma',
        '#0F6CBD'
    );

-- 2. Créer l'utilisateur admin Odyssée (password: Admin123!)
IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@odyssee.ma')
    INSERT INTO users (id, email, password_hash, first_name, last_name, role_id, is_active)
    SELECT
        NEWID(),
        'admin@odyssee.ma',
        '$2a$10$eone.sEAqB7BnZ1erdDgouhdxMuYKztnnmUrbXtfr12xffsmNxd6e',
        'Admin',
        'Odyssée',
        r.id,
        1
    FROM roles r WHERE r.name = 'SUPER_ADMIN';
GO
