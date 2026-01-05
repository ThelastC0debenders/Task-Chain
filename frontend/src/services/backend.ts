import { BACKEND_URL } from "../config/backend"

export async function anchorReceipt(taskId: number, completedBy: string) {
  const res = await fetch(`${BACKEND_URL}/receipt/anchor`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ taskId, completedBy }),
  })

  if (!res.ok) {
    throw new Error("Backend error")
  }

  return res.json()
}

export async function fetchFromIPFS(cid: string) {
  const res = await fetch(`${BACKEND_URL}/ipfs/${cid}`)
  return res.json()
}
