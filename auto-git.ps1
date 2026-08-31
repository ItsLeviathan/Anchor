$repo = "D:\anchor"
$delay = 5

Write-Host "Auto Git Sync started for $repo" -ForegroundColor Green
Write-Host "Watching for file changes..." -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop." -ForegroundColor Yellow

$lastCommit = ""

while ($true) {
    Set-Location $repo

    $status = git status --porcelain

    if ($status) {
        Start-Sleep -Seconds $delay

        $statusAfterDelay = git status --porcelain

        if ($statusAfterDelay -and $statusAfterDelay -ne $lastCommit) {
            Write-Host "`nChanges detected. Syncing..." -ForegroundColor Cyan

            git add .

            $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            git commit -m "Auto-sync: $timestamp"

            if ($LASTEXITCODE -eq 0) {
                git push

                if ($LASTEXITCODE -eq 0) {
                    Write-Host "GitHub updated successfully." -ForegroundColor Green
                }
                else {
                    Write-Host "Push failed." -ForegroundColor Red
                }
            }

            $lastCommit = $statusAfterDelay
        }
    }

    Start-Sleep -Seconds 2
}