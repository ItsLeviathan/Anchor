<#
.SYNOPSIS
    Anchor Auto-Git Watcher.

.DESCRIPTION
    Watches the Anchor repo for changes. After $IdleMinutes of inactivity
    (no new changes showing up in `git status`), it stages everything,
    builds a commit message from a local heuristic (no AI API, no key
    needed), commits, and pushes to the tracked remote branch.

    Safe to leave running: if there is nothing to commit it just keeps
    polling quietly. If a push fails (e.g. no network, remote ahead) it
    keeps the commit local and retries the push on the next cycle instead
    of losing work or looping.

.PARAMETER RepoPath
    Path to the Anchor repo. Defaults to D:\anchor.

.PARAMETER IdleMinutes
    Minutes of inactivity required before an auto-commit fires. Defaults to 10.

.PARAMETER PollSeconds
    How often to check git status, in seconds. Defaults to 15.

.PARAMETER Branch
    Branch to push. Used only as a safety check (see Invoke-AutoCommitAndPush) —
    the actual push uses plain `git push`, relying on the tracking branch
    already configured for main. Defaults to "main".
#>

param(
    [string]$RepoPath   = "D:\anchor",
    [int]   $IdleMinutes = 10,
    [int]   $PollSeconds = 15,
    [string]$Branch      = "main"
)

$ErrorActionPreference = "Stop"

$logDir   = Join-Path $RepoPath ".auto-git"
$logFile  = Join-Path $logDir "auto-git.log"
$lockFile = Join-Path $logDir "watcher.lock"
New-Item -ItemType Directory -Path $logDir -Force | Out-Null

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $line = "[{0}] [{1}] {2}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $Level, $Message
    Add-Content -Path $logFile -Value $line
    Write-Host $line
}

function Get-Humanized {
    # Turns "RecurringTaskModal.jsx" or "recurring-task-modal" into "recurring task modal"
    param([string]$Path)
    $name = [System.IO.Path]::GetFileNameWithoutExtension($Path)
    $spaced = $name -creplace '([a-z0-9])([A-Z])', '$1 $2'
    $spaced = $spaced -replace '[-_]', ' '
    return $spaced.ToLower().Trim()
}

function Get-SmartCommitMessage {
    # Stages everything, then inspects what's staged to build a
    # "<Verb> <affected area>" subject plus a short breakdown body.
    param([string]$RepoPath)

    Push-Location $RepoPath
    try {
        git add -A | Out-Null

        $nameStatus = git diff --cached --name-status
        if (-not $nameStatus) { return $null }

        $added = @(); $modified = @(); $deleted = @(); $renamed = @()

        foreach ($line in ($nameStatus -split "`n")) {
            if (-not $line.Trim()) { continue }
            $parts = $line -split "`t"
            $code = $parts[0]
            switch -Regex ($code) {
                '^A' { $added    += $parts[1] }
                '^M' { $modified += $parts[1] }
                '^D' { $deleted  += $parts[1] }
                '^R' { $renamed  += $parts[-1] }
                default { $modified += $parts[1] }
            }
        }

        $allFiles = $added + $modified + $deleted + $renamed

        # ---- Verb ----
        $verb = "Update"
        if ($added.Count -gt 0 -and $modified.Count -eq 0 -and $deleted.Count -eq 0 -and $renamed.Count -eq 0) {
            $verb = "Add"
        } elseif ($deleted.Count -gt 0 -and $added.Count -eq 0 -and $modified.Count -eq 0 -and $renamed.Count -eq 0) {
            $verb = "Remove"
        } elseif ($renamed.Count -gt 0 -and $added.Count -eq 0 -and $modified.Count -eq 0 -and $deleted.Count -eq 0) {
            $verb = "Rename"
        } else {
            $fullDiff   = git diff --cached
            $addedLines = ($fullDiff -split "`n") | Where-Object { $_ -match '^\+[^+]' }
            $fixHits    = ($addedLines -join "`n") | Select-String -Pattern '\b(fix(es|ed)?|bug|error handling|catch\s*\()\b' -AllMatches
            if ($fixHits -and $fixHits.Matches.Count -ge 2) {
                $verb = "Fix"
            }
        }

        # ---- Scope (which area of the project this touches) ----
        $dirCounts = @{}
        foreach ($f in $allFiles) {
            $dir = Split-Path $f -Parent
            if (-not $dir) { $dir = "." }
            $segments = $dir -split '[\\/]'
            $top = $segments[0..([Math]::Min(1, $segments.Count - 1))] -join '/'
            if (-not $dirCounts.ContainsKey($top)) { $dirCounts[$top] = 0 }
            $dirCounts[$top]++
        }
        $primaryDir = ($dirCounts.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 1).Key

        if ($allFiles.Count -eq 1) {
            $scope = Get-Humanized $allFiles[0]
        } elseif ($primaryDir -and $primaryDir -ne "." -and $primaryDir -ne "") {
            $scope = Get-Humanized $primaryDir
        } else {
            $scope = "project files"
        }

        $subject = "$verb $scope".Trim()
        if ($subject.Length -gt 72) { $subject = $subject.Substring(0, 69) + "..." }
        $subject = $subject.Substring(0,1).ToUpper() + $subject.Substring(1)

        $bodyLines = @()
        if ($added.Count    -gt 0) { $bodyLines += "Added: $($added.Count) file(s)" }
        if ($modified.Count -gt 0) { $bodyLines += "Modified: $($modified.Count) file(s)" }
        if ($deleted.Count  -gt 0) { $bodyLines += "Deleted: $($deleted.Count) file(s)" }
        if ($renamed.Count  -gt 0) { $bodyLines += "Renamed: $($renamed.Count) file(s)" }

        return @{
            Subject = $subject
            Body    = ($bodyLines -join "`n")
        }
    } finally {
        Pop-Location
    }
}

