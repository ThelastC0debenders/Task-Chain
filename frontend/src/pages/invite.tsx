import { useEffect, useState } from "react"
import axios from "axios"
import { connectWallet } from "../services/wallet"

const API = "/api"

export default function Invite() {
  const [token, setToken] = useState<string>("")
  const [status, setStatus] = useState<string>("")
  const [teamId, setTeamId] = useState<string>("")
  const [wallet, setWallet] = useState<string>("")

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const t = params.get("token") || ""
    setToken(t)
    if (!t) setStatus("Invite token missing")
  }, [])

  async function handleJoin() {
    try {
      if (!token) {
        setStatus("Invite token missing")
        return
      }
      setStatus("Connecting wallet…")
      const { address } = await connectWallet()
      setWallet(address)
      setStatus("Joining team…")
      const res = await axios.post(`${API}/team/accept`, { token, wallet: address })
      setTeamId(res.data.teamId)
      setStatus(`Joined team ${res.data.teamId}`)
    } catch (err: any) {
      setStatus(err.response?.data?.error || err.message)
    }
  }

  return (
    <div style={{ fontFamily: "Arial", padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
      <h1>Join Team</h1>
      <p>This invite will add your connected wallet to the team.</p>

      <div style={{ margin: "12px 0", padding: "12px", background: "#1f1f1f", color: "#ddd", borderRadius: "6px" }}>
        <div style={{ fontSize: "12px", opacity: 0.8 }}>Token</div>
        <div style={{ wordBreak: "break-all" }}>{token || "(missing)"}</div>
      </div>

      <button
        onClick={handleJoin}
        disabled={!token || status.includes("Joining")}
        style={{ padding: "10px 16px", cursor: "pointer", fontSize: "16px" }}
      >
        Connect & Join
      </button>

      {status && (
        <div style={{ marginTop: "12px", padding: "10px", background: "#f4f4f4", borderRadius: "6px" }}>
          <div><strong>Status:</strong> {status}</div>
          {teamId && <div><strong>Team:</strong> {teamId}</div>}
          {wallet && <div><strong>Wallet:</strong> {wallet}</div>}
        </div>
      )}
    </div>
  )
}
