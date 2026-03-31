# Import chantiers from GROUPE_ALBOUGHAZE.Lieu_Livraison_Client -> opticrm.chantiers
$ErrorActionPreference = "Stop"
$connStr = "Server=kasoft.selfip.net;Database=opticrm;User Id=sa;Password=SQL@2019;TrustServerCertificate=True;"

$conn = New-Object System.Data.SqlClient.SqlConnection($connStr)
$conn.Open()
Write-Host "Connexion OK" -ForegroundColor Green

# ── 1. Lire les colonnes de Lieu_Livraison_Client via sys.columns
$cmd = $conn.CreateCommand()
$cmd.CommandText = "SELECT column_id, name FROM GROUPE_ALBOUGHAZE.sys.columns WHERE object_id = OBJECT_ID(N'GROUPE_ALBOUGHAZE.dbo.Lieu_Livraison_Client') ORDER BY column_id"
$r = $cmd.ExecuteReader()
$llcCols = @{}
while ($r.Read()) { $llcCols[$r.GetInt32(0)] = $r.GetString(1) }
$r.Close()

Write-Host "`nColonnes Lieu_Livraison_Client:" -ForegroundColor Cyan
$llcCols.GetEnumerator() | Sort-Object Key | Select-Object -First 15 | ForEach-Object { Write-Host "  [$($_.Key)] $($_.Value)" }

# ── 2. Identifier les colonnes nécessaires
function FindCol($dict, $patterns) {
    foreach ($p in $patterns) {
        $found = $dict.Values | Where-Object { $_ -like "*$p*" } | Select-Object -First 1
        if ($found) { return $found }
    }
    return $null
}

$colCodeClient    = FindCol $llcCols @("Code client")
$colIntitule      = FindCol $llcCols @("Intitule livraison")
$colAdresse       = FindCol $llcCols @("Adresse")
$colCodePostal    = FindCol $llcCols @("Code postal")
$colDbId          = FindCol $llcCols @("DB_Id")

# Préférer match exact pour Ville et Région (éviter "Ville collaborateur", "Région collaborateur")
$colVille  = ($llcCols.Values | Where-Object { $_ -eq "Ville" } | Select-Object -First 1)
if (-not $colVille) { $colVille = FindCol $llcCols @("Ville") }
$colRegion = ($llcCols.Values | Where-Object { $_ -match "^R.gion$" } | Select-Object -First 1)
if (-not $colRegion) { $colRegion = FindCol $llcCols @("gion") }

Write-Host "`nMapping colonnes:" -ForegroundColor Yellow
Write-Host "  Code client      : $colCodeClient"
Write-Host "  Intitule livraison: $colIntitule"
Write-Host "  Ville            : $colVille"
Write-Host "  Region           : $colRegion"
Write-Host "  DB_Id            : $colDbId"

# ── 3. Construire et exécuter la requête MERGE
$sqlMerge = @"
SET NOCOUNT ON;

-- Compter la source
SELECT COUNT(DISTINCT LTRIM(RTRIM([$colIntitule])) + '|' + LTRIM(RTRIM([$colCodeClient])))
       AS [Chantiers source distincts]
FROM GROUPE_ALBOUGHAZE.dbo.Lieu_Livraison_Client
WHERE [$colIntitule] IS NOT NULL AND LTRIM(RTRIM([$colIntitule])) <> ''
  AND [$colCodeClient] IS NOT NULL AND LTRIM(RTRIM([$colCodeClient])) <> '';

