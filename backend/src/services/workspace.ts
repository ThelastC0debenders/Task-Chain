import fs from "fs"
import path from "path"
import { execSync } from "child_process"

const WORKSPACES_BASE = path.join(process.cwd(), "../workspaces")

interface FileScope {
  path: string
  permission: "editable" | "readonly" | "hidden"
}

export interface WorkspaceConfig {
  taskId: string
  claimId: string
  repoUrl: string
  scope: FileScope[]
}

export function createWorkspace(config: WorkspaceConfig) {
  const workspacePath = path.join(WORKSPACES_BASE, config.taskId, config.claimId)

  if (!fs.existsSync(workspacePath)) {
    fs.mkdirSync(workspacePath, { recursive: true })
    execSync(`git clone ${config.repoUrl} .`, { cwd: workspacePath, stdio: "pipe" })
  }

  return { workspacePath, config }
}

export function getFileStructure(workspacePath: string, scope: FileScope[]) {
  const files: any[] = []

  function walk(dir: string, relative: string = "") {
    if (!fs.existsSync(dir)) return
    const entries = fs.readdirSync(dir)

    for (const entry of entries) {
      if (entry.startsWith(".")) continue

      const fullPath = path.join(dir, entry)
      const relativePath = relative ? `${relative}/${entry}` : entry

      // Check if this path OR any parent path is in scope
      // valid if explicit match OR starts with a scope path that is a directory
      const explicitRule = scope.find(s => s.path === relativePath)

      let permission = explicitRule?.permission

      if (!permission) {
        // Check if any parent path grants permission
        const parentScope = scope.find(s => relativePath.startsWith(s.path + "/"))
        if (parentScope) {
          permission = parentScope.permission
        }
      }

      if (!permission || permission === "hidden") continue

      const stat = fs.statSync(fullPath)
      if (stat.isDirectory()) {
        walk(fullPath, relativePath)
      } else {
        files.push({
          path: relativePath,
          permission,
          language: getLanguage(entry)
        })
      }
    }
  }

  walk(workspacePath)
  return files
}

function getLanguage(filename: string) {
  const ext = path.extname(filename).toLowerCase()
  switch (ext) {
    case ".ts": case ".tsx": return "typescript"
    case ".js": case ".jsx": return "javascript"
    case ".sol": return "solidity"
    case ".css": return "css"
    case ".html": return "html"
    case ".json": return "json"
    case ".md": return "markdown"
    default: return "plaintext"
  }
}

export function readFile(workspacePath: string, filePath: string) {
  const fullPath = path.join(workspacePath, filePath)
  if (!fs.existsSync(fullPath)) throw new Error("File not found")
  return fs.readFileSync(fullPath, "utf-8")
}

export function writeFile(workspacePath: string, filePath: string, content: string) {
  const fullPath = path.join(workspacePath, filePath)
  const dir = path.dirname(fullPath)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(fullPath, content)
}

export function runGitCommand(workspacePath: string, command: string) {
  try {
    const output = execSync(`git ${command}`, {
      cwd: workspacePath,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"]
    })
    return { ok: true, output }
  } catch (err: any) {
    return { ok: false, error: err.message }
  }
}

export function commitChanges(workspacePath: string, message: string, author: string) {
  try {
    execSync(`git config user.email "${author}@taskchain.local"`, { cwd: workspacePath })
    execSync(`git config user.name "${author}"`, { cwd: workspacePath })
    execSync(`git add -A`, { cwd: workspacePath })
    const commitOutput = execSync(`git commit -m "${message}"`, {
      cwd: workspacePath,
      encoding: "utf-8"
    })
    return { ok: true, commit: commitOutput }
  } catch (err: any) {
    return { ok: false, error: err.message }
  }
}

export function pullChanges(workspacePath: string) {
  try {
    const output = execSync(`git pull`, {
      cwd: workspacePath,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"]
    })
    return { ok: true, output }
  } catch (err: any) {
    // Exit code 1 usually means conflict or error
    return { ok: false, error: err.message, output: err.stdout?.toString() }
  }
}

export function pushChanges(workspacePath: string) {
  try {
    const output = execSync(`git push`, {
      cwd: workspacePath,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"]
    })
    return { ok: true, output }
  } catch (err: any) {
    return { ok: false, error: err.message }
  }
}

export function getConflicts(workspacePath: string) {
  try {
    // List unmerged files
    const output = execSync(`git diff --name-only --diff-filter=U`, {
      cwd: workspacePath,
      encoding: "utf-8"
    })
    const files = output.split("\n").filter(Boolean)
    return { ok: true, files }
  } catch (err: any) {
    return { ok: false, error: err.message }
  }
}

export function resolveConflict(workspacePath: string, filePath: string) {
  try {
    // "Mark resolved" basically means git add
    execSync(`git add "${filePath}"`, { cwd: workspacePath })
    return { ok: true }
  } catch (err: any) {
    return { ok: false, error: err.message }
  }
}

export function getDiff(workspacePath: string) {
  try {
    // Diff against remote main to see all changes in this session/branch
    // Assuming 'origin' and default branch 'main' - in a real app might need detection
    // First fetch to ensure we have latest refs
    // But maybe just diff staged/unstaged for now?
    // User wants "Code Review".
    // If user has committed, we want to see commits ahead of origin/main.
    // If user has NOT committed, we want to see working tree changes.
    // Best: git diff HEAD (working tree vs last commit) AND git log origin/main..HEAD
    // For simplicity, let's just return `git diff` (working tree) if they haven't committed,
    // or `git diff origin/main...HEAD` if we want properly committed review.
    // Let's go with `git diff HEAD` (what am I working on right now that isn't committed?) for "WIP Review"
    // AND `git diff origin/main` to see EVERYTHING.
    // Let's use `git diff origin/main` to show "Total contribution".

    // Safety check: fetch origin first? Might be slow.
    // Let's just do `git diff` for now (local changes).
    const output = execSync(`git diff`, {
      cwd: workspacePath,
      encoding: "utf-8"
    })
    return { ok: true, diff: output }
  } catch (err: any) {
    return { ok: false, error: err.message }
  }
}

export function checkMergeReadiness(workspacePath: string) {
  try {
    // 1. Check for conflicts
    const conflicts = execSync(`git diff --name-only --diff-filter=U`, { cwd: workspacePath, encoding: "utf-8" }).trim()
    if (conflicts) return { ok: true, ready: false, reason: "Conflicts detected" }

    // 2. Check if behind
    execSync(`git fetch origin`, { cwd: workspacePath })
    const status = execSync(`git status -uno`, { cwd: workspacePath, encoding: "utf-8" })
    if (status.includes("is behind")) {
      return { ok: true, ready: false, reason: "Branch is behind origin" }
    }

    // 3. Clean working tree? (Not strictly necessary for merge if committed, but good practice)
    // if (!status.includes("nothing to commit, working tree clean")) {
    //   return { ok: true, ready: false, reason: "Uncommitted changes" }
    // }

    return { ok: true, ready: true }
  } catch (err: any) {
    return { ok: false, error: err.message }
  }
}


