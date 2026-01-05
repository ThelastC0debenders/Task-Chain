import { Router } from "express"
import { createInvite, acceptInvite, listMembers , isMember} from "../services/invite"
import { publishCallState } from "../services/firebase"
import { createMeet } from "../services/meet"

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

router.post("/request-meet", async (req, res) => {
  try {
    const { teamId, wallet } = req.body
    if (!teamId || !wallet) {
      return res
        .status(400)
        .json({ error: "teamId and wallet are required" })
    }

    // 1️⃣ Authorization
    if (!isMember(teamId, wallet)) {
      return res.status(403).json({ error: "Not a team member" })
    }

    // 2️⃣ Create meet
    const meetLink = await createMeet(teamId)

    // 3️⃣ Publish shared state (Firestore)
    await publishCallState(teamId, {
      status: "requested",
      requestedBy: wallet.toLowerCase(),
      meetLink,
      createdAt: Date.now(),
      expiresAt: Date.now() + 15 * 60 * 1000,
    })

    // 4️⃣ Respond
    res.json({
      ok: true,
      meetLink,
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export default router
