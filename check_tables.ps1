$connStr = "Server=kasoft.selfip.net;Database=opticrm;User Id=sa;Password=SQL@2019;TrustServerCertificate=True;"
$conn = New-Object System.Data.SqlClient.SqlConnection($connStr)
$conn.Open()
$cmd = $conn.CreateCommand()

# List all tables in GROUPE_ALBOUGHAZE
$cmd.CommandText = "SELECT TABLE_NAME FROM GROUPE_ALBOUGHAZE.INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE='BASE TABLE' ORDER BY TABLE_NAME"
$r = $cmd.ExecuteReader()
Write-Host "=== Tables GROUPE_ALBOUGHAZE ===" -ForegroundColor Cyan
while ($r.Read()) { Write-Host "  $($r.GetString(0))" }
$r.Close()

# Check for chantier-related columns in Clients table
$cmd.CommandText = "SELECT COLUMN_NAME FROM GROUPE_ALBOUGHAZE.INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Clients' AND (COLUMN_NAME LIKE '%hantier%' OR COLUMN_NAME LIKE '%ffaire%' OR COLUMN_NAME LIKE '%projet%' OR COLUMN_NAME LIKE '%Code%') ORDER BY ORDINAL_POSITION"
$r = $cmd.ExecuteReader()
Write-Host "`n=== Colonnes 'Code/Affaire/Chantier' dans Clients ===" -ForegroundColor Yellow
while ($r.Read()) { Write-Host "  $($r.GetString(0))" }
$r.Close()

$conn.Close()
