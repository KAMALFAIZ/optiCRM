# Import accounts from GROUPE_ALBOUGHAZE -> opticrm
# Uses dynamic SQL built from sys.columns to avoid encoding issues

$ErrorActionPreference = "Stop"
$connStr = "Server=kasoft.selfip.net;Database=opticrm;User Id=sa;Password=SQL@2019;TrustServerCertificate=True;"

# Step 1: Get exact column names from source DB to build dynamic SQL
$sqlGetCols = @'
SELECT
    col_ca.name AS ca_col,
    col_cl.name AS cl_col
FROM GROUPE_ALBOUGHAZE.sys.tables t_ca
CROSS JOIN GROUPE_ALBOUGHAZE.sys.tables t_cl
INNER JOIN GROUPE_ALBOUGHAZE.sys.columns col_ca ON col_ca.object_id = t_ca.object_id
INNER JOIN GROUPE_ALBOUGHAZE.sys.columns col_cl ON col_cl.object_id = t_cl.object_id
WHERE t_ca.name = 'chiffre_Affaires_Groupe'
  AND t_cl.name = 'Clients'
  AND (
    col_ca.name IN (
        SELECT c.name FROM GROUPE_ALBOUGHAZE.sys.columns c
        INNER JOIN GROUPE_ALBOUGHAZE.sys.tables t ON c.object_id = t.object_id
        WHERE t.name = 'chiffre_Affaires_Groupe'
        AND c.column_id IN (
            SELECT column_id FROM GROUPE_ALBOUGHAZE.sys.columns ca2
            INNER JOIN GROUPE_ALBOUGHAZE.sys.tables t2 ON ca2.object_id = t2.object_id
            WHERE t2.name = 'chiffre_Affaires_Groupe'
        )
    )
  )
'@

# Simpler: just get all column names from both tables
$sqlCols1 = "SELECT column_id, name FROM GROUPE_ALBOUGHAZE.sys.columns WHERE object_id = OBJECT_ID(N'GROUPE_ALBOUGHAZE.dbo.chiffre_Affaires_Groupe') ORDER BY column_id"
$sqlCols2 = "SELECT column_id, name FROM GROUPE_ALBOUGHAZE.sys.columns WHERE object_id = OBJECT_ID(N'GROUPE_ALBOUGHAZE.dbo.Clients') ORDER BY column_id"

$conn = New-Object System.Data.SqlClient.SqlConnection($connStr)
$conn.Open()
Write-Host "Connexion OK" -ForegroundColor Green

# Get CA columns
$cmd = $conn.CreateCommand()
$cmd.CommandText = $sqlCols1
$r = $cmd.ExecuteReader()
$caCols = @{}
while ($r.Read()) { $caCols[$r.GetInt32(0)] = $r.GetString(1) }
$r.Close()

# Get Clients columns
$cmd.CommandText = $sqlCols2
$r = $cmd.ExecuteReader()
$clCols = @{}
while ($r.Read()) { $clCols[$r.GetInt32(0)] = $r.GetString(1) }
$r.Close()

# Display for debug
Write-Host "`nColonnes chiffre_Affaires_Groupe:" -ForegroundColor Cyan
$caCols.GetEnumerator() | Sort-Object Key | ForEach-Object { Write-Host "  [$($_.Key)] $($_.Value)" }

# Find needed columns by approximate match
function FindCol($dict, $patterns) {
    foreach ($p in $patterns) {
        $found = $dict.Values | Where-Object { $_ -like "*$p*" } | Select-Object -First 1
        if ($found) { return $found }
    }
    return $null
}

$colCodeClient   = FindCol $caCols @("Code client")
$colIntitule     = FindCol $caCols @("Intitul")
$colCategorie    = FindCol $caCols @("Cat")
$colRepresentant = FindCol $caCols @("pr")
$colRegion       = FindCol $caCols @("gion")
# Prefer "Region" without "carte"
$regionExact = $caCols.Values | Where-Object { $_ -match "^R.gion$" } | Select-Object -First 1
if ($regionExact) { $colRegion = $regionExact }
$colVilleCA      = FindCol $caCols @("Ville")

