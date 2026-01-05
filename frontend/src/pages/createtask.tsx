import { useState } from "react"
import axios from "axios"

const API = "/api"

export default function CreateTask() {
  const [metadataHash, setMetadataHash] = useState("")
  const [deadline, setDeadline] = useState("")
  const [gracePeriod, setGracePeriod] = useState("86400")
  const [priority, setPriority] = useState("1")
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState("")

  async function handleCreate() {
    try {
      setError("")
      const deadlineTimestamp = Math.floor(new Date(deadline).getTime() / 1000)

      const res = await axios.post(`${API}/task/create`, {
        metadataHash: metadataHash || "0x1234567890123456789012345678901234567890123456789012345678901234",
        deadline: deadlineTimestamp,
        gracePeriod: parseInt(gracePeriod),
        priority: parseInt(priority)
      })

      setResult(res.data)
    } catch (err: any) {
      setError(err.response?.data?.error || err.message)
    }
  }

  return (
    <div style={{ fontFamily: "Arial", padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h1>TaskChain - Create Task</h1>

      <div style={{ marginBottom: "20px" }}>
        <label style={{ display: "block", marginBottom: "5px" }}>Metadata Hash (bytes32):</label>
        <input
          value={metadataHash}
          onChange={e => setMetadataHash(e.target.value)}
          placeholder="0x1234...1234 (leave empty for default)"
          style={{ width: "100%", padding: "8px", fontSize: "14px" }}
        />
      </div>

      <div style={{ marginBottom: "20px" }}>
        <label style={{ display: "block", marginBottom: "5px" }}>Deadline:</label>
        <input
          type="datetime-local"
          value={deadline}
          onChange={e => setDeadline(e.target.value)}
          style={{ width: "100%", padding: "8px", fontSize: "14px" }}
        />
      </div>

      <div style={{ marginBottom: "20px" }}>
        <label style={{ display: "block", marginBottom: "5px" }}>Grace Period (seconds):</label>
        <input
          type="number"
          value={gracePeriod}
          onChange={e => setGracePeriod(e.target.value)}
          style={{ width: "100%", padding: "8px", fontSize: "14px" }}
        />
      </div>

      <div style={{ marginBottom: "20px" }}>
        <label style={{ display: "block", marginBottom: "5px" }}>Priority (0-255):</label>
        <input
          type="number"
          value={priority}
          onChange={e => setPriority(e.target.value)}
          min="0"
          max="255"
          style={{ width: "100%", padding: "8px", fontSize: "14px" }}
        />
      </div>

      <button
        onClick={handleCreate}
        style={{ padding: "10px 20px", cursor: "pointer", fontSize: "16px" }}
      >
        Create Task
      </button>

      {result && (
        <pre style={{ background: "#d4edda", padding: "15px", borderRadius: "5px", marginTop: "20px" }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      )}

      {error && (
        <pre style={{ background: "#f8d7da", padding: "15px", borderRadius: "5px", marginTop: "20px", color: "red" }}>
          {error}
        </pre>
      )}
    </div>
  )
}
