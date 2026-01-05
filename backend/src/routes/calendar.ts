import { Router } from "express"
import * as calendarService from "../services/calendar"

const router = Router()

router.get("/", async (req, res) => {
  try {
    const events = await calendarService.getEvents()
    res.json(events)   // send ARRAY directly
  } catch (err: any) {
    console.error(err)
    res.status(500).json([])
  }
})

router.post("/", async (req, res) => {
  try {
    const evt = await calendarService.createEvent(req.body)
    res.json(evt)      // send OBJECT directly
  } catch (err: any) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

export default router
