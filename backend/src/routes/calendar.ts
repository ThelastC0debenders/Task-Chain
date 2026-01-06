import { Router } from "express"
import * as calendarService from "../services/calendar"
import { contextExtractor, calendarExtractor } from "../services/graph/nodes"
import { HumanMessage } from "@langchain/core/messages"

const router = Router()

router.get("/", async (req, res) => {
  try {
    const events = await calendarService.getEvents()
    res.json(events)
  } catch (err: any) {
    console.error(err)
    res.status(500).json([])
  }
})

router.post("/", async (req, res) => {
  try {
    const evt = await calendarService.createEvent(req.body)
    res.json(evt)
  } catch (err: any) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

router.post("/sync-graph", async (req, res) => {
  try {
    // 1. Fetch Events
    const events = await calendarService.getEvents()

    let processedCount = 0

    // 2. Process each event
    for (const event of events) {
      const messageContent = calendarService.formatEventAsMessage(event)

      // Construct minimal state for extractor
      const state = {
        messages: [new HumanMessage(messageContent)],
        knowledgeNodes: [],
        knowledgeEdges: [],
        intent: null,
        searchResults: []
      }

      // Call the DEDICATED calendar extractor
      await calendarExtractor(state)
      processedCount++
    }

    res.json({ success: true, processed: processedCount })

  } catch (err: any) {
    console.error("Graph Sync Error:", err)
    res.status(500).json({ error: err.message })
  }
})

export default router
