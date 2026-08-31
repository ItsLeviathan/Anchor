$repo = "D:\anchor"
$delay = 600

# OpenAI API key must be stored as an environment variable.
# In PowerShell, set it once with:
# [Environment]::SetEnvironmentVariable("OPENAI_API_KEY", "your-key", "User")

$apiKey = [Environment]::GetEnvironmentVariable("OPENAI_API_KEY", "User")

if (-not $apiKey) {
    Write-Host "ERROR: OPENAI_API_KEY is not configured." -ForegroundColor Red
    Write-Host "Set it with:" -ForegroundColor Yellow
    Write-Host '[Environment]::SetEnvironmentVariable("OPENAI_API_KEY", "your-key", "User")'
    exit 1
}

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " Anchor Automatic Git Sync" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Repository: $repo" -ForegroundColor Gray
Write-Host "Idle delay: $delay seconds" -ForegroundColor Gray
Write-Host ""
Write-Host "Watching for changes..." -ForegroundColor Green
Write-Host "Press Ctrl+C to stop." -ForegroundColor Yellow

function Get-AICommitMessage {
    param (
        [string]$Diff
    )
 
    $prompt = @"
You are generating a Git commit message for a software project called Anchor.

Analyze the following Git diff and determine what the developer actually changed.

Rules:
- Return ONLY the commit message.
- Use imperative mood.
- Keep it concise, ideally 3-7 words.
- Do not include quotes.
- Do not mention files unless useful.
- Do not use a period at the end.
- Examples:
  Add recurring task support
  Fix reminder scheduling
  Update dashboard layout
  Add expense tracking
  Fix authentication flow
  Update project dependencies

Git diff:
$Diff
"@

    $body = @{
        model = "gpt-4.1-mini"
        messages = @(
            @{
                role = "system"
                content = "You write concise, meaningful Git commit messages."
            },
            @{
                role = "user"
                content = $prompt
            }
        )
        temperature = 0.2
        max_tokens = 30
    } | ConvertTo-Json -Depth 10

    try {
        $response = Invoke-RestMethod `
            -Uri "https://api.openai.com/v1/chat/completions" `
            -Method Post `
            -Headers @{
                Authorization = "Bearer $apiKey"
                "Content-Type" = "application/json"
            } `
            -Body ([System.Text.Encoding]::UTF8.GetBytes($body))

        $message = $response.choices[0].message.content.Trim()

        # Remove accidental quotation marks
        $message = $message.Trim('"').Trim("'")

        if ($message.Length -gt 0) {
            return $message
        }

        return "Update project files"
    }
    catch {
        Write-Host "AI commit message generation failed." -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor DarkRed

        return "Update project files"
    }
}

while ($true) {

    Set-Location $repo

    # Check for changes
    $status = git status --porcelain

    if ($status) {

        Write-Host ""
        Write-Host "Changes detected. Waiting $delay seconds for you to finish..." -ForegroundColor Yellow

        Start-Sleep -Seconds $delay

        # Check again after waiting
        $statusAfterDelay = git status --porcelain

        if ($statusAfterDelay) {

            Write-Host ""
            Write-Host "Preparing automatic commit..." -ForegroundColor Cyan

            # Get the actual diff before staging
            $diff = git diff

            # Include untracked files in the description
            $untracked = git ls-files --others --exclude-standard

            if ($untracked) {
                $diff += "`n`nUntracked files:`n$($untracked -join "`n")"
            }

            # Limit enormous diffs
            if ($diff.Length -gt 30000) {
                $diff = $diff.Substring(0, 30000)
                $diff += "`n[Diff truncated]"
            }

            Write-Host "Generating commit message..." -ForegroundColor Magenta

            $commitMessage = Get-AICommitMessage -Diff $diff

            Write-Host ""
            Write-Host "Commit message:" -ForegroundColor Cyan
            Write-Host "  $commitMessage" -ForegroundColor White

            # Stage everything
            git add .

            if ($LASTEXITCODE -ne 0) {
                Write-Host "git add failed." -ForegroundColor Red
                Start-Sleep -Seconds 5
                continue
            }

            # Commit
            git commit -m $commitMessage

            if ($LASTEXITCODE -ne 0) {
                Write-Host "Commit failed." -ForegroundColor Red
                Start-Sleep -Seconds 5
                continue
            }

            # Push
            Write-Host ""
            Write-Host "Pushing to GitHub..." -ForegroundColor Cyan

            git push

            if ($LASTEXITCODE -eq 0) {
                Write-Host ""
                Write-Host "==========================================" -ForegroundColor Green
                Write-Host " GitHub updated successfully!" -ForegroundColor Green
                Write-Host " Commit: $commitMessage" -ForegroundColor Green
                Write-Host "==========================================" -ForegroundColor Green
            }
            else {
                Write-Host ""
                Write-Host "Push failed. Your commit is still saved locally." -ForegroundColor Red
            }

            Start-Sleep -Seconds 3
        }
    }

    Start-Sleep -Seconds 2
}