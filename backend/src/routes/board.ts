import { Router } from "express"
import * as boardService from "../services/board"

const router = Router()

router.get("/:teamId", (req, res) => {
    try {
        const boards = boardService.getBoards(req.params.teamId)
        // Enrich with issues for simplicity in MVP
        const result = boards.map(b => ({
            ...b,
            issues: boardService.getIssues(b.id)
        }))
        res.json({ boards: result })
    } catch (err: any) {
        res.status(500).json({ error: err.message })
    }
})

router.post("/issue", (req, res) => {
    try {
        const { boardId, columnId, title, priority, description, assignee } = req.body
        const issue = boardService.createIssue(boardId, columnId, title, priority, description, assignee)
        res.json({ issue })
    } catch (err: any) {
        res.status(500).json({ error: err.message })
    }
})

router.patch("/issue/:issueId/move", (req, res) => {
    try {
        const { boardId, targetColumnId } = req.body
        const { issueId } = req.params
        const issue = boardService.moveIssue(boardId, issueId, targetColumnId)
        res.json({ issue })
    } catch (err: any) {
        res.status(500).json({ error: err.message })
    }
})

export default router
