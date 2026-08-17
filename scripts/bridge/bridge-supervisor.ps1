<#
.SYNOPSIS
    PC-to-VPS TradingView CDP Bridge Supervisor for Windows.
.DESCRIPTION
    Runs in the background and continuously maintains a reverse SSH tunnel mapping
    PC 127.0.0.1:9333 (TradingView CDP) to VPS 127.0.0.1:9333 (loopback only).
    Automatically reconnects on network or VPS interruptions.
    Does NOT start, kill, or restart TradingView Desktop.
#>

[CmdletBinding()]
param (
    [string]$VpsHost = $env:TDV_VPS_HOST,
    [string]$VpsUser = $env:TDV_VPS_USER,
    [int]$VpsPort = $(if ($env:TDV_VPS_SSH_PORT) { [int]$env:TDV_VPS_SSH_PORT } else { 22 }),
    [string]$IdentityFile = $env:TDV_VPS_SSH_KEY,
    [int]$LocalCdpPort = 9333,
    [int]$RemoteCdpPort = 9333,
    [string]$LogFile = "$env:LOCALAPPDATA\tradingview-mcp\bridge.log"
)

if (-not $VpsHost) {
    Write-Error "VPS host is required. Set `$env:TDV_VPS_HOST or pass -VpsHost <hostname/ip>"
    exit 1
}

$logDir = [System.IO.Path]::GetDirectoryName($LogFile)
if ($logDir -and -not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir -Force | Out-Null
}

function Write-BridgeLog([string]$message) {
    $timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    $line = "[$timestamp] [CDP-BRIDGE] $message"
    Write-Output $line
    if ($LogFile) {
        Add-Content -Path $LogFile -Value $line -ErrorAction SilentlyContinue
    }
}

Write-BridgeLog "Starting TradingView CDP Reverse Bridge Supervisor"
Write-BridgeLog "Tunnel configuration: VPS 127.0.0.1:$RemoteCdpPort <- PC 127.0.0.1:$LocalCdpPort"
Write-BridgeLog "Target VPS: $(if ($VpsUser) { "$VpsUser@" })$VpsHost:$VpsPort"

$sshArgs = @(
    "-N",
    "-T",
    "-R", "127.0.0.1:${RemoteCdpPort}:127.0.0.1:${LocalCdpPort}",
    "-p", "$VpsPort",
    "-o", "ServerAliveInterval=15",
    "-o", "ServerAliveCountMax=3",
    "-o", "ExitOnForwardFailure=yes",
    "-o", "StrictHostKeyChecking=accept-new"
)

if ($IdentityFile -and (Test-Path $IdentityFile)) {
    $sshArgs += @("-i", $IdentityFile)
}

$destination = if ($VpsUser) { "$VpsUser@$VpsHost" } else { $VpsHost }
$sshArgs += $destination

$delay = 3
while ($true) {
    Write-BridgeLog "Connecting reverse bridge to $destination..."
    $proc = Start-Process -FilePath "ssh" -ArgumentList $sshArgs -NoNewWindow -PassThru -Wait
    $exitCode = $proc.ExitCode
    Write-BridgeLog "SSH bridge connection terminated with exit code $exitCode. Reconnecting in $delay seconds..."
    Start-Sleep -Seconds $delay
    $delay = [Math]::Min($delay * 2, 30)
}
