interface Issue {
    id: string
    boardId: string
    columnId: string
    title: string
    description?: string
    assignee?: string
    priority: 'low' | 'medium' | 'high'
}

interface Column {
    id: string
    title: string
    order: number
}

interface Board {
    id: string
    teamId: string
    name: string
    columns: Column[]
}

const boards: Map<string, Board> = new Map()
const issues: Map<string, Issue[]> = new Map()

// Seed a default board for team '1'
// Assuming teamId='1' is common
const defaultColumns = [
    { id: 'backlog', title: 'Backlog', order: 0 },
    { id: 'todo', title: 'To Do', order: 1 },
    { id: 'in-progress', title: 'In Progress', order: 2 },
    { id: 'done', title: 'Done', order: 3 }
]

export function getBoards(teamId: string) {
    // Simple filter
    const list: Board[] = []
    for (const b of boards.values()) {
        if (b.teamId === teamId) list.push(b)
    }
    // Auto-create one if none
    if (list.length === 0) {
        const newBoard = { id: 'default-' + teamId, teamId, name: 'Main Board', columns: defaultColumns }
        boards.set(newBoard.id, newBoard)
        issues.set(newBoard.id, [])
        list.push(newBoard)
    }
    return list
}

export function getIssues(boardId: string) {
    return issues.get(boardId) || []
}

export function createIssue(boardId: string, columnId: string, title: string, priority: any = 'medium', description?: string, assignee?: string) {
    if (!boards.has(boardId)) throw new Error("Board not found")

    const issue: Issue = {
        id: Date.now().toString(36),
        boardId,
        columnId,
        title,
        description,
        assignee,
        priority
    }
    issues.get(boardId)!.push(issue)
    return issue
}

export function moveIssue(boardId: string, issueId: string, targetColumnId: string) {
    const list = issues.get(boardId)
    if (!list) throw new Error("Board not found")

    const issue = list.find(i => i.id === issueId)
    if (!issue) throw new Error("Issue not found")

    issue.columnId = targetColumnId
    return issue
}
