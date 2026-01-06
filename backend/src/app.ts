import express from "express"
import cors from "cors"
import routes from "./routes/export"

const app = express()

app.use(cors())
app.use(express.json({ limit: "50mb" }))
app.use(express.urlencoded({ limit: "50mb" }))

app.use("/ipfs", routes.ipfsRoutes)
app.use("/receipt", routes.receiptRoutes)
app.use("/task", routes.taskRoutes)
app.use("/team", routes.teamRoutes)
app.use("/workspace", routes.workspaceRoutes)
app.use("/clickup", routes.clickupRoutes)
app.use("/chat", routes.chatRoutes)
app.use("/board", routes.boardRoutes)
app.use("/calendar", routes.calendarRoutes)
app.use("/docs", routes.docsRoutes)
app.use("/graph", routes.graphRoutes)
app.use("/health", routes.healthRoutes)
app.use("/analytics", routes.analyticsRoutes)
app.use("/business", routes.businessRoutes)

export default app
