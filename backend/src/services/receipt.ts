import { uploadJSON } from "./ipfs"
import { anchorReceipt } from "./chain"
import { hashReceipt } from "../utils/hash"
import { now } from "../utils/time"

export async function createAndAnchorReceipt(payload: {
  taskId: number
  completedBy: string
}) {
  const receipt = {
    taskId: payload.taskId,
    completedBy: payload.completedBy,
    timestamp: now(),
  }

  const receiptHash = hashReceipt(receipt)
  const ipfsCid = await uploadJSON(receipt)
  const txHash = await anchorReceipt(payload.taskId, receiptHash, ipfsCid)

  return {
    taskId: payload.taskId,
    receiptHash,
    ipfsCid,
    txHash,
  }
}
