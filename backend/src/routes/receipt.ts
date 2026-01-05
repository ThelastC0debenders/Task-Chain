import { Router } from "express"
import { anchorReceipt } from "../services/chain"

const router = Router()

router.post("/anchor", async (req, res) => {
  try {
    const { taskId, receiptHash, ipfsCid } = req.body
    const txHash = await anchorReceipt(taskId, receiptHash || "0x" + "0".repeat(64), ipfsCid || "")
    res.json({ taskId, txHash })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

export default router
