import { useEffect, useState } from "react"
import { socket } from "../services/socket"
import * as projectService from "../services/project"
import { Zap, Layers, Send } from "lucide-react"

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
    const [drafts, setDrafts] = useState<{ [key: string]: string }>({})

    const handleQuickAdd = async (columnId: string) => {
        const title = drafts[columnId]
        if (title && board) {
            await projectService.createIssue(board.id, columnId, title, 'medium')
            setDrafts({ ...drafts, [columnId]: "" })
            loadBoard()
            socket.emit("board_update", { boardId: board.id, action: 'create', payload: {} })
        }
    }

    useEffect(() => {
        loadBoard()
        socket.on("board_updated", () => loadBoard()) // Simple refresh on update
        return () => { socket.off("board_updated") }
    }, [])

    useEffect(() => {
        if (board?.id) {
            socket.emit("join_board", board.id)
            console.log("Joined board room:", board.id)
        }
    }, [board?.id])

    const loadBoard = async () => {
        try {
            const boards = await projectService.getBoards(teamId)
            if (boards.length > 0) setBoard(boards[0])
        } catch (e) { console.error(e) }
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
        <div style={{ height: '100vh', backgroundColor: '#0d1117', color: '#c9d1d9', display: 'flex', flexDirection: 'column', fontFamily: 'monospace' }}>
            <style>
                {`
                    @keyframes breathe {
                        0% { opacity: 0.05; background-size: 20px 20px; }
                        50% { opacity: 0.15; background-size: 21px 21px; }
                        100% { opacity: 0.05; background-size: 20px 20px; }
                    }
                    .cyber-grid {
                        background-image: 
                            linear-gradient(#00ff88 1px, transparent 1px), 
                            linear-gradient(90deg, #00ff88 1px, transparent 1px);
                        background-size: 20px 20px;
                        animation: breathe 4s infinite ease-in-out;
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        pointer-events: none;
                        z-index: 0;
                    }
                `}
            </style>
            <div style={{ padding: '20px', borderBottom: '1px solid #30363d', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 1, background: '#0d1117' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Layers size={20} color="#00ff88" />
                    <div>
                        <h2 style={{ color: '#fff', fontSize: '18px', margin: 0 }}>HYPER BOARD :: {board.name}</h2>
                        <div style={{ fontSize: '12px', color: '#00ff88' }}>ON-CHAIN TASK MANAGEMENT</div>
                    </div>
                </div>
                <div style={{ fontSize: '12px', color: '#8b949e', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 8px #00ff88' }}></div>
                    TEAM ID: {teamId}
                </div>
            </div>

            {/* Columns Container: flex: 1 to fill height, gap for spacing */}
            <div style={{ flex: 1, padding: '20px', overflowX: 'auto', display: 'flex', gap: '20px', zIndex: 1 }}>
                {board.columns.map(col => (
                    <div key={col.id} style={{
                        flex: 1,
                        minWidth: '280px',
                        backgroundColor: '#161b22',
                        borderRadius: '6px',
                        border: '1px solid #30363d',
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        {/* Breathing Grid Overlay */}
                        <div className="cyber-grid"></div>

                        <div style={{ padding: '15px', display: 'flex', flexDirection: 'column', flex: 1, zIndex: 1 }}>
                            <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h4 style={{ margin: 0, color: '#8b949e', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Zap size={12} color="#00ff88" /> {col.title}
                                </h4>
                                <span style={{ fontSize: '10px', background: '#30363d', padding: '2px 6px', borderRadius: '10px', color: '#c9d1d9' }}>
                                    {board.issues.filter(i => i.columnId === col.id).length}
                                </span>
                            </div>

                            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px', display: 'flex', flexWrap: 'wrap', alignContent: 'flex-start', gap: '10px' }}>
                                {board.issues.filter(i => i.columnId === col.id).map(issue => (
                                    <div key={issue.id} style={{
                                        backgroundImage: 'url(/1.png)',
                                        backgroundSize: '100% 100%',
                                        backgroundRepeat: 'no-repeat',
                                        width: '130px',
                                        minHeight: '130px',
                                        padding: '20px 15px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        color: '#000',
                                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                        transform: 'rotate(-1deg)',
                                        transition: 'transform 0.2s'
                                    }}
                                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05) rotate(0deg)'}
                                        onMouseLeave={e => e.currentTarget.style.transform = 'rotate(-1deg)'}
                                    >
                                        <div style={{
                                            flex: 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            textAlign: 'center',
                                            width: '100%',
                                            overflow: 'hidden',
                                            wordBreak: 'break-word',
                                            fontWeight: 'bold',
                                            fontSize: '0.9em',
                                            lineHeight: '1.2'
                                        }}>
                                            {issue.title}
                                        </div>
                                        <div style={{ display: 'flex', width: '100%', justifyContent: 'center', alignItems: 'center', marginTop: '5px', gap: '4px' }}>
                                            {/* Priority removed as requested */}
                                            {board.columns.map(c => c.id !== col.id && (
                                                <button
                                                    key={c.id}
                                                    onClick={() => handleMove(issue.id, c.id)}
                                                    title={`Move to ${c.title}`}
                                                    style={{
                                                        fontSize: '0.6em',
                                                        padding: '2px 6px',
                                                        borderRadius: '4px',
                                                        border: '1px solid rgba(0,0,0,0.2)',
                                                        backgroundColor: 'rgba(255,255,255,0.5)',
                                                        cursor: 'pointer',
                                                        color: '#000',
                                                        fontWeight: 'bold',
                                                        minWidth: '20px'
                                                    }}
                                                >
                                                    {c.title.substring(0, 1)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Chat-style Input Area */}
                            <div style={{
                                marginTop: '10px',
                                background: 'rgba(13, 17, 23, 0.8)',
                                backdropFilter: 'blur(5px)',
                                borderRadius: '20px',
                                padding: '4px 8px',
                                border: '1px solid #30363d',
                                display: 'flex',
                                alignItems: 'center'
                            }}>
                                <input
                                    type="text"
                                    placeholder="Add task..."
                                    value={drafts[col.id] || ""}
                                    onChange={(e) => setDrafts({ ...drafts, [col.id]: e.target.value })}
                                    onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd(col.id)}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: '#fff',
                                        fontSize: '12px',
                                        fontFamily: 'monospace',
                                        flex: 1,
                                        padding: '6px',
                                        outline: 'none'
                                    }}
                                />
                                <button
                                    onClick={() => handleQuickAdd(col.id)}
                                    style={{
                                        background: '#00ff88',
                                        border: 'none',
                                        borderRadius: '50%',
                                        width: '28px',
                                        height: '28px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        color: '#000',
                                        flexShrink: 0 // Prevent shrinking
                                    }}
                                >
                                    <Send size={16} strokeWidth={2.5} color="#000000" style={{ transform: 'translateX(-1px) translateY(1px)' }} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default KanbanBoard
