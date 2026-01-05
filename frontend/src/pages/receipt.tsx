import { useEffect, useState } from "react"
import { fetchFromIPFS } from "../services/backend"

export default function Receipt() {
  const [receipt, setReceipt] = useState<any>(null)

  useEffect(() => {
    fetchFromIPFS("PASTE_CID_HERE").then(setReceipt)
  }, [])

  return <pre>{JSON.stringify(receipt, null, 2)}</pre>
}
