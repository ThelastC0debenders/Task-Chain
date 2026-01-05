import { useEffect, useState } from "react"
import { connectWallet } from "../services/wallet"
import { getContract, getTask, completeTask } from "../services/contract"
import { anchorReceipt } from "../services/backend"

export default function TaskView() {
  const [task, setTask] = useState<any>(null)

  async function load() {
    const { signer, address } = await connectWallet()
    const contract = getContract(signer)
    const t = await getTask(contract, 1)
    setTask(t)

    if (!t.completed) {
      await completeTask(contract, 1)
      await anchorReceipt(1, address)
    }
  }

  useEffect(() => {
    load()
  }, [])

  if (!task) return null
  return <pre>{JSON.stringify(task, null, 2)}</pre>
}