$colAdresse      = FindCol $clCols @("Adresse")
$colVille        = FindCol $clCols @("Ville")
$colCodePostal   = FindCol $clCols @("Code postal")
$colRC           = FindCol $clCols @("RC_")
$colIdFiscal     = FindCol $clCols @("Identifiant fiscal")
$colICE          = FindCol $clCols @("ICE_")

Write-Host "`nMapping colonnes:" -ForegroundColor Yellow
Write-Host "  Code client   : $colCodeClient"
Write-Host "  Intitule      : $colIntitule"
Write-Host "  Categorie     : $colCategorie"
Write-Host "  Representant  : $colRepresentant"
Write-Host "  Region        : $colRegion"
Write-Host "  Adresse       : $colAdresse"
Write-Host "  Ville         : $colVille"
Write-Host "  Code postal   : $colCodePostal"
Write-Host "  RC            : $colRC"
Write-Host "  Id fiscal     : $colIdFiscal"
Write-Host "  ICE           : $colICE"

# Build and execute the MERGE using QUOTENAME for safe column references
$sqlMerge = @"
SET NOCOUNT ON;

-- Source count
SELECT COUNT(DISTINCT ca.$(if($colCodeClient){"[$colCodeClient]"}else{"[Code client]"})) AS [Clients source]
FROM GROUPE_ALBOUGHAZE.dbo.chiffre_Affaires_Groupe ca
INNER JOIN GROUPE_ALBOUGHAZE.dbo.Clients c
    ON ca.[DB_Id] = c.[DB_Id]
    AND ca.$(if($colCodeClient){"[$colCodeClient]"}else{"[Code client]"}) = c.$(if($colCodeClient){"[$colCodeClient]"}else{"[Code client]"});

-- MERGE
WITH src AS (
    SELECT DISTINCT
        LTRIM(RTRIM(ca.[$colCodeClient])) COLLATE DATABASE_DEFAULT           AS sage_code,
        LTRIM(RTRIM(ca.[$colIntitule]))   COLLATE DATABASE_DEFAULT           AS account_name,
        LTRIM(RTRIM(ca.[$colCategorie]))  COLLATE DATABASE_DEFAULT           AS categorie_client,
        LTRIM(RTRIM(ca.[$colRepresentant])) COLLATE DATABASE_DEFAULT         AS representant,
        LTRIM(RTRIM(ca.[$colRegion]))     COLLATE DATABASE_DEFAULT           AS billing_state,
        LTRIM(RTRIM(c.[$colAdresse]))     COLLATE DATABASE_DEFAULT           AS billing_street,
        LTRIM(RTRIM(c.[$colVille]))       COLLATE DATABASE_DEFAULT           AS billing_city,
        LTRIM(RTRIM(c.[$colCodePostal]))  COLLATE DATABASE_DEFAULT           AS billing_postal_code,
        LTRIM(RTRIM(c.[$colRC]))          COLLATE DATABASE_DEFAULT           AS rc,
        LTRIM(RTRIM(c.[$colIdFiscal]))    COLLATE DATABASE_DEFAULT           AS identifiant_fiscal,
        LTRIM(RTRIM(REPLACE(REPLACE(c.[$colICE] COLLATE DATABASE_DEFAULT, 'ICE / ', ''), 'ICE', ''))) AS ice,
        ROW_NUMBER() OVER (PARTITION BY ca.[$colCodeClient] ORDER BY ca.[$colIntitule]) AS rn
    FROM GROUPE_ALBOUGHAZE.dbo.chiffre_Affaires_Groupe ca
    INNER JOIN GROUPE_ALBOUGHAZE.dbo.Clients c
        ON ca.[DB_Id] = c.[DB_Id]
        AND ca.[$colCodeClient] COLLATE DATABASE_DEFAULT = c.[$colCodeClient] COLLATE DATABASE_DEFAULT
    WHERE ca.[$colCodeClient] IS NOT NULL
      AND LTRIM(RTRIM(ca.[$colCodeClient])) <> ''
      AND ca.[$colIntitule] IS NOT NULL
      AND LTRIM(RTRIM(ca.[$colIntitule])) <> ''
)
MERGE INTO dbo.accounts AS tgt
USING (SELECT * FROM src WHERE rn = 1) AS s
ON tgt.sage_code = s.sage_code

