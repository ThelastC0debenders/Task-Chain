import { useEffect, useState } from "react"
import axios from "axios"
import { Users, Search, Shield, User, RefreshCw, Hash } from "lucide-react"

const API = "/api"

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
        <div style={styles.headerLeft}>
          <div style={styles.eyebrow}>TEAM MANAGEMENT</div>
          <h1 style={styles.title}>Squad Roster</h1>
          <p style={styles.subtitle}>Collaborate, manage permissions, and ship together.</p>
        </div>
        <div style={styles.statBadge}>
          <Users size={16} color="#00ff88" />
          <span style={styles.statText}>{members.length} MEMBERS ACTIVE</span>
        </div>
      </div>

      <div style={styles.mainGrid}>
        <div style={styles.controlsPanel}>
          <div style={styles.panelHeader}>
            <Search size={16} color="#00d9f5" />
            <span style={styles.panelTitle}>SQUAD QUERY</span>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>TEAM ID IDENTIFIER</label>
            <div style={styles.inputWrapper}>
              <Hash size={14} color="#666" style={styles.inputIcon} />
              <input
                value={teamId}
                onChange={e => setTeamId(e.target.value)}
                style={styles.input}
                placeholder="PROT-01..."
              />
            </div>
          </div>

          <button onClick={fetchMembers} disabled={loading} style={styles.refreshBtn}>
            <RefreshCw size={14} className={loading ? "spin" : ""} /> {loading ? "SYNCING..." : "SYNC ROSTER"}
          </button>

          {error && (
            <div style={styles.errorBox}>
              <Shield size={14} /> {error.toUpperCase()}
            </div>
          )}

          <div style={styles.infoBox}>
            <div style={styles.infoLabel}>CURRENT SQUAD</div>
            <div style={styles.infoValue}>{teamId || "N/A"}</div>
          </div>
        </div>

        <div style={styles.rosterPanel}>
          <div style={styles.rosterHeader}>OPERATIVES ({members.length})</div>
          <div style={styles.membersGrid}>
            {members.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>⛓️</div>
                <p>No operatives found in this squad sector.</p>
              </div>
            ) : (
              members.map((member, i) => (
                <div key={i} style={styles.memberCard}>
                  <div style={styles.memberAvatar}>
                    <User size={20} color="#0b1015" />
                  </div>
                  <div style={styles.memberInfo}>
                    <div style={styles.memberRole}>OPERATIVE {i + 1}</div>
                    <div style={styles.memberAddress}>
                      {member.slice(0, 6)}...{member.slice(-4)}
                    </div>
                  </div>
                  <div style={styles.statusDot}></div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const styles: any = {
  container: {
    minHeight: "100vh",
    background: "#05070a",
    padding: "40px 30px",
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    color: "#e0e0e0",
    boxSizing: "border-box",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: "40px",
    borderBottom: "1px solid #1a1a1a",
    paddingBottom: "20px",
  },
  eyebrow: {
    fontSize: "10px",
    color: "#00ff88",
    letterSpacing: "2px",
    marginBottom: "8px",
    fontWeight: "bold",
  },
  title: {
    margin: "0 0 10px 0",
    fontSize: "36px",
    color: "#fff",
    fontWeight: "800",
    letterSpacing: "-1px",
    lineHeight: "1",
  },
  subtitle: {
    margin: 0,
    color: "#888",
    fontSize: "14px",
  },
  statBadge: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "rgba(0, 255, 136, 0.1)",
    border: "1px solid rgba(0, 255, 136, 0.2)",
    padding: "10px 16px",
    borderRadius: "20px",
  },
  statText: {
    fontSize: "12px",
    color: "#00ff88",
    fontWeight: "bold",
    letterSpacing: "1px",
  },
  mainGrid: {
    display: "grid",
    gridTemplateColumns: "300px 1fr",
    gap: "30px",
    "@media (max-width: 900px)": {
      gridTemplateColumns: "1fr",
    }
  },
  controlsPanel: {
    background: "#0a0a0a",
    border: "1px solid #1a1a1a",
    borderRadius: "12px",
    padding: "24px",
    height: "fit-content",
  },
  panelHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "20px",
    color: "#00d9f5",
  },
  panelTitle: {
    fontWeight: "bold",
    letterSpacing: "1px",
    fontSize: "14px",
  },
  inputGroup: {
    marginBottom: "20px",
  },
  label: {
    fontSize: "10px",
    color: "#666",
    marginBottom: "8px",
    display: "block",
    letterSpacing: "1px",
  },
  inputWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  inputIcon: {
    position: "absolute",
    left: "12px",
    zIndex: 1,
  },
  input: {
    width: "100%",
    background: "#111",
    border: "1px solid #222",
    borderRadius: "6px",
    padding: "12px 12px 12px 36px",
    color: "#fff",
    fontFamily: "monospace",
    fontSize: "13px",
    outline: "none",
    transition: "border-color 0.2s",
  },
  refreshBtn: {
    width: "100%",
    background: "#00d9f5",
    color: "#000",
    border: "none",
    padding: "12px",
    borderRadius: "6px",
    fontWeight: "bold",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    fontSize: "12px",
    marginBottom: "20px",
  },
  errorBox: {
    background: "rgba(255, 78, 80, 0.1)",
    border: "1px solid rgba(255, 78, 80, 0.2)",
    color: "#ff4e50",
    padding: "12px",
    borderRadius: "6px",
    fontSize: "11px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "20px",
  },
  infoBox: {
    background: "#111",
    padding: "16px",
    borderRadius: "8px",
    border: "1px dashed #222",
  },
  infoLabel: {
    fontSize: "10px",
    color: "#666",
    marginBottom: "4px",
  },
  infoValue: {
    color: "#fff",
    fontSize: "14px",
    fontWeight: "bold",
  },
  rosterPanel: {
    background: "#0b0b0b",
    border: "1px solid #1f1f1f",
    borderRadius: "12px",
    padding: "24px",
  },
  rosterHeader: {
    fontSize: "12px",
    color: "#666",
    letterSpacing: "1px",
    marginBottom: "20px",
    fontWeight: "bold",
  },
  membersGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "16px",
  },
  memberCard: {
    background: "#111",
    border: "1px solid #222",
    borderRadius: "10px",
    padding: "16px",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    transition: "border-color 0.2s",
    position: "relative",
    cursor: "default",
  },
  memberAvatar: {
    width: "40px",
    height: "40px",
    background: "#00ff88",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  memberInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  memberRole: {
    fontSize: "10px",
    colour: "#666",
    letterSpacing: "0.5px",
  },
  memberAddress: {
    fontSize: "14px",
    color: "#fff",
    fontFamily: "monospace",
    letterSpacing: "0.5px",
  },
  statusDot: {
    position: "absolute",
    top: "16px",
    right: "16px",
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "#00ff88",
    boxShadow: "0 0 6px #00ff88",
  },
  emptyState: {
    gridColumn: "1 / -1",
    textAlign: "center",
    padding: "60px",
    color: "#444",
  },
  emptyIcon: {
    fontSize: "32px",
    marginBottom: "10px",
    opacity: 0.5,
  },
}

