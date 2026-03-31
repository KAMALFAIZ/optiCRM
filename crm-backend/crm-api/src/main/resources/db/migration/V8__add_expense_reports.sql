SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- =====================================================
-- V8: Add Expense Reports (Notes de Frais) linked to Tours
-- =====================================================

CREATE TABLE expense_reports (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tour_id UNIQUEIDENTIFIER NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
    submitted_by_id UNIQUEIDENTIFIER NOT NULL REFERENCES users(id),
    report_number NVARCHAR(50) NOT NULL UNIQUE,
    status NVARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    title NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    currency NVARCHAR(3) NOT NULL DEFAULT 'MAD',
    submitted_at DATETIME2,
    approved_at DATETIME2,
    reimbursed_at DATETIME2,
    approved_by_id UNIQUEIDENTIFIER REFERENCES users(id),
    rejection_reason NVARCHAR(MAX),
    created_by_id UNIQUEIDENTIFIER REFERENCES users(id),
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE()
);

CREATE INDEX idx_expense_reports_tour ON expense_reports(tour_id);
CREATE INDEX idx_expense_reports_submitted_by ON expense_reports(submitted_by_id);
CREATE INDEX idx_expense_reports_status ON expense_reports(status);
CREATE INDEX idx_expense_reports_number ON expense_reports(report_number);

CREATE TABLE expense_report_lines (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    expense_report_id UNIQUEIDENTIFIER NOT NULL REFERENCES expense_reports(id) ON DELETE CASCADE,
    category NVARCHAR(50) NOT NULL,
    description NVARCHAR(500) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    expense_date DATE NOT NULL,
    receipt_url NVARCHAR(500),
    sort_order INT DEFAULT 0,
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

CREATE INDEX idx_expense_report_lines_report ON expense_report_lines(expense_report_id);