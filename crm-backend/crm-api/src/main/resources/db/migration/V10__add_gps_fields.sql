SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- =============================================
-- V10: Ajout champs GPS pour localisation
-- =============================================

-- Tours : coordonnées GPS départ et arrivée
ALTER TABLE tours ADD start_latitude DECIMAL(10,8);
ALTER TABLE tours ADD start_longitude DECIMAL(11,8);
ALTER TABLE tours ADD end_latitude DECIMAL(10,8);
ALTER TABLE tours ADD end_longitude DECIMAL(11,8);

-- Expense Report Lines : lieu de la dépense
ALTER TABLE expense_report_lines ADD latitude DECIMAL(10,8);
ALTER TABLE expense_report_lines ADD longitude DECIMAL(11,8);
ALTER TABLE expense_report_lines ADD address NVARCHAR(500);