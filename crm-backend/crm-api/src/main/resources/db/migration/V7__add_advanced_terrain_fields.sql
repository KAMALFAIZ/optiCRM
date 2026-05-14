SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- =====================================================
-- V7: Add advanced fields to Visits, Activities, Tours
-- Covers: Objectives, Commercial, Logistics, Follow-up
-- =====================================================

-- ===== VISITS: 13 new columns =====
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('visits') AND name = 'objective')
    ALTER TABLE visits ADD objective NVARCHAR(255);
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('visits') AND name = 'interest_level')
    ALTER TABLE visits ADD interest_level NVARCHAR(20);
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('visits') AND name = 'satisfaction')
    ALTER TABLE visits ADD satisfaction INT;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('visits') AND name = 'competitor_detected')
    ALTER TABLE visits ADD competitor_detected NVARCHAR(255);
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('visits') AND name = 'products_presented')
    ALTER TABLE visits ADD products_presented NVARCHAR(MAX);
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('visits') AND name = 'estimated_amount')
    ALTER TABLE visits ADD estimated_amount DECIMAL(12,2);
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('visits') AND name = 'samples_delivered')
    ALTER TABLE visits ADD samples_delivered NVARCHAR(255);
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('visits') AND name = 'transport_mode')
    ALTER TABLE visits ADD transport_mode NVARCHAR(50);
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('visits') AND name = 'mileage')
    ALTER TABLE visits ADD mileage DECIMAL(10,2);
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('visits') AND name = 'expenses')
    ALTER TABLE visits ADD expenses DECIMAL(12,2);
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('visits') AND name = 'follow_up_date')
    ALTER TABLE visits ADD follow_up_date DATETIME2;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('visits') AND name = 'follow_up_priority')
    ALTER TABLE visits ADD follow_up_priority NVARCHAR(20);
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('visits') AND name = 'next_visit_planned')
    ALTER TABLE visits ADD next_visit_planned BIT;

-- ===== ACTIVITIES: 8 new columns =====
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('activities') AND name = 'objective')
    ALTER TABLE activities ADD objective NVARCHAR(255);
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('activities') AND name = 'result')
    ALTER TABLE activities ADD result NVARCHAR(MAX);
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('activities') AND name = 'products_discussed')
    ALTER TABLE activities ADD products_discussed NVARCHAR(MAX);
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('activities') AND name = 'estimated_revenue')
    ALTER TABLE activities ADD estimated_revenue DECIMAL(12,2);
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('activities') AND name = 'expenses')
    ALTER TABLE activities ADD expenses DECIMAL(12,2);
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('activities') AND name = 'transport_mode')
    ALTER TABLE activities ADD transport_mode NVARCHAR(50);
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('activities') AND name = 'mileage')
    ALTER TABLE activities ADD mileage DECIMAL(10,2);
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('activities') AND name = 'follow_up_date')
    ALTER TABLE activities ADD follow_up_date DATETIME2;

-- ===== TOURS: 10 new columns =====
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tours') AND name = 'objective')
    ALTER TABLE tours ADD objective NVARCHAR(MAX);
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tours') AND name = 'tour_result')
    ALTER TABLE tours ADD tour_result NVARCHAR(MAX);
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tours') AND name = 'estimated_revenue')
    ALTER TABLE tours ADD estimated_revenue DECIMAL(12,2);
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tours') AND name = 'actual_revenue')
    ALTER TABLE tours ADD actual_revenue DECIMAL(12,2);
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tours') AND name = 'vehicle_type')
    ALTER TABLE tours ADD vehicle_type NVARCHAR(50);
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tours') AND name = 'fuel_cost')
    ALTER TABLE tours ADD fuel_cost DECIMAL(10,2);
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tours') AND name = 'total_expenses')
    ALTER TABLE tours ADD total_expenses DECIMAL(12,2);
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tours') AND name = 'start_time')
    ALTER TABLE tours ADD start_time DATETIME2;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tours') AND name = 'end_time')
    ALTER TABLE tours ADD end_time DATETIME2;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tours') AND name = 'follow_up_notes')
    ALTER TABLE tours ADD follow_up_notes NVARCHAR(MAX);