<#
.SYNOPSIS
    Unregisters the TradingView CDP Bridge Windows Scheduled Task.
#>

[CmdletBinding()]
param (
    [string]$TaskName = "TradingView-CDP-Bridge"
)

if (Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue) {
    Stop-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false | Out-Null
    Write-Host "Scheduled task '$TaskName' has been removed."
} else {
    Write-Host "Scheduled task '$TaskName' is not installed."
}
