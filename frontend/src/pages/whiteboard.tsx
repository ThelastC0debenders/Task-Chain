import { useEffect, useRef, useState, MouseEvent } from "react"
import { socket } from "../services/socket"
import {
    Monitor, MousePointer, Pen, Eraser, Square,
    Type, Image as ImageIcon, StickyNote, RotateCcw, RotateCw,
    Download, Share, Save, Grid
} from "lucide-react"

// --- Types ---
type Tool = 'select' | 'pen' | 'eraser' | 'shape' | 'text' | 'note' | 'image' | 'laser'
type BrushType = 'pen' | 'marker' | 'highlighter' | 'brush'
type ShapeType = 'circle' | 'rect' | 'triangle' | 'diamond' | 'arrow' | 'line'

interface DrawElement {
    type: 'line'
    x0: number, y0: number, x1: number, y1: number
    color: string
    width: number
    cap?: CanvasLineCap
}

interface BoardObject {
    id: string
    type: 'note' | 'text' | 'image'
    x: number
    y: number
    content?: string
    color?: string
    width?: number
    height?: number
}

const Whiteboard = () => {
    // --- State ---
    const [tool, setTool] = useState<Tool>('pen')
    const [brushType, setBrushType] = useState<BrushType>('pen')
    const [color, setColor] = useState("#000000")
    const [isDrawing, setIsDrawing] = useState(false)
    const [strokeWidth, setStrokeWidth] = useState(2)
    const [objects, setObjects] = useState<BoardObject[]>([]) // Object Layer State

    // UI State
    const [showPenMenu, setShowPenMenu] = useState(false)
    const [showShapeMenu, setShowShapeMenu] = useState(false)

    // Refs
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const lastPos = useRef<{ x: number, y: number } | null>(null)
    const wbId = "default-wb"

    // --- Configuration Maps ---
    const brushSettings: Record<BrushType, { width: number, cap: CanvasLineCap, alpha: number }> = {
        pen: { width: 2, cap: 'round', alpha: 1 },
        marker: { width: 4, cap: 'round', alpha: 1 },
        highlighter: { width: 12, cap: 'square', alpha: 0.3 },
        brush: { width: 6, cap: 'round', alpha: 0.6 }
    }

    const colors = ['#000000', '#d93025', '#1967d2', '#1e8e3e', '#fbbc04', '#ffffff']

    // --- Setup ---
    useEffect(() => {
        const resize = () => {
            if (canvasRef.current && containerRef.current) {
                canvasRef.current.width = containerRef.current.clientWidth
                canvasRef.current.height = containerRef.current.clientHeight

                // Re-apply context settings after resize
                const ctx = canvasRef.current.getContext('2d')
                if (ctx) {
                    ctx.lineCap = 'round'
                    ctx.lineJoin = 'round'
                }
            }
        }

        window.addEventListener('resize', resize)
        // Initial delay to allow container to mount
        setTimeout(resize, 100)

        // Socket Join
        socket.emit("join_whiteboard", wbId)
        socket.on("draw_update", handleRemoteDraw)
        socket.on("object_update", handleRemoteObject)

        return () => {
            window.removeEventListener('resize', resize)
            socket.off("draw_update", handleRemoteDraw)
            socket.off("object_update", handleRemoteObject)
        }
    }, [])

    // Update settings when brush changes
    useEffect(() => {
        const s = brushSettings[brushType]
        setStrokeWidth(s.width)
    }, [brushType])


    // --- Drawing Logic ---
    const handleRemoteDraw = (data: any) => {
        if (data.elements) drawSegment(data.elements)
    }

    const handleRemoteObject = (data: any) => {
        if (data.type === 'add') {
            setObjects(prev => [...prev, data.object])
        } else if (data.type === 'update') {
            setObjects(prev => prev.map(o => o.id === data.object.id ? data.object : o))
        }
    }

    const addStickyNote = () => {
        const id = Date.now().toString()
        const newObj: BoardObject = {
            id,
            type: 'note',
            x: 100,
            y: 100,
            content: "New Note",
            color: '#fff740'
        }
        setObjects(prev => [...prev, newObj])
        socket.emit("object_update", { wbId, type: 'add', object: newObj })
        setTool('select')
    }

    const updateObjectPos = (id: string, x: number, y: number) => {
        setObjects(prev => prev.map(o => {
            if (o.id === id) {
                const updated = { ...o, x, y }
                socket.emit("object_update", { wbId, type: 'update', object: updated })
                return updated
            }
            return o
        }))
    }

    const getPos = (e: MouseEvent) => {
        if (!canvasRef.current) return { x: 0, y: 0 }
        const rect = canvasRef.current.getBoundingClientRect()
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        }
    }

    const startDrawing = (e: MouseEvent) => {
        if (tool === 'select') return
        setIsDrawing(true)
        const { x, y } = getPos(e)
        lastPos.current = { x, y }

        // Initial Dot
        const ctx = canvasRef.current?.getContext('2d')
        if (ctx) {
            ctx.beginPath()
            ctx.fillStyle = tool === 'eraser' ? '#ffffff' : color
            ctx.arc(x, y, strokeWidth / 2, 0, Math.PI * 2)
            ctx.fill()
        }
    }

    const draw = (e: MouseEvent) => {
        if (!isDrawing || !lastPos.current) return
        const { x, y } = getPos(e)

        const s = brushSettings[brushType]
        const drawColor = tool === 'eraser' ? '#ffffff' : color
        const width = tool === 'eraser' ? 20 : strokeWidth

        const segment: DrawElement = {
            type: 'line',
            x0: lastPos.current.x,
            y0: lastPos.current.y,
            x1: x,
            y1: y,
            color: drawColor,
            width: width,
            cap: s.cap
        }

        drawSegment(segment)
        socket.emit("draw", { wbId, elements: segment })
        lastPos.current = { x, y }
    }

    const stopDrawing = () => {
        setIsDrawing(false)
        lastPos.current = null
    }

    const drawSegment = (el: DrawElement) => {
        const ctx = canvasRef.current?.getContext('2d')
        if (!ctx) return

        ctx.beginPath()
        ctx.strokeStyle = el.color
        ctx.lineWidth = el.width
        ctx.lineCap = el.cap || 'round'
        ctx.lineJoin = 'round'
        ctx.moveTo(el.x0, el.y0)
        ctx.lineTo(el.x1, el.y1)
        ctx.stroke()
    }

    const clearBoard = () => {
        const ctx = canvasRef.current?.getContext('2d')
        if (ctx && canvasRef.current) {
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
        }
    }

    // --- Render Helpers ---
    const ToolbarBtn = ({
        active,
        icon: Icon,
        onClick,
        hasPopup
    }: { active: boolean, icon: any, onClick: (e: any) => void, hasPopup?: boolean }) => (
        <button
            onClick={onClick}
            style={{
                width: 40, height: 40, borderRadius: '50%', border: 'none',
                background: active ? '#e8f0fe' : 'transparent',
                color: active ? '#1967d2' : '#5f6368',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', position: 'relative'
            }}
        >
            <Icon size={20} />
            {hasPopup && <span style={{ fontSize: 8, position: 'absolute', right: 8, bottom: 8 }}>▶</span>}
        </button>
    )

    return (
        <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', background: '#f8f9fa' }}>

            {/* --- Top Bar --- */}
            <div style={{
                height: 64, background: 'white', borderBottom: '1px solid #dadce0',
                display: 'flex', alignItems: 'center', padding: '0 16px', justifyContent: 'space-between'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ background: '#fbbc04', color: 'white', width: 32, height: 32, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>J</div>
                    <span style={{ fontSize: 18, fontWeight: 500, color: '#202124' }}>Untitled Jam</span>
                </div>

                <div style={{ display: 'flex', gap: 8, background: '#f1f3f4', padding: 4, borderRadius: 4 }}>
                    {/* Frame Pagination Logic would go here */}
                    <span style={{ padding: '4px 12px', fontSize: 14 }}>1 / 1</span>
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={clearBoard} style={styles.textBtn}>Clear Frame</button>
                    <button style={{ ...styles.textBtn, background: '#1a73e8', color: 'white', border: 'none' }}>Share</button>
                </div>
            </div>

            {/* --- Workspace --- */}
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', justifyContent: 'center', paddingTop: 20 }}>

                {/* Left Toolbar */}
                <div style={{
                    position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
                    background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
                    borderRadius: 8, padding: 4, display: 'flex', flexDirection: 'column', gap: 4, zIndex: 100
                }}>
                    <ToolbarBtn
                        active={tool === 'pen'}
                        icon={Pen}
                        onClick={(e) => {
                            if (tool === 'pen') setShowPenMenu(!showPenMenu)
                            else { setTool('pen'); setShowPenMenu(false) }
                        }}
                        hasPopup
                    />
                    <ToolbarBtn active={tool === 'eraser'} icon={Eraser} onClick={() => setTool('eraser')} />
                    <ToolbarBtn active={tool === 'select'} icon={MousePointer} onClick={() => setTool('select')} />
                    <ToolbarBtn active={tool === 'note'} icon={StickyNote} onClick={addStickyNote} />
                    <ToolbarBtn active={tool === 'image'} icon={ImageIcon} onClick={() => alert("Image tool coming soon!")} />
                    <ToolbarBtn active={tool === 'shape'} icon={Square} onClick={() => setTool('shape')} hasPopup />
                    <ToolbarBtn active={tool === 'text'} icon={Type} onClick={() => setTool('text')} />
                </div>

                {/* Popups (Pen Menu) */}
                {showPenMenu && (
                    <div style={{
                        position: 'absolute', left: 70, top: '40%', background: 'white',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.2)', borderRadius: 4, padding: 12,
                        zIndex: 200, display: 'flex', gap: 12
                    }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, borderRight: '1px solid #ddd', paddingRight: 12 }}>
                            {(['pen', 'marker', 'highlighter', 'brush'] as BrushType[]).map(t => (
                                <div key={t}
                                    onClick={() => setBrushType(t)}
                                    style={{
                                        width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        background: brushType === t ? '#e8f0fe' : 'transparent',
                                        borderRadius: 4, cursor: 'pointer'
                                    }}
                                >
                                    {/* Simple icons for brush types */}
                                    <div style={{ width: 20, height: t === 'pen' ? 2 : t === 'marker' ? 4 : t === 'highlighter' ? 8 : 4, background: 'black', opacity: t === 'highlighter' ? 0.3 : 1 }} />
                                </div>
                            ))}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                            {colors.map(c => (
                                <div key={c}
                                    onClick={() => setColor(c)}
                                    style={{
                                        width: 24, height: 24, borderRadius: '50%', background: c,
                                        border: color === c ? '2px solid #4285f4' : '2px solid transparent',
                                        cursor: 'pointer', boxSizing: 'border-box'
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Canvas Container */}
                <div ref={containerRef} id="board-container" style={{
                    width: '100%', height: '100%',
                    background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                    position: 'relative', overflow: 'hidden'
                }}>
                    <canvas
                        ref={canvasRef}
                        onMouseDown={startDrawing}
                        onMouseUp={stopDrawing}
                        onMouseMove={draw}
                        onMouseLeave={stopDrawing}
                        style={{ position: 'absolute', top: 0, left: 0, cursor: tool === 'select' ? 'default' : 'crosshair' }}
                    />

                    {/* Object Layer */}
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: tool === 'select' ? 'auto' : 'none', overflow: 'hidden' }}>
                        {objects.map(obj => (
                            <DraggableObject
                                key={obj.id}
                                obj={obj}
                                isSelected={tool === 'select'}
                                onDrag={(x, y) => updateObjectPos(obj.id, x, y)}
                            />
                        ))}
                    </div>
                </div>

            </div>
        </div>
    )
}

// Simple Draggable Component
const DraggableObject = ({ obj, isSelected, onDrag }: { obj: BoardObject, isSelected: boolean, onDrag: (x: number, y: number) => void }) => {
    const handleMouseDown = (e: React.MouseEvent) => {
        if (!isSelected) return
        e.stopPropagation() // Prevent drawing
        const startX = e.clientX
        const startY = e.clientY
        const initialX = obj.x
        const initialY = obj.y

        const handleMouseMove = (me: MouseEvent) => {
            const dx = me.clientX - startX
            const dy = me.clientY - startY
            onDrag(initialX + dx, initialY + dy)
        }

        const handleMouseUp = () => {
            window.removeEventListener('mousemove', handleMouseMove as any)
            window.removeEventListener('mouseup', handleMouseUp)
        }

        window.addEventListener('mousemove', handleMouseMove as any)
        window.addEventListener('mouseup', handleMouseUp)
    }

    if (obj.type === 'note') {
        return (
            <div
                onMouseDown={handleMouseDown}
                style={{
                    position: 'absolute', left: obj.x, top: obj.y,
                    width: 200, height: 200, background: obj.color,
                    padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    cursor: isSelected ? 'grab' : 'default',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'cursive', fontSize: 20, textAlign: 'center',
                    userSelect: 'none'
                }}
            >
                {obj.content}
            </div>
        )
    }
    return null
}


const styles = {
    textBtn: {
        background: 'white', border: '1px solid #dadce0', padding: '6px 12px',
        borderRadius: 4, fontWeight: 500, cursor: 'pointer', fontSize: 13, color: '#3c4043'
    }
}

export default Whiteboard
