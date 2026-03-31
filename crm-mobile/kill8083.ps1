$pids = Get-NetTCPConnection -LocalPort 8083 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess | Sort-Object -Unique | Where-Object { $_ -gt 0 }
foreach ($p in $pids) {
    Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
    Write-Host "Killed $p"
}
Start-Sleep 1
$remaining = (Get-NetTCPConnection -LocalPort 8083 -State Listen -ErrorAction SilentlyContinue).Count
Write-Host "Remaining: $remaining"
