SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- Sales order line items (for bon de commande)
IF OBJECT_ID('sales_order_lines', 'U') IS NULL
BEGIN
CREATE TABLE sales_order_lines (
    id              UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    sales_order_id  UNIQUEIDENTIFIER NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
    product_id      UNIQUEIDENTIFIER REFERENCES products(id) ON DELETE SET NULL,
    product_code    NVARCHAR(50),
    product_name    NVARCHAR(255) NOT NULL,
    description     NVARCHAR(MAX),
    quantity        DECIMAL(15,3) NOT NULL DEFAULT 1,
    unit_price      DECIMAL(15,2) NOT NULL DEFAULT 0,
    unit_of_measure NVARCHAR(30) DEFAULT 'unité',
    discount_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
    discount_amount  DECIMAL(15,2) NOT NULL DEFAULT 0,
    tax_rate        DECIMAL(5,2) NOT NULL DEFAULT 0,
    tax_amount      DECIMAL(15,2) NOT NULL DEFAULT 0,
    line_total      DECIMAL(15,2) NOT NULL DEFAULT 0,
    sort_order      INTEGER DEFAULT 0,
    created_at      DATETIMEOFFSET DEFAULT GETUTCDATE()
)
END;

IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_sol_order' AND object_id = OBJECT_ID('sales_order_lines'))
    CREATE INDEX idx_sol_order ON sales_order_lines(sales_order_id);