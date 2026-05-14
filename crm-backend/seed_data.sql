SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;

DECLARE @com1 UNIQUEIDENTIFIER, @com2 UNIQUEIDENTIFIER, @com3 UNIQUEIDENTIFIER, @com4 UNIQUEIDENTIFIER;
DECLARE @a1 UNIQUEIDENTIFIER=NEWID(), @a2 UNIQUEIDENTIFIER=NEWID(), @a3 UNIQUEIDENTIFIER=NEWID(), @a4 UNIQUEIDENTIFIER=NEWID();
DECLARE @won UNIQUEIDENTIFIER, @lost UNIQUEIDENTIFIER, @nego UNIQUEIDENTIFIER, @qual UNIQUEIDENTIFIER, @prop UNIQUEIDENTIFIER;

SELECT @com1=id FROM users WHERE email='karim.benali@odyssee.ma';
SELECT @com2=id FROM users WHERE email='fatima.ezzahra@odyssee.ma';
SELECT @com3=id FROM users WHERE email='youssef.amrani@odyssee.ma';
SELECT @com4=id FROM users WHERE email='amina.chraibi@odyssee.ma';
SELECT @won=id FROM opportunity_stages WHERE code='WON';
SELECT @lost=id FROM opportunity_stages WHERE code='LOST';
SELECT @nego=id FROM opportunity_stages WHERE code='NEGO';
SELECT @qual=id FROM opportunity_stages WHERE code='QUALIF';
SELECT @prop=id FROM opportunity_stages WHERE code='PROPOSAL';

INSERT INTO accounts (id,name,account_type,billing_city,billing_country,assigned_to_id,created_at,updated_at,version) VALUES
(@a1,N'BTP Casablanca SARL','CLIENT',N'Casablanca',N'Maroc',@com1,SYSUTCDATETIME(),SYSUTCDATETIME(),0),
(@a2,N'Immo Marrakech SA','CLIENT',N'Marrakech',N'Maroc',@com2,SYSUTCDATETIME(),SYSUTCDATETIME(),0),
(@a3,N'Ets Fès Matériaux','PROSPECT',N'Fès',N'Maroc',@com3,SYSUTCDATETIME(),SYSUTCDATETIME(),0),
(@a4,N'Rabat Aménagement SARL','CLIENT',N'Rabat',N'Maroc',@com4,SYSUTCDATETIME(),SYSUTCDATETIME(),0);
PRINT 'Accounts OK';

DECLARE @i INT=1;
WHILE @i<=5 BEGIN
INSERT INTO opportunities(id,name,stage_id,amount,probability,is_closed,is_won,close_date,account_id,assigned_to_id,created_at,updated_at,version)
VALUES(NEWID(),N'Projet Karim-W'+CAST(@i AS NVARCHAR),@won,45000+(@i*12000),100,1,1,DATEADD(DAY,-(@i*7),CAST(GETUTCDATE() AS DATE)),@a1,@com1,DATEADD(DAY,-(@i*14),SYSUTCDATETIME()),SYSUTCDATETIME(),0);
SET @i=@i+1; END;
INSERT INTO opportunities(id,name,stage_id,amount,probability,is_closed,is_won,close_date,account_id,assigned_to_id,created_at,updated_at,version)
VALUES(NEWID(),N'Projet Karim-L1',@lost,30000,0,1,0,DATEADD(DAY,-10,CAST(GETUTCDATE() AS DATE)),@a1,@com1,DATEADD(DAY,-30,SYSUTCDATETIME()),SYSUTCDATETIME(),0);
INSERT INTO opportunities(id,name,stage_id,amount,probability,is_closed,is_won,account_id,assigned_to_id,created_at,updated_at,version) VALUES
(NEWID(),N'Chantier Karim-O1',@nego,85000,60,0,0,@a1,@com1,DATEADD(DAY,-5,SYSUTCDATETIME()),SYSUTCDATETIME(),0),
(NEWID(),N'Chantier Karim-O2',@prop,42000,40,0,0,@a1,@com1,DATEADD(DAY,-3,SYSUTCDATETIME()),SYSUTCDATETIME(),0);
PRINT 'Karim done';

