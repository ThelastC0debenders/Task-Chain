import { Router, Request, Response } from "express"
import {
  createWorkspace,
  getFileStructure,
  readFile,
  writeFile,
  runGitCommand,
  commitChanges,
  pullChanges,
  pushChanges,
  getConflicts,
  resolveConflict,
  getDiff,
  checkMergeReadiness
} from "../services/workspace"
import { analyzeCode } from "../services/ai"

const router = Router()
const workspaceMap = new Map<string, any>()

router.post("/create", (req, res) => {
  try {
    const { taskId, claimId, repoUrl, scope } = req.body
    if (!taskId || !claimId || !repoUrl || !scope) {
      return res.status(400).json({ error: "Missing required fields" })
    }

    const ws = createWorkspace({ taskId, claimId, repoUrl, scope })
    const key = `${taskId}-${claimId}`
    workspaceMap.set(key, ws)

    res.json({ ok: true, workspacePath: ws.workspacePath })
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

router.get("/:taskId/:claimId/files", (req, res) => {
  try {
    const { taskId, claimId } = req.params
    const key = `${taskId}-${claimId}`
    const ws = workspaceMap.get(key)
    if (!ws) return res.status(404).json({ error: "Workspace not found" })

    const files = getFileStructure(ws.workspacePath, ws.config.scope)
    res.json({ files })
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

router.get(/^\/([^\/]+)\/([^\/]+)\/file\/(.+)$/, (req: Request, res: Response) => {
  try {
    const taskId = req.params[0]
    const claimId = req.params[1]
    const filePath = req.params[2]
    const key = `${taskId}-${claimId}`
    const ws = workspaceMap.get(key)
    if (!ws) return res.status(404).json({ error: "Workspace not found" })

    const content = readFile(ws.workspacePath, filePath)
    res.json({ content })
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

router.post(/^\/([^\/]+)\/([^\/]+)\/file\/(.+)$/, (req: Request, res: Response) => {
  try {
    const taskId = req.params[0]
    const claimId = req.params[1]
    const filePath = req.params[2]
    const { content } = req.body
    const key = `${taskId}-${claimId}`
    const ws = workspaceMap.get(key)
    if (!ws) return res.status(404).json({ error: "Workspace not found" })

    writeFile(ws.workspacePath, filePath, content)
    res.json({ ok: true })
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

router.post("/:taskId/:claimId/git", (req, res) => {
  try {
    const { taskId, claimId } = req.params
    const { command } = req.body
    const key = `${taskId}-${claimId}`
    const ws = workspaceMap.get(key)
    if (!ws) return res.status(404).json({ error: "Workspace not found" })

    const result = runGitCommand(ws.workspacePath, command)
    res.json(result)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

router.post("/:taskId/:claimId/commit", (req, res) => {
  try {
    const { taskId, claimId } = req.params
    const { message, author } = req.body
    const key = `${taskId}-${claimId}`
    const ws = workspaceMap.get(key)
    if (!ws) return res.status(404).json({ error: "Workspace not found" })

    const result = commitChanges(ws.workspacePath, message, author)
    res.json(result)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})
router.post("/:taskId/:claimId/pull", (req, res) => {
  try {
    const { taskId, claimId } = req.params
    const key = `${taskId}-${claimId}`
    const ws = workspaceMap.get(key)
    if (!ws) return res.status(404).json({ error: "Workspace not found" })

    const result = pullChanges(ws.workspacePath)
    res.json(result)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

router.post("/:taskId/:claimId/push", (req, res) => {
  try {
    const { taskId, claimId } = req.params
    const key = `${taskId}-${claimId}`
    const ws = workspaceMap.get(key)
    if (!ws) return res.status(404).json({ error: "Workspace not found" })

    const result = pushChanges(ws.workspacePath)
    res.json(result)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

router.get("/:taskId/:claimId/conflicts", (req, res) => {
  try {
    const { taskId, claimId } = req.params
    const key = `${taskId}-${claimId}`
    const ws = workspaceMap.get(key)
    if (!ws) return res.status(404).json({ error: "Workspace not found" })

    const result = getConflicts(ws.workspacePath)
    res.json(result)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

router.post("/:taskId/:claimId/resolve", (req, res) => {
  try {
    const { taskId, claimId } = req.params
    const { file } = req.body
    const key = `${taskId}-${claimId}`
    const ws = workspaceMap.get(key)
    if (!ws) return res.status(404).json({ error: "Workspace not found" })

    const result = resolveConflict(ws.workspacePath, file)
    res.json(result)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

router.get("/:taskId/:claimId/diff", (req, res) => {
  try {
    const { taskId, claimId } = req.params
    const key = `${taskId}-${claimId}`
    const ws = workspaceMap.get(key)
    if (!ws) return res.status(404).json({ error: "Workspace not found" })

    const result = getDiff(ws.workspacePath)
    res.json(result)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

router.get("/:taskId/:claimId/readiness", (req, res) => {
  try {
    const { taskId, claimId } = req.params
    const key = `${taskId}-${claimId}`
    const ws = workspaceMap.get(key)
    if (!ws) return res.status(404).json({ error: "Workspace not found" })

    const result = checkMergeReadiness(ws.workspacePath)
    res.json(result)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

router.post("/:taskId/:claimId/analyze", (req, res) => {
  try {
    const { taskId, claimId } = req.params
    const key = `${taskId}-${claimId}`
    const ws = workspaceMap.get(key)
    if (!ws) return res.status(404).json({ error: "Workspace not found" })

    // Get the diff first
    const diffRes = getDiff(ws.workspacePath)
    if (!diffRes.ok || !diffRes.diff) {
      return res.json({ result: { score: 100, issues: [], summary: "No changes." } })
    }

    const result = analyzeCode(diffRes.diff)
    res.json({ result })
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

export default router
