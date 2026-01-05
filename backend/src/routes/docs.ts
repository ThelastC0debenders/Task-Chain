import { Router } from "express"
import * as docsService from "../services/docs"

const router = Router()

router.get("/", (req, res) => {
    try {
        const docs = docsService.getDocs()
        res.json({ docs })
    } catch (err: any) {
        res.status(500).json({ error: err.message })
    }
})

router.get("/:id", (req, res) => {
    try {
        const doc = docsService.getDoc(req.params.id)
        if (!doc) return res.status(404).json({ error: "Doc not found" })
        res.json({ doc })
    } catch (err: any) {
        res.status(500).json({ error: err.message })
    }
})

router.post("/", (req, res) => {
    try {
        const { title } = req.body
        const doc = docsService.createDoc(title)
        res.json({ doc })
    } catch (err: any) {
        res.status(500).json({ error: err.message })
    }
})

router.put("/:id", (req, res) => {
    try {
        const { content } = req.body
        const doc = docsService.updateDoc(req.params.id, content)
        res.json({ doc })
    } catch (err: any) {
        res.status(500).json({ error: err.message })
    }
})

export default router
