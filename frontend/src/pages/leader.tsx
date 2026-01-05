import { useState } from "react"
import axios from "axios"
import { connectWallet } from "../services/wallet"

const API = "/api"

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
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Team Leader: Generate Invite</h1>
        <p style={styles.subtitle}>Connect wallet, choose team, and generate a one-click invite link.</p>

        <div style={styles.formGroup}>
          <label style={styles.label}>TEAM ID</label>
          <input
            value={teamId}
            onChange={e => setTeamId(e.target.value)}
            style={styles.input}
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>TTL (SECONDS)</label>
          <input
            type="number"
            value={ttlSeconds}
            onChange={e => setTtlSeconds(e.target.value)}
            style={styles.input}
          />
        </div>

        <button onClick={handleGenerate} style={styles.button}>
          Connect & Generate
        </button>

        {status && (
          <div style={styles.statusBox}>
            <div><strong>Status:</strong> {status}</div>
            {address && <div><strong>Leader Wallet:</strong> {address}</div>}
          </div>
        )}

        {inviteUrl && (
          <div style={styles.inviteBox}>
            <div style={styles.inviteLabel}>Invite URL</div>
            <div style={styles.code}>{inviteUrl}</div>
            <div style={{ ...styles.inviteLabel, marginTop: '10px' }}>Token:</div>
            <div style={styles.code}>{token}</div>
          </div>
        )}
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "#050505",
    color: "#e0e0e0",
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
  },
  card: {
    background: "#0a0a0a",
    border: "1px solid #1f1f1f",
    padding: "40px",
    borderRadius: "12px",
    maxWidth: "500px",
    width: "100%",
  },
  title: {
    fontSize: "20px",
    fontWeight: "bold",
    color: "#fff",
    marginBottom: "10px",
  },
  subtitle: {
    fontSize: "12px",
    color: "#888",
    marginBottom: "30px",
  },
  formGroup: { marginBottom: "20px" },
  label: {
    display: "block",
    color: "#666",
    fontSize: "10px",
    fontWeight: "bold",
    marginBottom: "8px",
    textTransform: "uppercase" as const,
  },
  input: {
    width: "100%",
    background: "#0f0f0f",
    border: "1px solid #2a2a2a",
    padding: "12px",
    color: "white",
    borderRadius: "6px",
    fontSize: "14px",
    fontFamily: "inherit",
    boxSizing: "border-box" as const,
  },
  button: {
    width: "100%",
    background: "#00ff88",
    color: "#000",
    border: "none",
    padding: "12px",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: "bold",
    cursor: "pointer",
    marginTop: "10px",
    textTransform: "uppercase" as const,
  },
  statusBox: {
    marginTop: "20px",
    padding: "15px",
    background: "#0e0e0e",
    border: "1px solid #1f1f1f",
    borderRadius: "6px",
    fontSize: "12px",
    color: "#888",
  },
  inviteBox: {
    marginTop: "20px",
    padding: "15px",
    background: "rgba(0, 255, 136, 0.05)",
    border: "1px solid #004422",
    borderRadius: "6px",
  },
  inviteLabel: {
    fontSize: "10px",
    fontWeight: "bold",
    color: "#00ff88",
    marginBottom: "4px",
    textTransform: "uppercase" as const,
  },
  code: {
    fontFamily: "monospace",
    wordBreak: "break-all" as const,
    fontSize: "12px",
    color: "#ccc",
  },
}
