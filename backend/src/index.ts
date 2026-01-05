import dotenv from "dotenv"
import { createServer } from "http"
import { initSocket } from "./socket"

// Load env before importing modules that consume env vars
dotenv.config()

import app from "./app"

const PORT = process.env.PORT || 5000

const httpServer = createServer(app)
initSocket(httpServer)

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