WHEN MATCHED THEN
    UPDATE SET
        tgt.name                = s.account_name,
        tgt.categorie_client    = NULLIF(s.categorie_client, ''),
        tgt.representant        = NULLIF(s.representant, ''),
        tgt.billing_state       = NULLIF(s.billing_state, ''),
        tgt.billing_street      = NULLIF(s.billing_street, ''),
        tgt.billing_city        = NULLIF(s.billing_city, ''),
        tgt.billing_postal_code = NULLIF(s.billing_postal_code, ''),
        tgt.billing_country     = COALESCE(tgt.billing_country, N'Maroc'),
        tgt.rc                  = NULLIF(s.rc, ''),
        tgt.identifiant_fiscal  = NULLIF(s.identifiant_fiscal, ''),
        tgt.ice                 = NULLIF(s.ice, ''),
        tgt.sage_synced_at      = GETUTCDATE(),
        tgt.updated_at          = GETUTCDATE()

WHEN NOT MATCHED BY TARGET THEN
    INSERT (
        id, name, account_type, sage_code,
        categorie_client, representant,
        billing_street, billing_city, billing_postal_code, billing_state, billing_country,
        rc, identifiant_fiscal, ice,
        sage_synced_at, created_at, updated_at
    )
    VALUES (
        NEWID(), s.account_name, N'CLIENT', s.sage_code,
        NULLIF(s.categorie_client, ''), NULLIF(s.representant, ''),
        NULLIF(s.billing_street, ''), NULLIF(s.billing_city, ''),
        NULLIF(s.billing_postal_code, ''), NULLIF(s.billing_state, ''),
        N'Maroc',
        NULLIF(s.rc, ''), NULLIF(s.identifiant_fiscal, ''), NULLIF(s.ice, ''),
        GETUTCDATE(), GETUTCDATE(), GETUTCDATE()
    )
OUTPUT inserted.sage_code, inserted.name, deleted.sage_code AS updated_code;

-- Final count
SELECT COUNT(*) AS [Total accounts CLIENT dans OptiCRM]
FROM dbo.accounts
WHERE account_type = N'CLIENT' AND sage_code IS NOT NULL;
"@

Write-Host "`nExecution du MERGE..." -ForegroundColor Cyan

try {
    $cmd2 = $conn.CreateCommand()
    $cmd2.CommandText = $sqlMerge
    $cmd2.CommandTimeout = 300

    $reader2 = $cmd2.ExecuteReader()
    $inserted = 0; $updated = 0; $resultNum = 0

    do {
        $resultNum++
        $hasRows = $false
        while ($reader2.Read()) {
            $hasRows = $true
            if ($resultNum -eq 1) {
                Write-Host "  Source: $($reader2.GetValue(0)) clients distincts" -ForegroundColor White
            } elseif ($resultNum -eq 2) {
                # OUTPUT rows from MERGE
                $newCode = $reader2.GetValue(0)
                $updCode = $reader2.GetValue(2)
                if ($updCode -eq [System.DBNull]::Value) { $inserted++ }
                else { $updated++ }
            } elseif ($resultNum -eq 3) {
                Write-Host "  Total dans OptiCRM: $($reader2.GetValue(0))" -ForegroundColor White
            }
        }
    } while ($reader2.NextResult())

    $reader2.Close()

    Write-Host "`n================================================" -ForegroundColor Green
    Write-Host "  Import termine!" -ForegroundColor Green
    Write-Host "  Inseres  : $inserted" -ForegroundColor Green
    Write-Host "  Mis a jour: $updated" -ForegroundColor Yellow
    Write-Host "================================================" -ForegroundColor Green
}
catch {
    Write-Host "ERREUR MERGE: $_" -ForegroundColor Red
}

$conn.Close()
