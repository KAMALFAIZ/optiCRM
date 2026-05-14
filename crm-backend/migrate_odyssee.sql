SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;

-- ===== V77: Add SUPERVISEUR role to opticrm_odyssee =====
DECLARE @supId UNIQUEIDENTIFIER = NEWID();
IF NOT EXISTS (SELECT 1 FROM roles WHERE name='SUPERVISEUR')
BEGIN
  INSERT INTO roles (id, name, description, permissions, version)
  VALUES (@supId, N'SUPERVISEUR', N'Superviseur commercial - suivi equipe',
    N'{"users":{"read":true},"teams":{"read":true},"territories":{"read":true},"contacts":{"create":true,"read":true,"update":true},"accounts":{"create":true,"read":true,"update":true},"leads":{"create":true,"read":true,"update":true},"opportunities":{"create":true,"read":true,"update":true},"crm":{"read":true,"create":true,"update":true},"terrain":{"read":true},"planning":{"read":true},"reporting":{"read":true},"supervision":{"read":true},"chantiers":{"read":true},"data_scope":"team"}',
    0);
  PRINT 'SUPERVISEUR role inserted OK';
END
ELSE PRINT 'SUPERVISEUR already exists';

-- ===== V78: Create supervisor_assignments table =====
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name='supervisor_assignments')
BEGIN
  CREATE TABLE supervisor_assignments (
      id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
      supervisor_id UNIQUEIDENTIFIER NOT NULL,
      collaborator_id UNIQUEIDENTIFIER NOT NULL,
      assigned_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
      assigned_by_id UNIQUEIDENTIFIER NULL,
      notes NVARCHAR(500) NULL,
      is_active BIT NOT NULL DEFAULT 1,
      deactivated_at DATETIME2 NULL,
      version BIGINT NOT NULL DEFAULT 0,
      CONSTRAINT pk_supervisor_assignments PRIMARY KEY (id),
      CONSTRAINT fk_sa_supervisor FOREIGN KEY (supervisor_id) REFERENCES users(id),
      CONSTRAINT fk_sa_collaborator FOREIGN KEY (collaborator_id) REFERENCES users(id),
      CONSTRAINT fk_sa_assigned_by FOREIGN KEY (assigned_by_id) REFERENCES users(id)
  );
  PRINT 'supervisor_assignments table created OK';
END
ELSE PRINT 'supervisor_assignments already exists';

-- ===== Create supervisor user nabil.tahiri =====
DECLARE @supRoleId UNIQUEIDENTIFIER;
SELECT @supRoleId = id FROM roles WHERE name = 'SUPERVISEUR';

IF NOT EXISTS (SELECT 1 FROM users WHERE email='nabil.tahiri@odyssee.ma')
BEGIN
  INSERT INTO users (id, email, password_hash, first_name, last_name, is_active, preferred_language, timezone, created_at, updated_at, version)
  VALUES (
    NEWID(),
    N'nabil.tahiri@odyssee.ma',
    N'$2a$10$eone.sEAqB7BnZ1erdDgouhdxMuYKztnnmUrbXtfr12xffsmNxd6e',
    N'Nabil', N'Tahiri',
    1, N'fr', N'Africa/Casablanca',
    SYSUTCDATETIME(), SYSUTCDATETIME(), 0
  );
  -- Assign SUPERVISEUR role
  UPDATE users SET role_id = @supRoleId WHERE email = 'nabil.tahiri@odyssee.ma';
  PRINT 'User nabil.tahiri created OK';
END
ELSE
BEGIN
  -- Update role if user already exists
  UPDATE users SET role_id = @supRoleId WHERE email = 'nabil.tahiri@odyssee.ma';
  PRINT 'User nabil.tahiri already exists - role updated';
END

-- ===== Verify =====
PRINT '';
PRINT '=== Verification ===';
SELECT name, id FROM roles WHERE name='SUPERVISEUR';
SELECT email, first_name, (SELECT name FROM roles WHERE id=u.role_id) as role FROM users u WHERE email='nabil.tahiri@odyssee.ma';
SELECT 'supervisor_assignments table: ' + CAST(COUNT(*) AS NVARCHAR) FROM sys.tables WHERE name='supervisor_assignments';
