<#
.SYNOPSIS
    Installs the TradingView CDP Bridge background supervisor as a Windows Scheduled Task.
#>

[CmdletBinding()]
param (
    [string]$TaskName = "TradingView-CDP-Bridge",
    [string]$VpsHost,
    [string]$VpsUser,
    [string]$IdentityFile
)

$scriptPath = Join-Path $PSScriptRoot "bridge-supervisor.ps1"
if (-not (Test-Path $scriptPath)) {
    Write-Error "Could not find $scriptPath"
    exit 1
}

$argList = "-WindowStyle Hidden -ExecutionPolicy Bypass -NoProfile -File `"$scriptPath`""
if ($VpsHost) { $argList += " -VpsHost `"$VpsHost`"" }
if ($VpsUser) { $argList += " -VpsUser `"$VpsUser`"" }
if ($IdentityFile) { $argList += " -IdentityFile `"$IdentityFile`"" }

$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument $argList
$trigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1) -ExecutionTimeLimit 0

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Force | Out-Null
Write-Host "Scheduled task '$TaskName' successfully registered to run on logon."
Write-Host "To start the task immediately, run: Start-ScheduledTask -TaskName `"$TaskName`""
