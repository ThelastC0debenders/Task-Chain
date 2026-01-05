import dotenv from "dotenv"

// Load env before importing modules that consume env vars
dotenv.config()

import app from "./app"

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
