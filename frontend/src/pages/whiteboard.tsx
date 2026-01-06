import { useEffect, useRef, useState, useCallback } from "react"
import { socket } from "../services/socket"
import {
    MousePointer, Pen, Eraser, StickyNote, Image as ImageIcon,
    Circle, Type, MoreVertical, ChevronLeft, ChevronRight,
    Undo, Redo, ZoomIn, Download, Trash2, Check, Plus
} from "lucide-react"

// --- Types ---
type Tool = 'select' | 'pen' | 'eraser' | 'shape' | 'text' | 'note' | 'image'
type BrushType = 'pen' | 'marker' | 'highlighter' | 'brush'
type ShapeType = 'circle' | 'square' | 'triangle' | 'diamond' | 'arrow' | 'rounded_rect' | 'bar' | 'half_circle'
type ZoomLevel = 0.5 | 1 | 1.5 | 2

interface DrawElement {
    type: 'line'
    x0: number, y0: number, x1: number, y1: number
    color: string
    width: number
    cap?: CanvasLineCap
}

interface BoardObject {
    id: string
    type: 'note' | 'text' | 'image' | 'shape'
    x: number
    y: number
    width?: number
    height?: number
    content?: string
    color?: string
    shapeType?: ShapeType
    rotation?: number
}

interface HistoryState {
    objects: BoardObject[]
    imageData: ImageData | null
}

// Throttle helper
const throttle = (func: Function, limit: number) => {
    let inThrottle: boolean
    return function(this: any, ...args: any[]) {
        if (!inThrottle) {
            func.apply(this, args)
            inThrottle = true
            setTimeout(() => inThrottle = false, limit)
        }
    }
}