function Invoke-AutoCommitAndPush {
    param([string]$RepoPath, [string]$Branch)

    Push-Location $RepoPath
    try {
        $currentBranch = git rev-parse --abbrev-ref HEAD
        if ($currentBranch -ne $Branch) {
            Write-Log "On branch '$currentBranch', not '$Branch'. Skipping auto-commit for safety." "WARN"
            return $true   # not a push failure, just don't touch it
        }
    } finally {
        Pop-Location
    }

    $msg = Get-SmartCommitMessage -RepoPath $RepoPath
    if (-not $msg) {
        Write-Log "Nothing staged after 'git add -A'; skipping commit."
        return $true
    }

    Push-Location $RepoPath
    try {
        if ($msg.Body) {
            git commit -m $msg.Subject -m $msg.Body | Out-Null
        } else {
            git commit -m $msg.Subject | Out-Null
        }
        Write-Log "Committed: $($msg.Subject)"

        $pushOutput = git push 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Log "Push failed, will retry next cycle. Output: $pushOutput" "WARN"
            return $false
        }
        Write-Log "Pushed to origin/$Branch."
        return $true
    } finally {
        Pop-Location
    }
}

# ---------------- Main ----------------

if (-not (Test-Path (Join-Path $RepoPath ".git"))) {
    Write-Log "No .git folder found at $RepoPath. Exiting." "ERROR"
    exit 1
}

if (Test-Path $lockFile) {
    $existingPid = Get-Content $lockFile -ErrorAction SilentlyContinue
    if ($existingPid -and (Get-Process -Id $existingPid -ErrorAction SilentlyContinue)) {
        Write-Log "Watcher already running (PID $existingPid). Exiting this instance."
        exit 0
    }
}
Set-Content -Path $lockFile -Value $PID

Write-Log "Anchor Auto-Git Watcher started. Repo: $RepoPath | Idle: $IdleMinutes min | Poll: $PollSeconds sec | PID: $PID"

try {
    $idleThreshold  = New-TimeSpan -Minutes $IdleMinutes
    $lastStatus     = $null
    $lastChangeTime = Get-Date
    $pendingPush    = $false

    while ($true) {
        Start-Sleep -Seconds $PollSeconds

        if ($pendingPush) {
            Push-Location $RepoPath
            git push 2>&1 | Out-Null
            $ok = ($LASTEXITCODE -eq 0)
            Pop-Location
            if ($ok) {
                Write-Log "Retried push succeeded."
                $pendingPush = $false
            }
            continue
        }

        $status = git -C $RepoPath status --porcelain

        if ($status -ne $lastStatus) {
            if ($null -ne $lastStatus -and $status) {
                Write-Log "Change detected, idle timer reset."
            }
            $lastChangeTime = Get-Date
            $lastStatus = $status
            continue
        }

        if ([string]::IsNullOrWhiteSpace($status)) {
            continue
        }

        $idleFor = (Get-Date) - $lastChangeTime
        if ($idleFor -ge $idleThreshold) {
            Write-Log "$IdleMinutes minutes of inactivity. Auto-committing..."
            $pushed = Invoke-AutoCommitAndPush -RepoPath $RepoPath -Branch $Branch
            if (-not $pushed) { $pendingPush = $true }
            $lastStatus     = git -C $RepoPath status --porcelain
            $lastChangeTime = Get-Date
        }
    }
} finally {
    Remove-Item $lockFile -ErrorAction SilentlyContinue
    Write-Log "Watcher stopped (PID $PID)."
}