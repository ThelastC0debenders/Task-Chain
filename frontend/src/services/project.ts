import axios from "axios"

const API_URL = "http://localhost:5001/board"

export async function getBoards(teamId: string) {
    const res = await axios.get(`${API_URL}/${teamId}`)
    return res.data.boards
}

export async function createIssue(boardId: string, columnId: string, title: string, priority: string, description?: string, assignee?: string) {
    const res = await axios.post(`${API_URL}/issue`, { boardId, columnId, title, priority, description, assignee })
    return res.data.issue
}

export async function moveIssue(boardId: string, issueId: string, targetColumnId: string) {
    const res = await axios.patch(`${API_URL}/issue/${issueId}/move`, { boardId, targetColumnId })
    return res.data.issue
}
