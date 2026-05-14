#Requires -RunAsAdministrator
<#
.SYNOPSIS
    Installe OptiCRM comme Windows Service (demarrage automatique)
.DESCRIPTION
    Cree un service Windows qui demarre Docker Compose automatiquement
    au demarrage du serveur, sans intervention manuelle.
    Prerequis : NSSM installe (Non-Sucking Service Manager)
.NOTES
    Telechargez NSSM : https://nssm.cc/download
    Placez nssm.exe dans C:\Windows\System32\ ou dans le meme dossier.
#>

param(
    [ValidateSet("install", "uninstall", "start", "stop")]
    [string]$Action = "install"
)

$ServiceName  = "OptiCRM"
$ServiceDesc  = "OptiCRM - Application CRM (Docker Compose)"
$ScriptDir    = Split-Path -Parent $MyInvocation.MyCommand.Path
$ComposeFile  = Join-Path $ScriptDir "docker-compose.prod.yml"
$EnvFile      = Join-Path $ScriptDir ".env.prod"
$LogDir       = Join-Path $ScriptDir "logs"

function Write-Info { param($m) Write-Host "[INFO] $m" -ForegroundColor Cyan }
function Write-OK   { param($m) Write-Host "[OK]   $m" -ForegroundColor Green }
function Write-Fail { param($m) Write-Host "[FAIL] $m" -ForegroundColor Red }

# Trouver NSSM
function Find-NSSM {
    $candidates = @(
        (Join-Path $ScriptDir "nssm.exe"),
        "C:\Windows\System32\nssm.exe",
        "C:\Tools\nssm\nssm.exe"
    )
    foreach ($c in $candidates) {
        if (Test-Path $c) { return $c }
    }

    # Essayer dans le PATH
    try {
        $nssmPath = Get-Command nssm -ErrorAction Stop | Select-Object -ExpandProperty Source
        return $nssmPath
    } catch {}

    return $null
}

switch ($Action) {
    "install" {
        Write-Info "Installation du service Windows '$ServiceName'..."

        $nssm = Find-NSSM
        if (-not $nssm) {
            Write-Fail "NSSM introuvable."
            Write-Host ""
            Write-Host "  1. Telechargez NSSM : https://nssm.cc/download" -ForegroundColor Yellow
            Write-Host "  2. Placez nssm.exe dans : $ScriptDir" -ForegroundColor Yellow
            Write-Host "  3. Relancez ce script." -ForegroundColor Yellow
            Write-Host ""
            Write-Host "  Alternative : Utilisez la tache planifiee ci-dessous." -ForegroundColor Cyan
            Write-Host "  .\install-service.ps1 -Action install (apres avoir place nssm.exe)" -ForegroundColor Cyan
            exit 1
        }

        Write-OK "NSSM trouve : $nssm"

        # Verifier si le service existe deja
        $existing = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
        if ($existing) {
            Write-Info "Service deja installe. Suppression de l'ancienne version..."
            & $nssm remove $ServiceName confirm
        }

        $dockerPath = (Get-Command docker -ErrorAction Stop).Source

        # Creer le service
        & $nssm install $ServiceName $dockerPath
        & $nssm set $ServiceName AppParameters "compose -f `"$ComposeFile`" --env-file `"$EnvFile`" up"
        & $nssm set $ServiceName AppDirectory $ScriptDir
        & $nssm set $ServiceName DisplayName $ServiceDesc
        & $nssm set $ServiceName Description $ServiceDesc
        & $nssm set $ServiceName Start SERVICE_AUTO_START
        & $nssm set $ServiceName AppStopMethodSkip 0
        & $nssm set $ServiceName AppStopMethodConsole 5000
        & $nssm set $ServiceName AppStopMethodWindow 5000
        & $nssm set $ServiceName AppStopMethodThreads 5000

        # Logs NSSM
        if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir -Force | Out-Null }
        & $nssm set $ServiceName AppStdout (Join-Path $LogDir "service-stdout.log")
        & $nssm set $ServiceName AppStderr (Join-Path $LogDir "service-stderr.log")
        & $nssm set $ServiceName AppRotateFiles 1
        & $nssm set $ServiceName AppRotateBytes 10485760  # 10 MB

        # Dependances (Docker doit etre demarre avant)
        & $nssm set $ServiceName DependOnService "Docker"

        Write-OK "Service '$ServiceName' installe."
        Write-Info "Demarrage du service..."
        Start-Service -Name $ServiceName
        Write-OK "Service demarre."

        Write-Host ""
        Write-Host "  Le service demarrera automatiquement au demarrage du serveur." -ForegroundColor Green
        Write-Host "  Gestion : services.msc  ou  sc query $ServiceName" -ForegroundColor Cyan
    }

    "uninstall" {
        $nssm = Find-NSSM
        if ($nssm) {
            Write-Info "Suppression du service '$ServiceName'..."
            Stop-Service -Name $ServiceName -Force -ErrorAction SilentlyContinue
            & $nssm remove $ServiceName confirm
            Write-OK "Service supprime."
        } else {
            $existing = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
            if ($existing) {
                Stop-Service -Name $ServiceName -Force -ErrorAction SilentlyContinue
                sc.exe delete $ServiceName
                Write-OK "Service supprime via sc.exe."
            } else {
                Write-Info "Aucun service '$ServiceName' trouve."
            }
        }
    }

    "start" {
        Start-Service -Name $ServiceName
        Write-OK "Service demarre."
    }

    "stop" {
        Stop-Service -Name $ServiceName -Force
        Write-OK "Service arrete."
    }
}