SET @i=1;
WHILE @i<=3 BEGIN
INSERT INTO opportunities(id,name,stage_id,amount,probability,is_closed,is_won,close_date,account_id,assigned_to_id,created_at,updated_at,version)
VALUES(NEWID(),N'Affaire Fatima-W'+CAST(@i AS NVARCHAR),@won,35000+(@i*8000),100,1,1,DATEADD(DAY,-(@i*10),CAST(GETUTCDATE() AS DATE)),@a2,@com2,DATEADD(DAY,-(@i*20),SYSUTCDATETIME()),SYSUTCDATETIME(),0);
SET @i=@i+1; END;
INSERT INTO opportunities(id,name,stage_id,amount,probability,is_closed,is_won,close_date,account_id,assigned_to_id,created_at,updated_at,version) VALUES
(NEWID(),N'Affaire Fatima-L1',@lost,22000,0,1,0,DATEADD(DAY,-15,CAST(GETUTCDATE() AS DATE)),@a2,@com2,DATEADD(DAY,-40,SYSUTCDATETIME()),SYSUTCDATETIME(),0),
(NEWID(),N'Affaire Fatima-L2',@lost,18000,0,1,0,DATEADD(DAY,-8,CAST(GETUTCDATE() AS DATE)),@a2,@com2,DATEADD(DAY,-35,SYSUTCDATETIME()),SYSUTCDATETIME(),0);
INSERT INTO opportunities(id,name,stage_id,amount,probability,is_closed,is_won,account_id,assigned_to_id,created_at,updated_at,version) VALUES
(NEWID(),N'Prospect Fatima-O1',@qual,55000,30,0,0,@a2,@com2,DATEADD(DAY,-7,SYSUTCDATETIME()),SYSUTCDATETIME(),0),
(NEWID(),N'Prospect Fatima-O2',@nego,72000,50,0,0,@a2,@com2,DATEADD(DAY,-4,SYSUTCDATETIME()),SYSUTCDATETIME(),0),
(NEWID(),N'Prospect Fatima-O3',@prop,38000,40,0,0,@a2,@com2,DATEADD(DAY,-2,SYSUTCDATETIME()),SYSUTCDATETIME(),0);
PRINT 'Fatima done';

INSERT INTO opportunities(id,name,stage_id,amount,probability,is_closed,is_won,close_date,account_id,assigned_to_id,created_at,updated_at,version)
VALUES(NEWID(),N'Deal Youssef-W1',@won,28000,100,1,1,DATEADD(DAY,-20,CAST(GETUTCDATE() AS DATE)),@a3,@com3,DATEADD(DAY,-50,SYSUTCDATETIME()),SYSUTCDATETIME(),0);
SET @i=1;
WHILE @i<=3 BEGIN
INSERT INTO opportunities(id,name,stage_id,amount,probability,is_closed,is_won,close_date,account_id,assigned_to_id,created_at,updated_at,version)
VALUES(NEWID(),N'Deal Youssef-L'+CAST(@i AS NVARCHAR),@lost,15000+(@i*5000),0,1,0,DATEADD(DAY,-(@i*12),CAST(GETUTCDATE() AS DATE)),@a3,@com3,DATEADD(DAY,-(@i*25),SYSUTCDATETIME()),SYSUTCDATETIME(),0);
SET @i=@i+1; END;
INSERT INTO opportunities(id,name,stage_id,amount,probability,is_closed,is_won,account_id,assigned_to_id,created_at,updated_at,version)
VALUES(NEWID(),N'Prospect Youssef-O1',@qual,32000,20,0,0,@a3,@com3,DATEADD(DAY,-6,SYSUTCDATETIME()),SYSUTCDATETIME(),0);
PRINT 'Youssef done';

INSERT INTO opportunities(id,name,stage_id,amount,probability,is_closed,is_won,close_date,account_id,assigned_to_id,created_at,updated_at,version) VALUES
(NEWID(),N'Projet Amina-W1',@won,52000,100,1,1,DATEADD(DAY,-5,CAST(GETUTCDATE() AS DATE)),@a4,@com4,DATEADD(DAY,-25,SYSUTCDATETIME()),SYSUTCDATETIME(),0),
(NEWID(),N'Projet Amina-W2',@won,38000,100,1,1,DATEADD(DAY,-12,CAST(GETUTCDATE() AS DATE)),@a4,@com4,DATEADD(DAY,-30,SYSUTCDATETIME()),SYSUTCDATETIME(),0);
INSERT INTO opportunities(id,name,stage_id,amount,probability,is_closed,is_won,account_id,assigned_to_id,created_at,updated_at,version) VALUES
(NEWID(),N'Chantier Amina-O1',@nego,95000,55,0,0,@a4,@com4,DATEADD(DAY,-8,SYSUTCDATETIME()),SYSUTCDATETIME(),0),
(NEWID(),N'Chantier Amina-O2',@prop,62000,45,0,0,@a4,@com4,DATEADD(DAY,-6,SYSUTCDATETIME()),SYSUTCDATETIME(),0),
(NEWID(),N'Chantier Amina-O3',@qual,44000,30,0,0,@a4,@com4,DATEADD(DAY,-3,SYSUTCDATETIME()),SYSUTCDATETIME(),0),
(NEWID(),N'Chantier Amina-O4',@nego,78000,60,0,0,@a4,@com4,DATEADD(DAY,-1,SYSUTCDATETIME()),SYSUTCDATETIME(),0);
PRINT 'Amina done - All seed data complete';
