export interface DrawElement {
    type: 'line'
    x0: number, y0: number, x1: number, y1: number
    color: string
    width: number
    cap?: CanvasLineCap
}

export interface BoardObject {
    id: string
    type: 'note' | 'text' | 'image' | 'shape'
    x: number
    y: number
    width?: number
    height?: number
    content?: string
    color?: string
    shapeType?: string
    rotation?: number
}

interface WhiteboardState {
    elements: DrawElement[]
    objects: BoardObject[]
}

// In-memory store: Map<RoomId, WhiteboardState>
const boards = new Map<string, WhiteboardState>()

export const getBoardState = (roomId: string): WhiteboardState => {
    if (!boards.has(roomId)) {
        boards.set(roomId, { elements: [], objects: [] })
    }
    return boards.get(roomId)!
}

export const addElement = (roomId: string, element: DrawElement) => {
    const board = getBoardState(roomId)
    board.elements.push(element)
    // Limit history size to prevent memory leaks in long sessions
    if (board.elements.length > 10000) {
        board.elements = board.elements.slice(-8000)
    }
}

export const updateObject = (roomId: string, obj: BoardObject) => {
    const board = getBoardState(roomId)
    const index = board.objects.findIndex(o => o.id === obj.id)
    if (index !== -1) {
        board.objects[index] = obj
    } else {
        board.objects.push(obj)
    }
}

export const clearBoard = (roomId: string) => {
    boards.set(roomId, { elements: [], objects: [] })
}