const Whiteboard = () => {
    // --- State ---
    const [tool, setTool] = useState<Tool>('pen')
    const [brushType, setBrushType] = useState<BrushType>('pen')
    const [color, setColor] = useState("#000000")
    const [isDrawing, setIsDrawing] = useState(false)
    const [strokeWidth, setStrokeWidth] = useState(2)
    const [eraserWidth, setEraserWidth] = useState(20)
    const [objects, setObjects] = useState<BoardObject[]>([])
    
    // UI State
    const [showPenMenu, setShowPenMenu] = useState(false)
    const [showEraserMenu, setShowEraserMenu] = useState(false)
    const [showShapeMenu, setShowShapeMenu] = useState(false)
    const [showStickyModal, setShowStickyModal] = useState(false)
    const [zoom, setZoom] = useState<number>(1)
    
    // Sticky Modal State
    const [stickyColor, setStickyColor] = useState('#fff740')
    const [stickyText, setStickyText] = useState('')

    // History State
    const [history, setHistory] = useState<HistoryState[]>([])
    const [future, setFuture] = useState<HistoryState[]>([])

    // Refs
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const lastPos = useRef<{ x: number, y: number } | null>(null)
    const wbId = "default-wb"

    // --- Configuration Maps ---
    const brushSettings: Record<BrushType, { width: number, cap: CanvasLineCap, opacity: number }> = {
        pen: { width: 2, cap: 'round', opacity: 1 },
        marker: { width: 4, cap: 'round', opacity: 1 },
        highlighter: { width: 14, cap: 'square', opacity: 0.4 },
        brush: { width: 6, cap: 'round', opacity: 0.6 }
    }

    const colors = ['#000000', '#1967d2', '#1e8e3e', '#ffffff', '#fbbc04', '#d93025']
    const eraserSizes = [10, 20, 40, 60]
    const noteColors = ['#fff740', '#a7ffeb', '#f28b82', '#fdcfe8', '#e6c9a8', '#e8eaed']

    // --- Life Cycle & Persistence ---
    useEffect(() => {
        // Load from LocalStorage
        const savedObjects = localStorage.getItem(`${wbId}-objects`)
        const savedImage = localStorage.getItem(`${wbId}-image`)
        if (savedObjects) setObjects(JSON.parse(savedObjects))
        
        const resize = () => {
            if (containerRef.current && canvasRef.current) {
                const { clientWidth, clientHeight } = containerRef.current
                canvasRef.current.width = clientWidth
                canvasRef.current.height = clientHeight
                
                // Restore Context
                const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true })
                if (ctx) {
                    ctx.lineCap = 'round'
                    ctx.lineJoin = 'round'
                    // Restore Image if exists
                    if (savedImage) {
                        const img = new Image()
                        img.onload = () => ctx.drawImage(img, 0, 0)
                        img.src = savedImage
                    }
                }
            }
        }

        window.addEventListener('resize', resize)
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

    // Save to LocalStorage on changes
    useEffect(() => {
        localStorage.setItem(`${wbId}-objects`, JSON.stringify(objects))
    }, [objects])

    const saveCanvas = useCallback(() => {
        if (canvasRef.current) {
            localStorage.setItem(`${wbId}-image`, canvasRef.current.toDataURL())
        }
    }, [])

    useEffect(() => {
        const interval = setInterval(saveCanvas, 2000) // Auto-save canvas every 2s
        return () => clearInterval(interval)
    }, [saveCanvas])


    useEffect(() => {
        const s = brushSettings[brushType]
        setStrokeWidth(s.width)
    }, [brushType])

    // --- Logic ---
    const handleRemoteDraw = (data: any) => { if (data.elements) drawSegment(data.elements) }
    const handleRemoteObject = (data: any) => {
        if (data.type === 'add') setObjects(prev => [...prev, data.object])
        else if (data.type === 'update') setObjects(prev => prev.map(o => o.id === data.object.id ? data.object : o))
    }

    // --- History Logic ---
    const saveCheckpoint = () => {
        if (!canvasRef.current) return
        const ctx = canvasRef.current.getContext('2d')
        if (!ctx) return
        
        const imageData = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height)
        
        const currentState: HistoryState = {
            objects: JSON.parse(JSON.stringify(objects)), // Deep copy to prevent mutation reference
            imageData: imageData
        }
        
        setHistory(prev => {
            const newHistory = [...prev, currentState]
            if (newHistory.length > 20) newHistory.shift() // Limit stack size
            return newHistory
        })
        setFuture([]) // Clear redo stack on new action
    }

    const undo = () => {
        if (history.length === 0 || !canvasRef.current) return
        
        const previousState = history[history.length - 1]
        const ctx = canvasRef.current.getContext('2d')
        if (!ctx) return

        // 1. Save CURRENT state to future
        const currentState: HistoryState = {
            objects: [...objects],
            imageData: ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height)
        }
        setFuture(prev => [...prev, currentState])

        // 2. Restore PREVIOUS state
        if (previousState.imageData) {
             ctx.putImageData(previousState.imageData, 0, 0)
        } else {
             ctx.clearRect(0,0, canvasRef.current.width, canvasRef.current.height)
        }
        setObjects(previousState.objects)

        // 3. Remove used state from history
        setHistory(prev => prev.slice(0, -1))
    }

    const redo = () => {
        if (future.length === 0 || !canvasRef.current) return
        
        const nextState = future[future.length - 1]
        const ctx = canvasRef.current.getContext('2d')
        if (!ctx) return

        // 1. Save CURRENT state to history
        const currentState: HistoryState = {
            objects: [...objects],
            imageData: ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height)
        }
        setHistory(prev => [...prev, currentState])

        // 2. Restore NEXT state
        if (nextState.imageData) {
            ctx.putImageData(nextState.imageData, 0, 0)
        }
        setObjects(nextState.objects)

        // 3. Remove used state from future
        setFuture(prev => prev.slice(0, -1))
    }
    
    const handleClearBoard = () => {
         saveCheckpoint()
         setObjects([])
         const ctx = canvasRef.current?.getContext('2d')
         if (ctx && canvasRef.current) {
             ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
         }
         saveCanvas()
    }

    const cycleZoom = () => {
        const levels: number[] = [0.5, 1, 1.5, 2]
        const currentIndex = levels.indexOf(zoom)
        const nextIndex = (currentIndex + 1) % levels.length
        setZoom(levels[nextIndex])
    }

    // --- Tool Actions ---
    const triggerImageUpload = () => fileInputRef.current?.click()
    
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        
        saveCheckpoint() // Save before adding
        const reader = new FileReader()
        reader.onload = (ev) => {
            const imgUrl = ev.target?.result as string
            const id = Date.now().toString()
            const newObj: BoardObject = {
                id, type: 'image', x: 200, y: 200, width: 300, height: 200, content: imgUrl
            }
            emitObject(newObj)
            setTool('select')
        }
        reader.readAsDataURL(file)
    }

    const openStickyModal = () => {
        setStickyText('')
        setStickyColor(noteColors[0])
        setShowStickyModal(true)
    }

    const confirmStickyNote = () => {
        if (!stickyText.trim()) return
        saveCheckpoint() // Save before adding
        const id = Date.now().toString()
        const newObj: BoardObject = {
            id, type: 'note', x: 200, y: 200, content: stickyText, color: stickyColor
        }
        emitObject(newObj)
        setShowStickyModal(false)
        setTool('select')
    }
    
    const addShape = (shape: ShapeType) => {
        saveCheckpoint() // Save before adding
        const id = Date.now().toString()
        const newObj: BoardObject = {
            id, type: 'shape', x: 300, y: 300, width: 100, height: 100, shapeType: shape, color: 'transparent'
        }
        emitObject(newObj)
        setTool('select')
        setShowShapeMenu(false)
    }

    const addTextBox = () => {
        saveCheckpoint() // Save before adding
        const id = Date.now().toString()
        const newObj: BoardObject = {
            id, type: 'text', x: 200, y: 200, content: "Double click to edit", color: 'black'
        }
        emitObject(newObj)
        setTool('select')
    }

    const downloadBoard = () => {
        const canvas = canvasRef.current
        if (!canvas) return

        // Create a temporary canvas to merge drawing + objects
        const tempCanvas = document.createElement('canvas')
        tempCanvas.width = canvas.width
        tempCanvas.height = canvas.height
        const ctx = tempCanvas.getContext('2d')
        if (!ctx) return

        // 1. Draw Background
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height)
        
        // 2. Draw Drawings
        ctx.drawImage(canvas, 0, 0)

        // 3. Draw Objects
        ctx.font = '24px sans-serif'
        objects.forEach(obj => {
            ctx.save()
            ctx.translate(obj.x, obj.y)
            
            if (obj.type === 'note') {
                ctx.fillStyle = obj.color || '#fff740'
                ctx.shadowColor = 'rgba(0,0,0,0.2)'
                ctx.shadowBlur = 4
                ctx.fillRect(0, 0, 200, 200)
                ctx.shadowBlur = 0
                ctx.fillStyle = '#000'
                ctx.font = '20px Caveat'
                wrapText(ctx, obj.content || '', 20, 40, 160, 24)
            } else if (obj.type === 'image' && obj.content) {
                 const img = new Image()
                 img.src = obj.content
                 ctx.drawImage(img, 0, 0, obj.width || 100, obj.height || 100)
            } else if (obj.type === 'text') {
                ctx.fillStyle = obj.color || 'black'
                ctx.font = '32px sans-serif'
                ctx.fillText(obj.content || '', 0, 32)
            } else if (obj.type === 'shape') {
                 drawShapeOnContext(ctx, obj)
            }

            ctx.restore()
        })

        const link = document.createElement('a')
        link.download = `jamboard-export-${Date.now()}.png`
        link.href = tempCanvas.toDataURL()
        link.click()
    }

    const emitObject = (obj: BoardObject) => {
        setObjects(prev => [...prev, obj])
        socket.emit("object_update", { wbId, type: 'add', object: obj })
    }

    const updateObject = (obj: BoardObject) => {
        setObjects(prev => prev.map(o => o.id === obj.id ? obj : o))
        socket.emit("object_update", { wbId, type: 'update', object: obj })
    }

    // --- Input Handlers (PointerEvents for Latency/Stylus) ---
    const getPos = (e: React.PointerEvent | React.MouseEvent) => {
        if (!canvasRef.current) return { x: 0, y: 0 }
        const rect = canvasRef.current.getBoundingClientRect()
        // Adjust for Zoom
        return { 
            x: (e.clientX - rect.left) / zoom, 
            y: (e.clientY - rect.top) / zoom 
        }
    }

    const handlePointerDown = (e: React.PointerEvent) => {
        if (tool === 'select') return
        e.currentTarget.setPointerCapture(e.pointerId)
        
        saveCheckpoint() // Save state before starting a stroke
        
        setIsDrawing(true)
        const { x, y } = getPos(e)
        lastPos.current = { x, y }

        if (tool === 'pen' || tool === 'eraser') {
            const ctx = canvasRef.current?.getContext('2d')
            if (ctx) {
                const s = brushSettings[brushType]
                if (tool === 'pen') {
                    ctx.beginPath()
                    ctx.fillStyle = color
                    ctx.globalAlpha = s.opacity
                    ctx.arc(x, y, s.width / 2, 0, Math.PI * 2)
                    ctx.fill()
                    ctx.globalAlpha = 1
                }
                // Eraser click logic (optional, usually drag)
            }
        }
    }

    const emitDraw = useCallback(throttle((wbId: string, segment: DrawElement) => {
         socket.emit("draw", { wbId, elements: segment })
    }, 20), [])

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDrawing) return
        const { x, y } = getPos(e) 
        
        if (!lastPos.current) return
        
        const s = brushSettings[brushType]
        const currentWidth = tool === 'eraser' ? eraserWidth : s.width
        
        const segment: DrawElement = {
            type: 'line',
            x0: lastPos.current.x, y0: lastPos.current.y,
            x1: x, y1: y,
            color: tool === 'eraser' ? '#ffffff' : color,
            width: currentWidth,
            cap: s.cap
        }

        drawSegment(segment, tool === 'pen' ? s.opacity : 1)
        emitDraw(wbId, segment)
        lastPos.current = { x, y }
    }

    const handlePointerUp = (e: React.PointerEvent) => {
        setIsDrawing(false)
        lastPos.current = null
        e.currentTarget.releasePointerCapture(e.pointerId)
        saveCanvas() // Save on stroke end to LS
    }

    const drawSegment = (el: DrawElement, opacity = 1) => {
        const ctx = canvasRef.current?.getContext('2d')
        if (!ctx) return
        ctx.beginPath()
        ctx.strokeStyle = el.color
        ctx.lineWidth = el.width
        ctx.lineCap = el.cap || 'round'
        ctx.lineJoin = 'round'
        ctx.globalAlpha = opacity
        ctx.moveTo(el.x0, el.y0)
        ctx.lineTo(el.x1, el.y1)
        ctx.stroke()
        ctx.globalAlpha = 1
    }

    // --- Helper Components ---
    const ToolbarTool = ({ active, icon: Icon, onClick, hasMore, isDangerous }: any) => (
        <div style={{ position: 'relative' }}>
            <button
                onClick={onClick}
                style={{
                    width: 36, height: 36, padding: 0, border: 'none', background: 'transparent',
                    color: isDangerous ? '#d93025' : (active ? (tool === 'pen' || tool === 'eraser' || tool === 'shape' ? (tool === 'eraser' ? '#5f6368' : color) : '#1967d2') : '#5f6368'),
                    // Note: Eraser color usually stays grey or reflects selection if we treat it as a tool. 
                    // Jamboard keeps eraser icon grey even when active, or blue. Let's stick to blue for active tool concept.
                    // Actually previous logic was: active ? (tool===pen || tool===shape ? color : blue) : grey.
                    // For Eraser, we probably just want blue indicating active.
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
            >
                <Icon size={20} style={{stroke: active && tool === 'eraser' ? '#1967d2' : undefined}}/>
            </button>
            {hasMore && <div style={{ position: 'absolute', right: 2, bottom: 2, fontSize: 8, color: '#5f6368' }}>▶</div>}
            {active && <div style={{ position: 'absolute', left: -4, top: '50%', transform: 'translateY(-50%)', width: 3, height: 20, background: '#1967d2', borderRadius: '0 2px 2px 0' }} />}
        </div>
    )

    return (
        <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', background: '#f8f9fa', fontFamily: 'Roboto, Arial, sans-serif' }}>
            
            {/* Top Bar */}
            <div style={styles.topBar}>
                <div style={styles.topLeft}>
                    <div style={styles.logo}>
                         <div style={{color: 'white', fontWeight: 'bold', fontSize: 24}}>J</div>
                    </div>
                    <div style={styles.titleGroup}>
                        <div style={styles.docTitle}>Untitled Jam</div>
                    </div>
                </div>

                <div style={styles.topCenter}>
                    {/* Pagination omitted for brevity, logic exists */}
                     <div style={styles.pagination}>
                        <button style={styles.pageBtn}><ChevronLeft size={16} /></button>
                        <div style={styles.pageIndicator}>1 / 1</div>
                        <button style={styles.pageBtn}><ChevronRight size={16} /></button>
                    </div>
                </div>

                <div style={styles.topRight}>
                    <button style={{...styles.iconBtn, opacity: history.length ? 1 : 0.3}} onClick={undo} disabled={history.length===0}><Undo size={20} /></button>
                    <button style={{...styles.iconBtn, opacity: future.length ? 1 : 0.3}} onClick={redo} disabled={future.length===0}><Redo size={20} /></button>
                    <button style={styles.iconBtn} onClick={cycleZoom}>
                        <ZoomIn size={20} style={{marginRight: 4}} />
                        <span style={{fontSize: 12}}>{Math.round(zoom * 100)}%</span>
                    </button>
                    <div style={styles.separator} />
                    <button style={{...styles.shareBtn, background: '#fff', color: '#3c4043', border: '1px solid #dadce0'}} onClick={downloadBoard}>
                        <Download size={16} style={{marginRight: 8}} />
                        Download
                    </button>
                    <button style={{...styles.shareBtn, marginLeft: 12}}>
                        <Check size={16} style={{marginRight: 8}} />
                        Save
                    </button>
                </div>
            </div>

            {/* Workspace */}
            <div style={styles.workspace}>
                {/* Left Toolbar */}
                <div style={styles.toolbar}>
                    <ToolbarTool active={tool === 'pen'} icon={Pen} onClick={() => { if(tool==='pen') setShowPenMenu(!showPenMenu); else { setTool('pen'); setShowPenMenu(true); setShowEraserMenu(false); }}} hasMore />
                    <ToolbarTool active={tool === 'eraser'} icon={Eraser} onClick={() => { if(tool==='eraser') setShowEraserMenu(!showEraserMenu); else { setTool('eraser'); setShowEraserMenu(true); setShowPenMenu(false); }}} hasMore />
                    <ToolbarTool active={tool === 'select'} icon={MousePointer} onClick={() => setTool('select')} />
                    <ToolbarTool active={tool === 'note'} icon={StickyNote} onClick={openStickyModal} />
                    <ToolbarTool active={tool === 'image'} icon={ImageIcon} onClick={triggerImageUpload} />
                    <ToolbarTool active={tool === 'shape'} icon={Circle} onClick={() => { if(tool==='shape') setShowShapeMenu(!showShapeMenu); else { setTool('shape'); setShowShapeMenu(true) }}} hasMore />
                    <ToolbarTool active={tool === 'text'} icon={Type} onClick={addTextBox} />
                    {/* Trash Button */}
                    <div style={{height: 1, background: '#dadce0', width: 20, alignSelf: 'center', margin: '4px 0'}} />
                    <ToolbarTool active={false} icon={Trash2} onClick={handleClearBoard} isDangerous />
                </div>
                
                {/* Hidden File Input */}
                <input ref={fileInputRef} type="file" accept="image/*" style={{display: 'none'}} onChange={handleImageUpload} />

                {/* Pen Menu */}
                {showPenMenu && tool === 'pen' && (
                    <div style={styles.popupMenu}>
                        <div style={styles.brushRow}>
                            {(['pen', 'marker', 'highlighter', 'brush'] as BrushType[]).map(t => (
                                <div key={t} onClick={() => setBrushType(t)} style={{...styles.brushBtn, background: brushType === t ? '#e8f0fe' : 'transparent'}}>
                                    <div style={{
                                        width: '80%', height: t==='pen'?2 : t==='marker'?4 : t==='highlighter'?10 : 5, 
                                        background: color, borderRadius: 2, opacity: t==='highlighter'?0.4 : t==='brush'?0.6 : 1,
                                        transform: 'rotate(-45deg)'
                                    }} />
                                </div>
                            ))}
                        </div>
                        <div style={styles.colorRow}>
                            {colors.map(c => (
                                <div key={c} onClick={() => setColor(c)} style={{
                                    ...styles.colorBtn, background: c,
                                    border: color === c ? '2px solid #1a73e8' : '2px solid transparent'
                                }}>
                                    {color === c && <div style={{width: 6, height: 6, background: c==='#ffffff'?'#000':'#fff', borderRadius: '50%'}} />}
                                </div>
                            ))}
                            {/* Custom Color Picker */}
                            <label style={{...styles.colorBtn, border: '2px solid #dadce0', position: 'relative', overflow: 'hidden'}}>
                                <Plus size={16} />
                                <input 
                                    type="color" 
                                    value={color} 
                                    onChange={(e) => { setColor(e.target.value); setShowPenMenu(true); }} // Keep menu open
                                    style={{position: 'absolute', top:0, left:0, width:'130%', height:'130%', cursor: 'pointer', opacity: 0}} 
                                />
                            </label>
                        </div>
                    </div>
                )}

                {/* Eraser Menu */}
                {showEraserMenu && tool === 'eraser' && (
                    <div style={{...styles.popupMenu, top: '30%'}}>
                         <div style={{display: 'flex', gap: 12, alignItems: 'center'}}>
                            {eraserSizes.map(size => (
                                <div key={size} onClick={() => setEraserWidth(size)} style={{
                                    ...styles.brushBtn, 
                                    background: eraserWidth === size ? '#e8f0fe' : 'transparent',
                                    border: eraserWidth === size ? '1px solid #1a73e8' : '1px solid transparent'
                                }}>
                                    <div style={{
                                        width: size/2, height: size/2, 
                                        background: '#5f6368', borderRadius: '50%'
                                    }} />
                                </div>
                            ))}
                         </div>
                    </div>
                )}

                {showShapeMenu && (
                    <div style={{...styles.popupMenu, top: 320}}>
                        <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8}}>
                            <div onClick={() => addShape('circle')} style={styles.shapeBtn}><div style={{width: 20, height: 20, border: '2px solid #5f6368', borderRadius: '50%'}} /></div>
                            <div onClick={() => addShape('square')} style={styles.shapeBtn}><div style={{width: 20, height: 20, border: '2px solid #5f6368'}} /></div>
                            <div onClick={() => addShape('triangle')} style={styles.shapeBtn}><div style={{width: 0, height: 0, borderLeft: '10px solid transparent', borderRight: '10px solid transparent', borderBottom: '20px solid #5f6368'}} /></div>
                            <div onClick={() => addShape('diamond')} style={styles.shapeBtn}><div style={{width: 16, height: 16, border: '2px solid #5f6368', transform: 'rotate(45deg)'}} /></div>
                            <div onClick={() => addShape('rounded_rect')} style={styles.shapeBtn}><div style={{width: 20, height: 16, border: '2px solid #5f6368', borderRadius: 4}} /></div>
                            <div onClick={() => addShape('half_circle')} style={styles.shapeBtn}><div style={{width: 20, height: 10, border: '2px solid #5f6368', borderRadius: '20px 20px 0 0', borderBottom: 'none'}} /></div>
                            <div onClick={() => addShape('bar')} style={styles.shapeBtn}><div style={{width: 20, height: 12, border: '2px solid #5f6368', borderRadius: 2}} /></div>
                            <div onClick={() => addShape('arrow')} style={styles.shapeBtn}><div style={{width:20, height: 20, display: 'flex', alignItems: 'center'}}><div style={{width: 12, height: 2, background: '#5f6368'}} /><div style={{width: 0, height: 0, borderLeft: '6px solid #5f6368', borderTop: '4px solid transparent', borderBottom: '4px solid transparent'}} /></div></div>
                        </div>
                    </div>
                )}
                
                {/* Sticky Note Modal */}
                {showStickyModal && (
                    <div style={styles.modalOverlay}>
                        <div style={{...styles.modalContent, background: stickyColor}}>
                            <textarea 
                                autoFocus
                                value={stickyText}
                                onChange={(e) => setStickyText(e.target.value)}
                                placeholder="New Note"
                                style={styles.stickyInput}
                            />
                            <div style={styles.stickyControls}>
                                <div style={styles.colorRow}>
                                    {noteColors.map(c => (
                                        <div key={c} onClick={() => setStickyColor(c)} style={{
                                            ...styles.colorBtn, background: c,
                                            border: stickyColor === c ? '2px solid #1967d2' : '2px solid transparent'
                                        }} />
                                    ))}
                                </div>
                                <div style={{display: 'flex', gap: 12}}>
                                    <button onClick={() => setShowStickyModal(false)} style={{background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 500}}>Cancel</button>
                                    <button onClick={confirmStickyNote} style={{background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 500, color: '#1967d2'}}>Save</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Canvas Area */}
                <div ref={containerRef} style={{...styles.canvasArea, overflow: 'hidden'}}>
                    <div style={{
                        width: '100%', height: '100%', position: 'relative',
                        transform: `scale(${zoom})`, transformOrigin: 'top left',
                        transition: 'transform 0.2s ease-out'
                    }}>
                         <canvas ref={canvasRef} style={{...styles.canvas, touchAction: 'none'}}
                            onPointerDown={handlePointerDown}
                            onPointerMove={handlePointerMove}
                            onPointerUp={handlePointerUp}
                         />
                         
                         {/* Objects Layer */}
                         <div style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: tool === 'select' ? 'auto' : 'none'}}>
                            {objects.map(obj => (
                                <DraggableObject key={obj.id} obj={obj} tool={tool} updateObject={updateObject} saveCheckpoint={saveCheckpoint} />
                            ))}
                         </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

