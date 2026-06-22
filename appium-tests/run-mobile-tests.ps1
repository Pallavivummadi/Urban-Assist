$env:Path = "C:\Users\palla\OneDrive\Desktop\pddtesting\node-bin;" + $env:Path

# Check if Appium port 4723 is listening
$portActive = $false
try {
    $conn = New-Object System.Net.Sockets.TcpClient("localhost", 4723)
    $conn.Close()
    $portActive = $true
} catch {}

$appiumProcess = $null
if (-not $portActive) {
    Write-Host "Starting Appium Server on port 4723..."
    $appiumProcess = Start-Process -FilePath "cmd.exe" -ArgumentList "/c npx appium" -WorkingDirectory "C:\Users\palla\AndroidStudioProjects\MyApplication\appium-tests" -PassThru -NoNewWindow
    # Wait for Appium to start
    Start-Sleep -Seconds 5
}

Write-Host "Executing Appium E2E Android Tests..."
Set-Location "C:\Users\palla\AndroidStudioProjects\MyApplication\appium-tests"
node test-runner.js

if ($appiumProcess -ne $null) {
    Write-Host "Stopping Appium Server..."
    Stop-Process -Id $appiumProcess.Id -Force
}
