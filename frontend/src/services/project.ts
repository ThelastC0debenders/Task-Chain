import axios from "axios"

const API_URL = "/api/board"

export async function getBoards(teamId: string) {
    const res = await axios.get(`${API_URL}/${teamId}`)
    return res.data.boards
}

export async function createIssue(boardId: string, columnId: string, title: string, priority: string, description?: string, assignee?: string) {
    const res = await axios.post(`${API_URL}/issue`, {
        boardId,
        columnId,
        title,
        priority,
        description,
        assignee: assignee || "Operative 1" // Default assignee
    })
    return res.data.issue
}

export async function moveIssue(boardId: string, issueId: string, targetColumnId: string) {
    const res = await axios.patch(`${API_URL}/issue/${issueId}/move`, {
        boardId,
        targetColumnId,
        actor: "Operative 1" // Mock user for Health Dashboard Attribution
    })
    return res.data.issue
}
