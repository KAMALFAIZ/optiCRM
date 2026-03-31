$env:JAVA_HOME = 'C:\Program Files\Eclipse Adoptium\jdk-21.0.9.10-hotspot'
$env:PATH = $env:JAVA_HOME + '\bin;C:\Tools\apache-maven-3.9.6\bin;' + $env:PATH
Set-Location 'D:\OptiCRM\crm-backend'
$proc = Start-Process -FilePath 'C:\Tools\apache-maven-3.9.6\bin\mvn.cmd' -ArgumentList 'compile -q' -NoNewWindow -Wait -PassThru -RedirectStandardOutput 'D:\mvn_out3.txt' -RedirectStandardError 'D:\mvn_err3.txt'
Write-Host 'Exit code:' $proc.ExitCode
