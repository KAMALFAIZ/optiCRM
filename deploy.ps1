#Requires -RunAsAdministrator
<#
.SYNOPSIS
    Script de deploiement OptiCRM sur Windows Server
.DESCRIPTION
    Deploie l'application OptiCRM via Docker Compose en production.
    Prerequis : Docker Desktop (ou Docker Engine) installe et demarre.
.EXAMPLE
    .\deploy.ps1
    .\deploy.ps1 -Action build     # Build uniquement
    .\deploy.ps1 -Action start     # Demarrer les conteneurs
    .\deploy.ps1 -Action stop      # Arreter
    .\deploy.ps1 -Action logs      # Afficher les logs
    .\deploy.ps1 -Action status    # Etat des conteneurs
    .\deploy.ps1 -Action restart   # Redemarrer
    .\deploy.ps1 -Action update    # Mettre a jour (rebuild + restart)
#>

param(
    [ValidateSet("deploy", "build", "start", "stop", "logs", "status", "restart", "update", "backup-db")]
    [string]$Action = "deploy"
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$EnvFile = Join-Path $ScriptDir ".env.prod"
$ComposeFile = Join-Path $ScriptDir "docker-compose.prod.yml"

# --- Couleurs ---
function Write-Info  { param($msg) Write-Host "[INFO]  $msg" -ForegroundColor Cyan }
function Write-OK    { param($msg) Write-Host "[OK]    $msg" -ForegroundColor Green }
function Write-Warn  { param($msg) Write-Host "[WARN]  $msg" -ForegroundColor Yellow }
function Write-Fail  { param($msg) Write-Host "[FAIL]  $msg" -ForegroundColor Red }

function Write-Banner {
    Write-Host ""
    Write-Host "  ====================================" -ForegroundColor Blue
    Write-Host "       OptiCRM - Deploiement          " -ForegroundColor Blue
    Write-Host "  ====================================" -ForegroundColor Blue
    Write-Host ""
}

# --- Verifications prerequis ---
function Test-Prerequisites {
    Write-Info "Verification des prerequis..."

    # Docker
    try {
        $dockerVersion = docker --version 2>&1
        Write-OK "Docker: $dockerVersion"
    } catch {
        Write-Fail "Docker n'est pas installe ou non accessible dans le PATH."
        Write-Warn "Installez Docker Desktop depuis : https://docs.docker.com/desktop/install/windows/"
        exit 1
    }

    # Docker daemon
    try {
        docker info 2>&1 | Out-Null
        Write-OK "Docker daemon actif."
    } catch {
        Write-Fail "Le daemon Docker n'est pas demarre."
        Write-Warn "Demarrez Docker Desktop ou le service Docker Engine."
        exit 1
    }

    # Docker Compose
    try {
        $composeVersion = docker compose version 2>&1
        Write-OK "Docker Compose: $composeVersion"
    } catch {
        Write-Fail "Docker Compose n'est pas disponible."
        exit 1
    }

    # Fichier .env.prod
    if (-not (Test-Path $EnvFile)) {
        Write-Fail "Fichier .env.prod introuvable : $EnvFile"
        Write-Warn "Copiez .env.prod et remplissez les valeurs."
        exit 1
    }

    # Verifier les valeurs par defaut dans .env.prod
    $envContent = Get-Content $EnvFile -Raw
    if ($envContent -match "CHANGEZ_") {
        Write-Fail "Modifiez les mots de passe dans .env.prod avant de deployer !"
        Write-Warn "Remplacez toutes les valeurs contenant 'CHANGEZ_'"
        exit 1
    }

    Write-OK "Tous les prerequis sont satisfaits."
}

# --- Creer les repertoires necessaires ---
function Initialize-Directories {
    $dirs = @("logs", "uploads", "backups")
    foreach ($dir in $dirs) {
        $path = Join-Path $ScriptDir $dir
        if (-not (Test-Path $path)) {
            New-Item -ItemType Directory -Path $path -Force | Out-Null
            Write-OK "Repertoire cree : $path"
        }
    }
}

# --- Build ---
function Invoke-Build {
    Write-Info "Build des images Docker..."
    docker compose -f $ComposeFile --env-file $EnvFile build --no-cache
    if ($LASTEXITCODE -ne 0) { Write-Fail "Echec du build."; exit 1 }
    Write-OK "Build termine."
}

# --- Demarrer ---
function Invoke-Start {
    Write-Info "Demarrage des conteneurs..."
    docker compose -f $ComposeFile --env-file $EnvFile up -d
    if ($LASTEXITCODE -ne 0) { Write-Fail "Echec du demarrage."; exit 1 }

    Write-Info "Attente de la disponibilite des services (60s max)..."
    $timeout = 60
    $elapsed = 0
    do {
        Start-Sleep -Seconds 5
        $elapsed += 5
        Write-Host "." -NoNewline
    } while ($elapsed -lt $timeout)
    Write-Host ""

    Write-OK "Conteneurs demarres."
    Invoke-Status
}

# --- Arreter ---
function Invoke-Stop {
    Write-Info "Arret des conteneurs..."
    docker compose -f $ComposeFile --env-file $EnvFile down
    Write-OK "Conteneurs arretes."
}

# --- Etat ---
function Invoke-Status {
    Write-Info "Etat des services :"
    docker compose -f $ComposeFile --env-file $EnvFile ps
}

# --- Logs ---
function Invoke-Logs {
    docker compose -f $ComposeFile --env-file $EnvFile logs --tail=100 -f
}

# --- Backup base de donnees ---
function Invoke-BackupDb {
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupFile = Join-Path $ScriptDir "backups\opticrm_$timestamp.sql"

    $envVars = @{}
    Get-Content $EnvFile | Where-Object { $_ -match "^\s*([^#=]+)=(.+)" } | ForEach-Object {
        $parts = $_ -split "=", 2
        $envVars[$parts[0].Trim()] = $parts[1].Trim()
    }

    Write-Info "Backup PostgreSQL => $backupFile"
    docker exec opticrm-postgres pg_dump `
        -U $envVars["POSTGRES_USER"] `
        -d $envVars["POSTGRES_DB"] `
        --no-password > $backupFile

    if ($LASTEXITCODE -eq 0) {
        Write-OK "Backup cree : $backupFile"
    } else {
        Write-Fail "Echec du backup."
    }
}

# --- Mise a jour ---
function Invoke-Update {
    Invoke-BackupDb
    Write-Info "Mise a jour de l'application..."
    docker compose -f $ComposeFile --env-file $EnvFile pull 2>&1 | Out-Null
    Invoke-Build
    docker compose -f $ComposeFile --env-file $EnvFile up -d --remove-orphans
    Write-OK "Mise a jour terminee."
    Invoke-Status
}

# --- Main ---
Write-Banner
Set-Location $ScriptDir

switch ($Action) {
    "deploy" {
        Test-Prerequisites
        Initialize-Directories
        Invoke-Build
        Invoke-Start
        Write-Host ""
        Write-OK "=== OptiCRM deploye avec succes ! ==="
        Write-Host ""
        Write-Host "  Frontend  : http://localhost" -ForegroundColor Cyan
        Write-Host "  API       : http://localhost/api/v1" -ForegroundColor Cyan
        Write-Host "  Swagger   : http://localhost/swagger-ui.html" -ForegroundColor Cyan
        Write-Host ""
        Write-Warn "Pensez a configurer le pare-feu Windows pour ouvrir le port 80."
    }
    "build"     { Test-Prerequisites; Invoke-Build }
    "start"     { Invoke-Start }
    "stop"      { Invoke-Stop }
    "logs"      { Invoke-Logs }
    "status"    { Invoke-Status }
    "restart"   { Invoke-Stop; Invoke-Start }
    "update"    { Test-Prerequisites; Invoke-Update }
    "backup-db" { Invoke-BackupDb }
}
