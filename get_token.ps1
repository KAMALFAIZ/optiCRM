$connStr = "Server=localhost;Database=opticrm;User Id=sa;Password=SQL@2019;TrustServerCertificate=True;"
$conn = New-Object System.Data.SqlClient.SqlConnection($connStr)
$conn.Open()
$cmd = $conn.CreateCommand()
$cmd.CommandText = "SELECT TOP 1 token, user_id FROM dbo.password_reset_tokens ORDER BY expires_at DESC"
$r = $cmd.ExecuteReader()
while ($r.Read()) { 
    Write-Host "Token: $($r.GetString(0))"
}
$r.Close()
$conn.Close()
