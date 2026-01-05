import { useEffect, useState } from "react"
import { socket } from "../services/socket"
import * as projectService from "../services/project"

interface Issue {
    id: string
    columnId: string
    title: string
    priority: string
}

interface Column {
    id: string
    title: string
}

interface Board {
    id: string
    name: string
    columns: Column[]
    issues: Issue[]
}

const KanbanBoard = () => {
    const [board, setBoard] = useState<Board | null>(null)
    const [teamId] = useState("1") // Default team

    useEffect(() => {
        loadBoard()
        socket.on("board_updated", () => loadBoard()) // Simple refresh on update
        return () => { socket.off("board_updated") }
    }, [])

    const loadBoard = async () => {
        try {
            const boards = await projectService.getBoards(teamId)
            if (boards.length > 0) setBoard(boards[0])
        } catch (e) { console.error(e) }
    }

    const handleCreateIssue = async (columnId: string) => {
        const title = prompt("Issue Title:")
        if (title && board) {
            await projectService.createIssue(board.id, columnId, title, 'medium')
            loadBoard()
            socket.emit("board_update", { boardId: board.id, action: 'create', payload: {} })
        }
    }

    const handleMove = async (issueId: string, targetColId: string) => {
        if (board) {
            await projectService.moveIssue(board.id, issueId, targetColId)
            loadBoard()
            socket.emit("board_update", { boardId: board.id, action: 'move', payload: {} })
        }
    }

    if (!board) return <div style={{ color: 'white', padding: 20 }}>Loading Board...</div>

    return (
        <div style={{ height: '100vh', backgroundColor: '#1e1e1e', color: 'white', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #333' }}>
                <h2>{board.name}</h2>
            </div>
            <div style={{ flex: 1, padding: '20px', overflowX: 'auto', display: 'flex', gap: '20px' }}>
                {board.columns.map(col => (
                    <div key={col.id} style={{ minWidth: '300px', backgroundColor: '#2d2d2d', borderRadius: '8px', padding: '15px', display: 'flex', flexDirection: 'column' }}>
                        <h4 style={{ marginBottom: '15px', color: '#aaa', textTransform: 'uppercase', fontSize: '0.8em' }}>{col.title}</h4>
                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            {board.issues.filter(i => i.columnId === col.id).map(issue => (
                                <div key={issue.id} style={{ backgroundColor: '#3d3d3d', padding: '10px', borderRadius: '4px', marginBottom: '10px' }}>
                                    <div style={{ marginBottom: '5px' }}>{issue.title}</div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.7em', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#555' }}>{issue.priority}</span>
                                        <div style={{ display: 'flex', gap: '5px' }}>
                                            {board.columns.map(c => c.id !== col.id && (
                                                <button
                                                    key={c.id}
                                                    onClick={() => handleMove(issue.id, c.id)}
                                                    style={{ fontSize: '0.6em', padding: '2px 5px' }}
                                                >
                                                    → {c.title.substring(0, 1)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => handleCreateIssue(col.id)}
                            style={{ marginTop: '10px', width: '100%', padding: '8px', backgroundColor: 'transparent', border: '1px dashed #555', color: '#888' }}
                        >
                            + Add Task
                        </button>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default KanbanBoard
