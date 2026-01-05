import { Router } from "express"
import * as calendarService from "../services/calendar"

const router = Router()

router.get("/", (req, res) => {
    try {
        const events = calendarService.getEvents()
        res.json({ events })
    } catch (err: any) {
        res.status(500).json({ error: err.message })
    }
})

router.post("/", (req, res) => {
    try {
        const evt = calendarService.createEvent(req.body)
        res.json({ event: evt })
    } catch (err: any) {
        res.status(500).json({ error: err.message })
    }
})

export default router
