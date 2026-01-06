import app from "./app"
import { indexer } from "./services/indexer"

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`)
  indexer.startListening()
})
