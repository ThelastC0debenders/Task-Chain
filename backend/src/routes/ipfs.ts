import { Router } from "express"
import { uploadJSON, getJSON } from "../services/ipfs"

const router = Router()

router.post("/upload", async (req, res) => {
  const cid = await uploadJSON(req.body)
  res.json({ cid })
})

router.get("/:cid", async (req, res) => {
  const data = await getJSON(req.params.cid)
  res.json(data)
})

export default router
