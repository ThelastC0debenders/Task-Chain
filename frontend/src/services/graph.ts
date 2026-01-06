import axios from "axios"

const GRAPH_URL = "/api/graph"
const CALENDAR_URL = "/api/calendar"

export interface KnowledgeNode {
    id: string
    type: string
    content: string
}

export interface KnowledgeEdge {
    source: string
    target: string
    type: string
}

export interface GraphData {
    knowledgeNodes: KnowledgeNode[]
    knowledgeEdges: KnowledgeEdge[]
}

export async function getGraph(showCalendar: boolean = false): Promise<GraphData> {
    const res = await axios.get(`${GRAPH_URL}?showCalendar=${showCalendar}`)
    return res.data
}

export async function syncCalendar() {
    const res = await axios.post(`${CALENDAR_URL}/sync-graph`)
    return res.data
}
