import { Router } from "express"
import { connectToMongo } from "../config/mongo"

const router = Router()

router.get("/", async (req, res) => {
    try {
        const { knowledgeNodes, knowledgeEdges } = await connectToMongo()
        const showCalendar = req.query.showCalendar === 'true'

        const nodeQuery = showCalendar ? {} : { "metadata.source": { $ne: 'calendar' } }

        const nodes = await knowledgeNodes.find(nodeQuery).toArray()
        // Determine edge filtering strategy:
        // Ideally filter edges where source/target nodes are excluded.
        // For now, fetching all edges is acceptable as React Flow handles missing nodes well,
        // or we can just return them. Strict edge filtering would require finding all valid node IDs first.
        const edges = await knowledgeEdges.find({}).toArray()

        // Clean up _id for frontend
        const safeNodes = nodes.map((n: any) => {
            const { _id, ...rest } = n
            return rest
        })

        const safeEdges = edges.map((e: any) => {
            const { _id, ...rest } = e
            return rest
        })

        res.json({
            knowledgeNodes: safeNodes,
            knowledgeEdges: safeEdges
        })
    } catch (err: any) {
        console.error(err)
        res.status(500).json({ error: err.message })
    }
})

export default router
