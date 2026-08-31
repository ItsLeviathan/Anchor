# Anchor Auto-Git Watcher — Setup

No AI API is used, so there's no key to buy, store, or protect. Commit
messages come from a local heuristic that looks at what changed (which
files, how many, added vs. modified vs. deleted) and writes something like
`Add recurring task modal` or `Update dashboard layout`. It won't be as
sharp as a human or an LLM, but it's a large step up from timestamped
`Auto-sync` commits, and it costs nothing to run.

## 1. Install the files

Copy these two items into your `D:\anchor` repo, preserving the paths:

```
D:\anchor\.auto-git\auto-git.ps1
D:\anchor\.vscode\tasks.json
```

If `D:\anchor\.vscode\tasks.json` **already exists**, don't overwrite it —
merge the `"Anchor Auto-Git Watcher"` task into your existing `"tasks"`
array instead.

## 2. Update `.gitignore`

Add one line so the watcher's log/lock files never get committed:

```gitignore
.auto-git/*.log
.auto-git/watcher.lock
```

The script itself (`auto-git.ps1`) is safe to commit — it holds no secrets.

## 3. Test it manually first

Before trusting it to run in the background, run it by hand with a short
idle time so you don't have to wait 10 real minutes:

```powershell
cd D:\anchor
.\.auto-git\auto-git.ps1 -IdleMinutes 1
```

Edit a file, save it, then stop touching the repo. Within about a minute
you should see log lines appear in `D:\anchor\.auto-git\auto-git.log`
(and in the terminal), ending with a commit and a push. Check GitHub to
confirm the commit landed. Press `Ctrl+C` to stop the test run.

Once you're happy with it, just open the folder normally — the default
`-IdleMinutes 10` is what actually runs in the background.

## 4. Auto-start when you open the Anchor folder in VS Code

This is what `.vscode/tasks.json` does: it launches the watcher hidden in
a dedicated terminal panel the moment you open `D:\anchor` in VS Code, via
`"runOn": "folderOpen"`.

The **first time** you open the folder after adding this, VS Code will
show a prompt: *"This workspace has a task that runs on folder open. Allow
Automatic Tasks in this workspace?"* — choose **Allow**. This is a one-time
workspace-trust confirmation, not something you need to click every time.

If you'd rather not trust automatic tasks, run the watcher manually from a
terminal each session instead:

```powershell
.\.auto-git\auto-git.ps1
```

## 5. How it behaves

- Polls `git status` every 15 seconds — cheap, and it naturally respects
  your `.gitignore` (so `.env` etc. are never touched, per your existing rules).
- Any change you make resets the 10-minute idle clock.
- After 10 idle minutes, it runs `git add -A`, builds a message, commits,
  and pushes.
- If `git push` fails (no network, remote has newer commits, etc.), the
  commit stays local — nothing is lost — and it retries the push every
  15 seconds until it succeeds.
- If you happen to be on a branch other than `main` when the timer fires,
  it skips the auto-commit entirely rather than committing to the wrong
  branch.
- A lock file (`.auto-git/watcher.lock`) stops two copies from running at
  once if you open the folder in more than one VS Code window.

## 6. Stopping / uninstalling

- **Stop for this session:** close the "Anchor Auto-Git Watcher" terminal
  panel in VS Code, or close the VS Code window.
- **Stop it from auto-starting:** delete the task block from
  `.vscode/tasks.json`, or delete the file if you added nothing else to it.
- **Fully remove:** also delete the `.auto-git` folder.

## 7. If you want AI-written messages later

The heuristic lives entirely in one function, `Get-SmartCommitMessage`, in
`auto-git.ps1`. To swap in Claude or GPT later, you'd replace the body of
that function with an API call that sends `git diff --cached` and gets a
message back — everything else (the idle timer, staging, commit, push,
retry logic) stays the same. Say the word if you want that version built
out too.