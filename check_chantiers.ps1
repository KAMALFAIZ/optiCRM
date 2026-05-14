$connStr = "Server=kasoft.selfip.net;Database=opticrm;User Id=sa;Password=SQL@2019;TrustServerCertificate=True;"
$conn = New-Object System.Data.SqlClient.SqlConnection($connStr)
$conn.Open()
$cmd = $conn.CreateCommand()

# Colonnes de Lieu_Livraison_Client
$cmd.CommandText = "SELECT COLUMN_NAME, DATA_TYPE FROM GROUPE_ALBOUGHAZE.INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Lieu_Livraison_Client' ORDER BY ORDINAL_POSITION"
$r = $cmd.ExecuteReader()
Write-Host "=== Colonnes Lieu_Livraison_Client ===" -ForegroundColor Cyan
while ($r.Read()) { Write-Host "  $($r.GetString(0))  [$($r.GetString(1))]" }
$r.Close()

# Apercu des données
$cmd.CommandText = "SELECT TOP 5 * FROM GROUPE_ALBOUGHAZE.dbo.Lieu_Livraison_Client"
$r = $cmd.ExecuteReader()
Write-Host "`n=== Apercu Lieu_Livraison_Client (5 lignes) ===" -ForegroundColor Yellow
$cols = @()
for ($i = 0; $i -lt $r.FieldCount; $i++) { $cols += $r.GetName($i) }
Write-Host ($cols -join " | ")
while ($r.Read()) {
    $vals = @()
    for ($i = 0; $i -lt $r.FieldCount; $i++) { $vals += "$($r.GetValue($i))" }
    Write-Host ($vals -join " | ")
}
$r.Close()

# Count
$cmd.CommandText = "SELECT COUNT(*) FROM GROUPE_ALBOUGHAZE.dbo.Lieu_Livraison_Client"
$r = $cmd.ExecuteReader()
if ($r.Read()) { Write-Host "`nTotal lignes: $($r.GetValue(0))" -ForegroundColor Green }
$r.Close()

$conn.Close()
