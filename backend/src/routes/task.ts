import { Router } from "express"
import { createTask, getTasks, updateTask, getActiveClaims } from "../services/task"

const router = Router()

// Create a new task
router.post("/create", (req, res) => {
  try {
    const { teamId, task } = req.body
    if (!teamId || !task) {
      return res.status(400).json({ error: "teamId and task are required" })
    }
    const created = createTask(teamId, task)
    res.json({ ok: true, task: created })
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

// Get all tasks for a team
router.get("/:teamId", (req, res) => {
  try {
    const tasks = getTasks(req.params.teamId)
    res.json({ teamId: req.params.teamId, tasks })
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

// Get active claims for presence
router.get("/:teamId/active", (req, res) => {
  try {
    const active = getActiveClaims(req.params.teamId)
    res.json({ ok: true, active })
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

// Update a task (claim, complete, etc.)
router.patch("/:teamId/:taskId", (req, res) => {
  try {
    const { teamId, taskId } = req.params
    const updates = req.body
    const updated = updateTask(teamId, taskId, updates)
    res.json({ ok: true, task: updated })
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

export default router
