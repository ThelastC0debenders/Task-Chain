import { Router } from "express"
import * as chatService from "../services/chat"

const router = Router()

router.get("/channels", (req, res) => {
    try {
        const userId = req.query.userId as string
        const channels = chatService.getChannels(userId)
        res.json({ channels })
    } catch (err: any) {
        res.status(500).json({ error: err.message })
    }
})

router.post("/channels", (req, res) => {
    try {
        const { name, type, members } = req.body
        const channel = chatService.createChannel(name, type, members)
        res.json({ channel })
    } catch (err: any) {
        res.status(500).json({ error: err.message })
    }
})

router.get("/messages/:channelId", (req, res) => {
    try {
        const list = chatService.getMessages(req.params.channelId)
        res.json({ messages: list })
    } catch (err: any) {
        res.status(500).json({ error: err.message })
    }
})

router.post("/messages/:channelId", (req, res) => {
    try {
        const { senderId, content } = req.body
        const msg = chatService.saveMessage(req.params.channelId, senderId, content)
        res.json({ message: msg })
    } catch (err: any) {
        res.status(500).json({ error: err.message })
    }
})

export default router
