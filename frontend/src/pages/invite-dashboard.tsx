import { useEffect, useState } from "react"
import axios from "axios"
import { connectWallet } from "../services/wallet"

const API = "http://localhost:5000"

export default function InviteDashboard() {
  const [token, setToken] = useState<string>("")
  const [status, setStatus] = useState<string>("")
  const [teamId, setTeamId] = useState<string>("")
  const [wallet, setWallet] = useState<string>("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const t = params.get("token") || ""
    setToken(t)
    if (!t) setStatus("❌ Invite token missing from URL")
  }, [])

  async function handleJoin() {
    if (!token) {
      setStatus("❌ Invite token missing")
      return
    }
    try {
      setLoading(true)
      setStatus("🔌 Connecting wallet…")
      const { address } = await connectWallet()
      setWallet(address)
      
      setStatus("✓ Wallet connected. Joining team…")
      const res = await axios.post(`${API}/team/accept`, { token, wallet: address })
      setTeamId(res.data.teamId)
      setStatus("✅ Successfully joined team!")
    } catch (err: any) {
      setStatus("❌ " + (err.response?.data?.error || err.message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.centerBox}>
        <div style={styles.card}>
          <div style={styles.iconHeader}>🎉</div>
          <h1 style={styles.title}>Join Team</h1>
          <p style={styles.description}>
            You've been invited to join a team! Connect your wallet to accept the invite.
          </p>

          <div style={styles.tokenBox}>
            <div style={styles.tokenLabel}>Invite Token</div>
            <div style={styles.tokenValue}>{token ? `${token.slice(0, 20)}...` : "(missing)"}</div>
          </div>

          <button
            onClick={handleJoin}
            disabled={!token || loading}
            style={{
              ...styles.button,
              opacity: !token || loading ? 0.6 : 1,
              cursor: !token || loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "⏳ Processing..." : "✓ Connect & Join Team"}
          </button>

          {status && (
            <div
              style={{
                ...styles.status,
                background: status.includes("✅") ? "#c8e6c9" : status.includes("🔌") || status.includes("✓") ? "#e3f2fd" : "#ffcdd2",
                color: status.includes("✅") ? "#2e7d32" : status.includes("🔌") || status.includes("✓") ? "#1565c0" : "#c62828",
                borderLeft: `4px solid ${status.includes("✅") ? "#4CAF50" : status.includes("🔌") || status.includes("✓") ? "#2196F3" : "#f44336"}`,
              }}
            >
              {status}
            </div>
          )}

          {teamId && (
            <div style={styles.successBox}>
              <div style={styles.successTitle}>🎊 Welcome to the team!</div>
              <div style={styles.successDetail}>
                <strong>Team:</strong> {teamId}
              </div>
              {wallet && (
                <div style={styles.successDetail}>
                  <strong>Your Wallet:</strong> {wallet.slice(0, 6)}...{wallet.slice(-4)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    fontFamily: "'Segoe UI', sans-serif",
  },
  centerBox: {
    width: "100%",
    maxWidth: "500px",
  },
  card: {
    background: "white",
    padding: "40px 30px",
    borderRadius: "16px",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
    textAlign: "center" as const,
  },
  iconHeader: {
    fontSize: "60px",
    marginBottom: "20px",
  },
  title: {
    fontSize: "32px",
    color: "#333",
    marginBottom: "8px",
  },
  description: {
    color: "#666",
    fontSize: "16px",
    marginBottom: "30px",
    lineHeight: "1.5",
  },
  tokenBox: {
    background: "#f5f5f5",
    padding: "16px",
    borderRadius: "8px",
    marginBottom: "24px",
    textAlign: "left" as const,
  },
  tokenLabel: {
    fontSize: "12px",
    color: "#999",
    marginBottom: "6px",
    fontWeight: "bold",
  },
  tokenValue: {
    fontFamily: "monospace",
    fontSize: "13px",
    color: "#333",
    wordBreak: "break-all" as const,
  },
  button: {
    width: "100%",
    padding: "14px 20px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
    marginBottom: "16px",
    transition: "transform 0.2s",
  },
  status: {
    padding: "14px 16px",
    borderRadius: "8px",
    marginBottom: "16px",
    fontSize: "14px",
    lineHeight: "1.5",
  },
  successBox: {
    background: "#c8e6c9",
    border: "2px solid #4CAF50",
    padding: "20px",
    borderRadius: "8px",
    marginTop: "20px",
  },
  successTitle: {
    fontSize: "18px",
    fontWeight: "bold",
    color: "#2e7d32",
    marginBottom: "12px",
  },
  successDetail: {
    color: "#2e7d32",
    fontSize: "14px",
    marginTop: "8px",
    fontFamily: "monospace",
  },
}
