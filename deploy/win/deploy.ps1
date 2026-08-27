# =====================================================================
#  OptiCRM - Deploiement automatique (self-hosted GitHub Actions runner)
#  Appele par .github/workflows/deploy.yml sur push main.
#
#  Etapes : sync repo -> build frontend -> rebuild backend -> reload nginx
#           -> health check (rollback manuel via git si besoin).
#
#  Tourne en LocalSystem (service runner) : peut Stop/Start les services NSSM.
# =====================================================================
param(
  [string]$Root = "B:\OptiCRM",
  [string]$Sha  = ""
)

$ErrorActionPreference = "Stop"

# --- Outils (chemins fixes du serveur) -------------------------------
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-21.0.10+7"
$env:PATH      = "$env:JAVA_HOME\bin;$env:PATH"
$mvn           = "C:\apache-maven-3.9.6\bin\mvn.cmd"

$BackendSvc = "OptiCRM-Backend-V2"
$NginxSvc   = "OptiCRM-Nginx"
$HealthUrl  = "http://localhost:8082/actuator/health"

function Step($msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }

Step "Sync $Root sur origin/main ($Sha)"

# $Root est AUSSI le repertoire de developpement : le 'reset --hard' ci-dessous
# ecraserait tout travail non commite. On le met d'abord de cote dans un stash
# (recuperable via 'git stash list' / 'git stash apply') plutot que de le perdre.
$dirty = git -C $Root status --porcelain --untracked-files=no
if ($LASTEXITCODE -ne 0) { throw "git status a echoue" }
if ($dirty) {
  $stashMsg = "auto-deploy-backup $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') avant $Sha"
  Write-Host "ATTENTION : modifications non commitees detectees dans $Root :" -ForegroundColor Yellow
  $dirty | ForEach-Object { Write-Host "    $_" -ForegroundColor Yellow }
  git -C $Root stash push -m $stashMsg
  if ($LASTEXITCODE -ne 0) { throw "git stash a echoue - deploiement interrompu pour ne pas perdre le travail local" }
  Write-Host "Sauvegarde dans le stash : `"$stashMsg`" (restaurer avec : git -C $Root stash apply)" -ForegroundColor Yellow
}

git -C $Root fetch --all --prune
if ($LASTEXITCODE -ne 0) { throw "git fetch a echoue" }
git -C $Root reset --hard origin/main
if ($LASTEXITCODE -ne 0) { throw "git reset a echoue" }
git -C $Root rev-parse --short HEAD

# --- 1) Frontend : build (sans coupure, nginx sert dist/) ------------
Step "Build frontend (crm-web)"
Push-Location "$Root\crm-web"
try {
  npm ci
  if ($LASTEXITCODE -ne 0) { throw "npm ci a echoue" }
  npm run build
  if ($LASTEXITCODE -ne 0) { throw "npm run build a echoue" }
} finally { Pop-Location }

# --- 2) Backend : stop -> package -> start ---------------------------
Step "Arret du backend ($BackendSvc) pour deverrouiller le jar"
Stop-Service $BackendSvc -Force
$deadline = (Get-Date).AddSeconds(45)
while ((Get-Service $BackendSvc).Status -ne 'Stopped' -and (Get-Date) -lt $deadline) {
  Start-Sleep -Seconds 1
}
if ((Get-Service $BackendSvc).Status -ne 'Stopped') { throw "$BackendSvc ne s'est pas arrete" }

Step "Build backend (mvn clean package -DskipTests)"
Push-Location "$Root\crm-backend"
try {
  & $mvn clean package -DskipTests
  if ($LASTEXITCODE -ne 0) { throw "mvn package a echoue" }
} finally { Pop-Location }

Step "Demarrage du backend ($BackendSvc)"
Start-Service $BackendSvc

# --- 3) Nginx : reload via restart du service ------------------------
Step "Reload nginx ($NginxSvc)"
Restart-Service $NginxSvc

# --- 4) Health check ------------------------------------------------
Step "Health check $HealthUrl"
$ok = $false
for ($i = 1; $i -le 40; $i++) {
  try {
    $r = Invoke-RestMethod -Uri $HealthUrl -TimeoutSec 5
    if ($r.status -eq 'UP') { $ok = $true; break }
  } catch { }
  Start-Sleep -Seconds 3
}

if (-not $ok) {
  Write-Host "HEALTH CHECK ECHOUE - 40 dernieres lignes du log :" -ForegroundColor Red
  Get-Content "$Root\crm-backend\app.log" -Tail 40 -ErrorAction SilentlyContinue
  throw "Backend KO apres deploiement (health != UP)"
}

Write-Host "`nDeploiement OptiCRM OK ($Sha) - https://opticrm.kasoft.ma" -ForegroundColor Green
