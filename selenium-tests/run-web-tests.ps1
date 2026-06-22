$env:Path = "C:\Users\palla\OneDrive\Desktop\pddtesting\node-bin;" + $env:Path

# Check if port 8080 is listening
$portActive = $false
try {
    $conn = New-Object System.Net.Sockets.TcpClient("localhost", 8080)
    $conn.Close()
    $portActive = $true
} catch {}

$serverProcess = $null
if (-not $portActive) {
    Write-Host "Starting Vite development server on port 8080..."
    $serverProcess = Start-Process -FilePath "cmd.exe" -ArgumentList "/c npx vite dev --port 8080" -WorkingDirectory "C:\Users\palla\AndroidStudioProjects\MyApplication\city-flow-assist-main" -PassThru -NoNewWindow
    # Wait for server to start
    Start-Sleep -Seconds 10
}

Write-Host "Executing Selenium E2E Web Tests..."
Set-Location "C:\Users\palla\AndroidStudioProjects\MyApplication\selenium-tests"
node test-runner.js

if ($serverProcess -ne $null) {
    Write-Host "Stopping Vite development server..."
    Stop-Process -Id $serverProcess.Id -Force
}
