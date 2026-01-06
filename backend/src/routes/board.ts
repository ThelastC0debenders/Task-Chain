import { Router } from "express"
import * as boardService from "../services/board"
import { createTask, updateTask } from "../services/task"
import { getIO } from "../socket"

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

        // SYNC: Create Shadow Task for Health Dashboard
        // Fix Team ID extraction: Backend uses 'default-{teamId}' convention
        const teamId = boardId.replace('default-', '').replace('board-', '') || "1"

        console.log(`[Sync] Create Issue: ${issue.id} for Team: ${teamId}`)

        createTask(teamId, {
            id: issue.id,
            title: issue.title,
            status: 'open', // Default for new issues
            claimedBy: assignee || "Unassigned",
            createdAt: new Date().toISOString()
        })

        // Emit socket event
        try {
            const io = getIO()
            io.to(boardId).emit("board_updated", { boardId, action: 'create', payload: issue })
        } catch (e) { console.error("Socket emit failed", e) }

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

        // SYNC: Update Shadow Task for Health Dashboard
        // Strict mapping based on defaultColumns logic in services/board.ts
        let status = 'open'
        if (targetColumnId === 'in-progress') status = 'claimed'
        if (targetColumnId === 'done') status = 'completed'

        // Fix Team ID extraction: Backend uses 'default-{teamId}' convention
        const teamId = boardId.replace('default-', '').replace('board-', '') || "1"

        console.log(`[Sync] Move Issue: ${issueId} -> ${targetColumnId} (Status: ${status}) for Team: ${teamId}`)

        try {
            updateTask(teamId, issueId, { status })
        } catch (e) {
            console.log("Sync warning: task not found in shadow sync", issueId)
        }

        // Emit socket event
        try {
            const io = getIO()
            io.to(boardId).emit("board_updated", { boardId, action: 'move', payload: issue })
        } catch (e) { console.error("Socket emit failed", e) }

        res.json({ issue })
    } catch (err: any) {
        res.status(500).json({ error: err.message })
    }
})

export default router