const DraggableObject = ({ obj, tool, updateObject, saveCheckpoint }: any) => {
    const isSelected = tool === 'select'
    const [isEditing, setIsEditing] = useState(false)
    const [tempContent, setTempContent] = useState(obj.content || "")
    const inputRef = useRef<HTMLInputElement>(null)

    const handleDrag = (e: React.MouseEvent) => {
        if (!isSelected || isEditing) return
        e.preventDefault() // Stop text selection
        
        saveCheckpoint() // Save before drag starts

        const startX = e.clientX
        const startY = e.clientY
        const initX = obj.x
        const initY = obj.y

        const onMove = (me: MouseEvent) => {
             updateObject({ ...obj, x: initX + (me.clientX - startX), y: initY + (me.clientY - startY) })
        }
        const onUp = () => {
            window.removeEventListener('mousemove', onMove as any)
            window.removeEventListener('mouseup', onUp)
        }
        window.addEventListener('mousemove', onMove as any)
        window.addEventListener('mouseup', onUp)
    }

    const handleDoubleClick = () => {
        if (isSelected && (obj.type === 'text' || obj.type === 'note')) {
            setIsEditing(true)
            setTempContent(obj.content || "")
            // setTimeout(() => inputRef.current?.focus(), 10)
        }
    }

    const handleBlur = () => {
        setIsEditing(false)
        updateObject({ ...obj, content: tempContent })
    }

    if (obj.type === 'note') {
        return (
            <div onMouseDown={handleDrag} onDoubleClick={handleDoubleClick} style={{
                position: 'absolute', left: obj.x, top: obj.y,
                width: 200, height: 200, background: obj.color,
                boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
                padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Caveat, cursive', fontSize: 24, textAlign: 'center',
                cursor: isSelected ? 'grab' : 'default', userSelect: 'none'
            }}>
                {isEditing ? (
                     <textarea 
                        autoFocus
                        value={tempContent}
                        onChange={(e) => setTempContent(e.target.value)}
                        onBlur={handleBlur}
                        style={{width: '100%', height: '100%', background: 'transparent', border: 'none', resize: 'none', fontFamily: 'inherit', fontSize: 'inherit', textAlign: 'center', outline: 'none'}}
                     />
                ) : obj.content}
            </div>
        )
    }

    if (obj.type === 'shape') {
        const shapeStyles: any = {
             circle: { borderRadius: '50%' },
             square: {}, // Default
             rounded_rect: { borderRadius: 12 },
             diamond: { transform: 'rotate(45deg)' }
             // Complex shapes like triangle/arrow need SVG or clip-path
        }
        
        const isComplex = ['triangle', 'arrow', 'half_circle', 'bar'].includes(obj.shapeType)
        
        return (
            <div onMouseDown={handleDrag} style={{
                position: 'absolute', left: obj.x, top: obj.y,
                width: obj.width, height: obj.height,
                cursor: isSelected ? 'grab' : 'default',
            }}> 
                {isComplex ? (
                     <ShapeSvg type={obj.shapeType} color={obj.color} width={obj.width} height={obj.height} />
                ) : (
                    <div style={{
                        width: '100%', height: '100%', border: '2px solid #000',
                        ...shapeStyles[obj.shapeType || 'square']
                    }} />
                )}
            </div>
        )
    }
    
    if (obj.type === 'image') {
        return (
            <div onMouseDown={handleDrag} style={{
                position: 'absolute', left: obj.x, top: obj.y,
                width: obj.width, height: obj.height,
                cursor: isSelected ? 'grab' : 'default',
                boxShadow: isSelected ? '0 0 0 2px #1a73e8' : 'none'
            }}>
                <img src={obj.content} style={{width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none'}} />
            </div>
        )
    }

    if (obj.type === 'text') {
        return (
             <div onMouseDown={handleDrag} onDoubleClick={handleDoubleClick} style={{
                position: 'absolute', left: obj.x, top: obj.y,
                color: obj.color === 'transparent' ? 'black' : obj.color,
                fontSize: 32, fontWeight: 'bold', fontFamily: 'sans-serif',
                cursor: isSelected ? 'grab' : 'default', whiteSpace: 'nowrap',
                minWidth: 50, minHeight: 40
            }}>
                {isEditing ? (
                    <input 
                        autoFocus
                        ref={inputRef}
                        value={tempContent}
                        onChange={(e) => setTempContent(e.target.value)}
                        onBlur={handleBlur}
                        style={{
                            background: 'transparent', border: 'none', outline: '2px solid #1a73e8', 
                            fontFamily: 'inherit', fontSize: 'inherit', fontWeight: 'inherit', color: 'inherit'
                        }} 
                    />
                ) : obj.content}
            </div>
        )
    }

    return null
}

const ShapeSvg = ({ type, color, width, height }: any) => {
    // Simple SVG renderers for complex shapes
    if (type === 'triangle') {
        return (
             <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                 <path d="M50 5 L95 95 L5 95 Z" fill="transparent" stroke="black" strokeWidth="4" />
             </svg>
        )
    }
    if (type === 'arrow') {
        return (
             <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                 <path d="M10 40 L60 40 L60 20 L95 50 L60 80 L60 60 L10 60 Z" fill="transparent" stroke="black" strokeWidth="4" />
             </svg>
        )
    }
    if (type === 'half_circle') {
         return (
             <div style={{width: '100%', height: '50%', border: '2px solid black', borderBottom: 'none', borderRadius: '100px 100px 0 0', marginTop: '50%'}} />
         )
    }
    if (type === 'bar') {
        return <div style={{width: '100%', height: '100%', border: '2px solid black', borderRadius: 4}} />
    }
    return null
}

// Utils
function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
    const words = text.split(' ');
    let line = '';

    for(let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, x, y);
        line = words[n] + ' ';
        y += lineHeight;
      }
      else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, y);
}

