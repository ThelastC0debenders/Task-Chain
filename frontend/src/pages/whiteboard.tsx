import { useEffect, useRef, useState } from "react"
import { socket } from "../services/socket"

const Whiteboard = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isDrawing, setIsDrawing] = useState(false)
    const [color, setColor] = useState("#000000")
    const wbId = "default-wb"

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        // Resize
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight

        const ctx = canvas.getContext('2d')
        if (ctx) {
            ctx.lineCap = 'round'
            ctx.lineJoin = 'round'
            ctx.lineWidth = 2
        }

        socket.emit("join_whiteboard", wbId)

        socket.on("draw_update", (data: any) => {
            drawOnCanvas(data)
        })

        return () => { socket.off("draw_update") }
    }, [])

    const startDrawing = (e: React.MouseEvent) => {
        setIsDrawing(true)
        draw(e)
    }

    const stopDrawing = () => {
        setIsDrawing(false)
        const ctx = canvasRef.current?.getContext('2d')
        ctx?.beginPath()
    }

    const draw = (e: React.MouseEvent) => {
        if (!isDrawing) return
        const canvas = canvasRef.current
        if (!canvas) return

        const rect = canvas.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top

        // Emit event
        const data = { wbId, x, y, color, type: 'line' }
        socket.emit("draw", { wbId, elements: data })

        // Draw locally (could optimize by only drawing locally and suppressing socket echo)
        drawOnCanvas(data)
    }

    const drawOnCanvas = (data: any) => {
        const ctx = canvasRef.current?.getContext('2d')
        if (!ctx) return

        ctx.strokeStyle = data.color || color
        ctx.lineWidth = 2
        ctx.lineTo(data.x, data.y)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(data.x, data.y)
    }

    return (
        <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative', backgroundColor: '#fff' }}>
            <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseUp={stopDrawing}
                onMouseMove={draw}
                onMouseLeave={stopDrawing}
                style={{ cursor: 'crosshair' }}
            />

            <div style={{ position: 'absolute', top: 20, left: 20, backgroundColor: 'white', padding: 10, borderRadius: 8, boxShadow: '0 2px 10px rgba(0,0,0,0.1)', display: 'flex', gap: 10 }}>
                <input type="color" value={color} onChange={e => setColor(e.target.value)} />
                <button onClick={() => {
                    const ctx = canvasRef.current?.getContext('2d')
                    ctx?.clearRect(0, 0, 10000, 10000)
                }}>Clear</button>
            </div>
        </div>
    )
}

export default Whiteboard
