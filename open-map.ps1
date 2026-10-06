$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$url = "http://127.0.0.1:5199/"

function Test-MapUp {
  try {
    $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 2
    return $response.StatusCode -eq 200
  } catch {
    return $false
  }
}

if (-not (Test-MapUp)) {
  Start-Process -FilePath "npm.cmd" -ArgumentList "run", "dev" -WorkingDirectory $root -WindowStyle Minimized
  $deadline = (Get-Date).AddSeconds(40)
  do {
    Start-Sleep -Milliseconds 500
    if (Test-MapUp) { break }
  } while ((Get-Date) -lt $deadline)
}

Start-Process $url
