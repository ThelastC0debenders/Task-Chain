import { useEffect, useState } from "react"
import axios from "axios"

const API = "http://localhost:5000"

export default function TeamMembers() {
  const [teamId, setTeamId] = useState("team-123")
  const [members, setMembers] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function fetchMembers() {
    if (!teamId) {
      setError("Team ID is required")
      return
    }
    try {
      setLoading(true)
      setError("")
      const res = await axios.get(`${API}/team/members/${teamId}`)
      setMembers(res.data.members || [])
    } catch (err: any) {
      setError(err.response?.data?.error || err.message)
      setMembers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMembers()
  }, [teamId])

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>👥 Team Members</h1>
        <p style={styles.subtitle}>View all members of your team</p>
      </div>

      <div style={styles.card}>
        <label style={styles.label}>
          <div>Team ID</div>
          <input
            value={teamId}
            onChange={e => setTeamId(e.target.value)}
            style={styles.input}
            placeholder="e.g., team-123"
          />
        </label>

        <button onClick={fetchMembers} disabled={loading} style={styles.button}>
          {loading ? "⏳ Loading..." : "🔄 Refresh Members"}
        </button>

        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.membersGrid}>
          {members.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>👤</div>
              <p>No members in this team yet</p>
            </div>
          ) : (
            members.map((member, i) => (
              <div key={i} style={styles.memberCard}>
                <div style={styles.memberAvatar}>{(i + 1).toString().padStart(2, "0")}</div>
                <div style={styles.memberInfo}>
                  <div style={styles.memberAddress}>
                    {member.slice(0, 6)}...{member.slice(-4)}
                  </div>
                  <div style={styles.memberFull}>{member}</div>
                </div>
              </div>
            ))
          )}
        </div>

        <div style={styles.statsBox}>
          <div style={styles.stat}>
            <div style={styles.statValue}>{members.length}</div>
            <div style={styles.statLabel}>Total Members</div>
          </div>
          <div style={styles.stat}>
            <div style={styles.statValue}>{teamId}</div>
            <div style={styles.statLabel}>Team ID</div>
          </div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    minHeight: "100vh",
    padding: "40px 20px",
    fontFamily: "'Segoe UI', sans-serif",
  },
  header: {
    textAlign: "center" as const,
    color: "white",
    marginBottom: "40px",
  },
  subtitle: {
    fontSize: "16px",
    opacity: 0.9,
    marginTop: "8px",
  },
  card: {
    background: "white",
    padding: "30px",
    borderRadius: "12px",
    boxShadow: "0 10px 40px rgba(0, 0, 0, 0.1)",
    maxWidth: "900px",
    margin: "0 auto",
  },
  label: {
    marginBottom: "20px",
    display: "block",
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    marginTop: "8px",
    border: "2px solid #e0e0e0",
    borderRadius: "6px",
    fontSize: "14px",
    boxSizing: "border-box" as const,
  },
  button: {
    padding: "10px 20px",
    background: "#667eea",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "14px",
    cursor: "pointer",
    marginBottom: "20px",
  },
  error: {
    background: "#ffcdd2",
    color: "#c62828",
    padding: "12px",
    borderRadius: "6px",
    marginBottom: "20px",
  },
  membersGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "16px",
    marginBottom: "30px",
  },
  memberCard: {
    background: "#f9f9f9",
    border: "2px solid #e0e0e0",
    borderRadius: "8px",
    padding: "16px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  memberAvatar: {
    width: "48px",
    height: "48px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    fontSize: "18px",
  },
  memberInfo: {
    flex: 1,
  },
  memberAddress: {
    fontFamily: "monospace",
    fontSize: "14px",
    fontWeight: "bold",
    color: "#333",
  },
  memberFull: {
    fontFamily: "monospace",
    fontSize: "11px",
    color: "#999",
    marginTop: "4px",
    wordBreak: "break-all" as const,
  },
  emptyState: {
    textAlign: "center" as const,
    padding: "60px 20px",
    color: "#999",
    gridColumn: "1 / -1",
  },
  emptyIcon: {
    fontSize: "48px",
    marginBottom: "16px",
  },
  statsBox: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
  },
  stat: {
    background: "#f0f0f0",
    padding: "20px",
    borderRadius: "8px",
    textAlign: "center" as const,
  },
  statValue: {
    fontSize: "28px",
    fontWeight: "bold",
    color: "#667eea",
  },
  statLabel: {
    fontSize: "12px",
    color: "#999",
    marginTop: "6px",
  },
}