-- MERGE chantiers
WITH src AS (
    SELECT
        LTRIM(RTRIM(ll.[$colIntitule])) COLLATE DATABASE_DEFAULT          AS nom,
        LTRIM(RTRIM(ll.[$colCodeClient])) COLLATE DATABASE_DEFAULT        AS sage_code,
        NULLIF(LTRIM(RTRIM(ll.[$colVille])), '') COLLATE DATABASE_DEFAULT AS ville,
        NULLIF(LTRIM(RTRIM(ll.[$colRegion])), '') COLLATE DATABASE_DEFAULT AS prefecture,
        a.id                                                               AS account_id,
        ROW_NUMBER() OVER (
            PARTITION BY LTRIM(RTRIM(ll.[$colIntitule])), a.id
            ORDER BY ll.[$colDbId]
        ) AS rn
    FROM GROUPE_ALBOUGHAZE.dbo.Lieu_Livraison_Client ll
    INNER JOIN dbo.accounts a
        ON a.sage_code = LTRIM(RTRIM(ll.[$colCodeClient])) COLLATE DATABASE_DEFAULT
    WHERE ll.[$colIntitule] IS NOT NULL
      AND LTRIM(RTRIM(ll.[$colIntitule])) <> ''
      AND ll.[$colCodeClient] IS NOT NULL
      AND LTRIM(RTRIM(ll.[$colCodeClient])) <> ''
)
MERGE INTO dbo.chantiers AS tgt
USING (SELECT * FROM src WHERE rn = 1) AS s
ON tgt.account_id = s.account_id
AND tgt.nom = s.nom

WHEN MATCHED THEN
    UPDATE SET
        tgt.ville       = COALESCE(s.ville, tgt.ville),
        tgt.prefecture  = COALESCE(s.prefecture, tgt.prefecture),
        tgt.updated_at  = GETUTCDATE()

WHEN NOT MATCHED BY TARGET THEN
    INSERT (
        id, nom, ville, prefecture,
        statut_chantier,
        account_id,
        created_at, updated_at
    )
    VALUES (
        NEWID(), s.nom, s.ville, s.prefecture,
        N'ACTIF',
        s.account_id,
        GETUTCDATE(), GETUTCDATE()
    )

OUTPUT
    inserted.id        AS chantier_id,
    inserted.nom       AS nom,
    deleted.id         AS updated_id;

-- Résumé final
SELECT
    COUNT(*)                                                AS [Total chantiers],
    SUM(CASE WHEN statut_chantier = 'ACTIF' THEN 1 ELSE 0 END) AS [Actifs],
    COUNT(DISTINCT account_id)                             AS [Comptes liés]
FROM dbo.chantiers;
"@

Write-Host "`nExecution du MERGE chantiers..." -ForegroundColor Cyan

try {
    $cmd2 = $conn.CreateCommand()
    $cmd2.CommandText = $sqlMerge
    $cmd2.CommandTimeout = 300

    $reader2 = $cmd2.ExecuteReader()
    $inserted = 0; $updated = 0; $resultNum = 0

    do {
        $resultNum++
        while ($reader2.Read()) {
            if ($resultNum -eq 1) {
                Write-Host "  Source: $($reader2.GetValue(0)) chantiers distincts" -ForegroundColor White
            } elseif ($resultNum -eq 2) {
                # OUTPUT du MERGE
                $updId = $reader2.GetValue(2)
                if ($updId -eq [System.DBNull]::Value) { $inserted++ }
                else { $updated++ }
            } elseif ($resultNum -eq 3) {
                Write-Host "  Total chantiers dans OptiCRM : $($reader2.GetValue(0))" -ForegroundColor White
                Write-Host "  Chantiers actifs             : $($reader2.GetValue(1))" -ForegroundColor White
                Write-Host "  Comptes clients liés         : $($reader2.GetValue(2))" -ForegroundColor White
            }
        }
    } while ($reader2.NextResult())

    $reader2.Close()

    Write-Host "`n================================================" -ForegroundColor Green
    Write-Host "  Import chantiers terminé!" -ForegroundColor Green
    Write-Host "  Insérés   : $inserted" -ForegroundColor Green
    Write-Host "  Mis à jour: $updated" -ForegroundColor Yellow
    Write-Host "================================================" -ForegroundColor Green
}
catch {
    Write-Host "ERREUR MERGE: $_" -ForegroundColor Red
}

$conn.Close()