function drawShapeOnContext(ctx: CanvasRenderingContext2D, obj: BoardObject) {
    // Basic Shape Render on Canvas for Export
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 2
    if (obj.shapeType === 'circle') {
        ctx.beginPath(); ctx.ellipse(50, 50, 50, 50, 0, 0, Math.PI*2); ctx.stroke();
    } else if (obj.shapeType === 'triangle') {
        ctx.beginPath(); ctx.moveTo(50, 0); ctx.lineTo(100, 100); ctx.lineTo(0, 100); ctx.closePath(); ctx.stroke();
    } else {
        ctx.strokeRect(0, 0, obj.width||100, obj.height||100)
    }
}

const styles: any = {
    topBar: {
        height: 64, background: 'white', borderBottom: '1px solid #dadce0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px'
    },
    topLeft: { display: 'flex', alignItems: 'center', gap: 16 },
    logo: { 
        width: 40, height: 40, background: '#fbbc04', borderRadius: 8,
        display: 'flex', alignItems: 'center', justifyContent: 'center'
    },
    titleGroup: { display: 'flex', flexDirection: 'column' },
    docTitle: { fontSize: 18, color: '#202124', fontWeight: 500 },
    
    topCenter: { position: 'absolute', left: '50%', transform: 'translateX(-50%)' },
    pagination: {
        display: 'flex', alignItems: 'center', background: '#f1f3f4',
        borderRadius: 4, border: '1px solid #dadce0', padding: 2
    },
    pageBtn: { background: 'transparent', border: 'none', padding: '4px 8px', cursor: 'pointer', color: '#5f6368', display: 'flex' },
    pageIndicator: { fontSize: 14, fontWeight: 500, color: '#3c4043', padding: '0 8px' },

    topRight: { display: 'flex', alignItems: 'center', gap: 12 },
    iconBtn: { background: 'transparent', border: 'none', padding: 8, cursor: 'pointer', color: '#5f6368', display: 'flex' },
    separator: { width: 1, height: 24, background: '#dadce0', margin: '0 4px' },
    meetIcon: { width: 24, height: 24, border: '1px solid #dadce0', borderRadius: 4, background: 'linear-gradient(135deg, #00ac47 50%, #0066da 50%)', opacity: 0.5 }, 
    shareBtn: {
        background: '#1a73e8', color: 'white', border: 'none', borderRadius: 4,
        padding: '8px 16px', fontSize: 14, fontWeight: 500, cursor: 'pointer',
        display: 'flex', alignItems: 'center'
    },
    avatar: {
        width: 32, height: 32, background: '#a50e0e', color: 'white', borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 'bold'
    },

    workspace: { flex: 1, position: 'relative', display: 'flex', justifyContent: 'center', paddingTop: 30, overflow: 'hidden' },
    toolbar: {
        position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
        background: 'white', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
        display: 'flex', flexDirection: 'column', padding: '0 8px', gap: 4, zIndex: 20, minWidth: 50
    },
    canvasArea: {
        width: '95%', height: '92%', background: 'white',
        boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
        position: 'relative', overflow: 'hidden'
    },
    canvas: { width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 },
    
    popupMenu: {
        position: 'absolute', left: 80, top: '42%',
        background: 'white', borderRadius: 4, boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
        padding: 16, display: 'flex', flexDirection: 'column', gap: 16, zIndex: 100
    },
    brushRow: { display: 'flex', gap: 12, borderBottom: '1px solid #dadce0', paddingBottom: 16 },
    brushBtn: { width: 32, height: 32, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
    colorRow: { display: 'flex', gap: 12 },
    colorBtn: { width: 24, height: 24, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' },
    
    shapeBtn: { width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },

    modalOverlay: {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999
    },
    modalContent: {
        width: 400, height: 300, padding: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        display: 'flex', flexDirection: 'column', gap: 16
    },
    stickyInput: {
        flex: 1, background: 'transparent', border: 'none', resize: 'none',
        fontSize: 24, fontFamily: 'Caveat, cursive', outline: 'none', textAlign: 'center'
    },
    stickyControls: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }
}

export default Whiteboard
