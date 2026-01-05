import { useState } from "react"
import axios from "axios"
import { connectWallet } from "../services/wallet"

const API = "http://localhost:5000"

export default function Leader() {
  const [teamId, setTeamId] = useState("team-123")
  const [ttlSeconds, setTtlSeconds] = useState("3600")
  const [address, setAddress] = useState("")
  const [inviteUrl, setInviteUrl] = useState("")
  const [token, setToken] = useState("")
  const [status, setStatus] = useState("")

  async function handleGenerate() {
    try {
      setStatus("Connecting wallet…")
      const { address } = await connectWallet()
      setAddress(address)

      setStatus("Creating invite…")
      const res = await axios.post(`${API}/team/invite`, {
        teamId,
        ttlSeconds: Number(ttlSeconds) || 3600,
      })
      setInviteUrl(res.data.inviteUrl)
      setToken(res.data.token)
      setStatus("Invite created")
    } catch (err: any) {
      setStatus(err.response?.data?.error || err.message)
    }
  }

  return (
    <div style={{ fontFamily: "Arial", padding: "20px", maxWidth: "700px", margin: "0 auto" }}>
      <h1>Team Leader: Generate Invite</h1>
      <p>Connect wallet, choose team, and generate a one-click invite link.</p>

      <div style={{ display: "grid", gap: "10px", maxWidth: "400px" }}>
        <label>
          <div>Team ID</div>
          <input
            value={teamId}
            onChange={e => setTeamId(e.target.value)}
            style={{ width: "100%", padding: "8px" }}
          />
        </label>
        <label>
          <div>TTL (seconds)</div>
          <input
            type="number"
            value={ttlSeconds}
            onChange={e => setTtlSeconds(e.target.value)}
            style={{ width: "100%", padding: "8px" }}
          />
        </label>
        <button
          onClick={handleGenerate}
          style={{ padding: "10px 16px", cursor: "pointer", fontSize: "16px" }}
        >
          Connect & Generate
        </button>
      </div>

      {status && (
        <div style={{ marginTop: "12px", padding: "10px", background: "#f4f4f4", borderRadius: "6px" }}>
          <div><strong>Status:</strong> {status}</div>
          {address && <div><strong>Leader Wallet:</strong> {address}</div>}
        </div>
      )}

      {inviteUrl && (
        <div style={{ marginTop: "16px", padding: "12px", background: "#e8f5ff", borderRadius: "6px" }}>
          <div style={{ fontWeight: 600 }}>Invite URL</div>
          <div style={{ wordBreak: "break-all", marginTop: "6px" }}>{inviteUrl}</div>
          <div style={{ fontSize: "12px", opacity: 0.8, marginTop: "6px" }}>Token:</div>
          <div style={{ wordBreak: "break-all" }}>{token}</div>
        </div>
      )}
    </div>
  )}
