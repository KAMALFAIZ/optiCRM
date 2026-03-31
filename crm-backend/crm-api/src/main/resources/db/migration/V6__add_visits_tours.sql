SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- =====================================================
-- V6: Add Visits and Tours tables for field operations
-- =====================================================

-- Table des visites terrain
CREATE TABLE visits (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    contact_id UNIQUEIDENTIFIER REFERENCES contacts(id),
    account_id UNIQUEIDENTIFIER REFERENCES accounts(id),
    visit_type NVARCHAR(50) NOT NULL,
    subject NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    visit_date DATETIME2 NOT NULL,
    duration INT,
    status NVARCHAR(50) DEFAULT 'planned',
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    address NVARCHAR(500),
    city NVARCHAR(100),
    check_in_at DATETIME2,
    check_out_at DATETIME2,
    notes NVARCHAR(MAX),
    outcome NVARCHAR(50),
    next_action NVARCHAR(MAX),
    assigned_to_id UNIQUEIDENTIFIER REFERENCES users(id),
    created_by_id UNIQUEIDENTIFIER REFERENCES users(id),
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE()
);

CREATE INDEX idx_visits_assigned ON visits(assigned_to_id);
CREATE INDEX idx_visits_date ON visits(visit_date);
CREATE INDEX idx_visits_status ON visits(status);
CREATE INDEX idx_visits_contact ON visits(contact_id);
CREATE INDEX idx_visits_account ON visits(account_id);

-- Table des tournées
CREATE TABLE tours (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    name NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    tour_date DATE NOT NULL,
    status NVARCHAR(50) DEFAULT 'draft',
    region NVARCHAR(100),
    assigned_to_id UNIQUEIDENTIFIER REFERENCES users(id),
    total_visits INT DEFAULT 0,
    completed_visits INT DEFAULT 0,
    total_distance DECIMAL(10,2),
    start_address NVARCHAR(500),
    end_address NVARCHAR(500),
    notes NVARCHAR(MAX),
    created_by_id UNIQUEIDENTIFIER REFERENCES users(id),
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE()
);

CREATE INDEX idx_tours_assigned ON tours(assigned_to_id);
CREATE INDEX idx_tours_date ON tours(tour_date);
CREATE INDEX idx_tours_status ON tours(status);

-- Table de liaison tournée <-> visites (ordonnées)
CREATE TABLE tour_visits (
    tour_id UNIQUEIDENTIFIER REFERENCES tours(id) ON DELETE CASCADE,
    visit_id UNIQUEIDENTIFIER REFERENCES visits(id) ON DELETE CASCADE,
    visit_order INT NOT NULL,
    PRIMARY KEY (tour_id, visit_id)
);

CREATE INDEX idx_tour_visits_tour ON tour_visits(tour_id);