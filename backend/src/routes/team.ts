import { Router } from "express"
import { createInvite, acceptInvite, listMembers } from "../services/invite"

const router = Router()

router.post("/invite", (req, res) => {
  try {
    const { teamId, ttlSeconds = 3600 } = req.body
    if (!teamId) return res.status(400).json({ error: "teamId is required" })
    const { token, payload } = createInvite(teamId, Number(ttlSeconds))
    // Point to frontend on port 5173 (or 5173 if different)
    const inviteUrl = `http://localhost:5173/invite?token=${encodeURIComponent(token)}`
    res.json({ inviteUrl, token, payload })
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

router.post("/accept", (req, res) => {
  try {
    const { token, wallet } = req.body
    if (!token || !wallet) return res.status(400).json({ error: "token and wallet are required" })
    const result = acceptInvite(token, wallet)
    res.json({ ok: true, teamId: result.teamId })
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

router.get("/members/:teamId", (req, res) => {
  try {
    const members = listMembers(req.params.teamId)
    res.json({ teamId: req.params.teamId, members })
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

export default router
