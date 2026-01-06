import { useEffect, useState } from "react"
import axios from "axios"
import { checkWalletConnection, connectWallet } from "../services/wallet"
import { claimTaskOnChain, completeTaskOnChain } from "../services/contract"
import confetti from "canvas-confetti"
import { Monitor, Video, Code, MessageCircle, Trello, Calendar, FileText, Activity } from "lucide-react"
import { doc, onSnapshot } from "firebase/firestore"
import { db } from "../services/firebase"


const API = "/api"
interface Task {
  id: string
  title: string
  description: string
  priority: number
  deadline: string
  status: "open" | "claimed" | "review" | "approved" | "completed"
  reward?: string
  claimedBy?: string
  createdBy?: string
}



export default function MemberDashboard() {
  const [address, setAddress] = useState("")
  const [teamId, setTeamId] = useState("team-123")
  const [token, setToken] = useState<string>("")
  const [inviteStatus, setInviteStatus] = useState("")
  const [joinedTeam, setJoinedTeam] = useState("")
  const [activeTab, setActiveTab] = useState<"join" | "tasks" | "apps">("join")
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState("all")
  const [tasks, setTasks] = useState<Task[]>([])
  const [claimedTasks, setClaimedTasks] = useState<string[]>([])
  const [callState, setCallState] = useState<any>(null)
  const [dismissedCallId, setDismissedCallId] = useState<string | null>(null)


  // listen to firestore pushes
  useEffect(() => {
    if (!teamId) return

    const ref = doc(db, "teams", teamId, "meta", "call")

    const unsubscribe = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const data = snap.data()
        setCallState(data)

        // Reset dismissal if this is a NEW call
        if (data.createdAt !== dismissedCallId) {
          setDismissedCallId(null)
        }
      }
    })

    return () => unsubscribe()
  }, [teamId, dismissedCallId])



  // Removed Workspace/Git/Audit State

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const tokenParam = params.get("token") || ""
    setToken(tokenParam)
    // Restore "Joined" state
    const savedTeam = localStorage.getItem("taskchain_joinedTeam")

    if (tokenParam) {
      setActiveTab("join")
    } else if (savedTeam) {
      setJoinedTeam(savedTeam)
      setTeamId(savedTeam)
      setActiveTab("tasks")
    }

    // Silent wallet check
    checkWalletConnection().then(res => {
      if (res) {
        setAddress(res.address)
        setInviteStatus("Connected (Restored)")
      }
    })
  }, [])

  async function handleRequestMeet() {
    if (!address) {
      alert("Please connect your wallet first")
      return
    }

    if (!teamId) {
      alert("Team ID missing")
      return
    }

    try {
      await axios.post(`${API}/team/request-meet`, {
        teamId,
        wallet: address,
      })
    } catch (err: any) {
      alert(
        "Failed to request meet: " +
        (err.response?.data?.error || err.message)
      )
    }
  }


  async function connectAndVerify() {
    const { address } = await connectWallet()
    setAddress(address)
    return address
  }

  async function connectWalletHandler() {
    try {
      setLoading(true)
      await connectAndVerify()
      setInviteStatus("Wallet connected")
    } catch (err: any) {
      setInviteStatus("Error: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  async function fetchTasks() {
    try {
      const res = await axios.get(`${API}/task/${teamId}`)
      setTasks(res.data.tasks || [])
    } catch (err: any) {
      console.error("Error fetching tasks:", err)
    }
  }

  useEffect(() => {
    if (activeTab === "tasks") {
      fetchTasks()
    }
  }, [activeTab, teamId])

  async function handleJoinTeam() {
    if (!token) {
      setInviteStatus("No invite token found")
      return
    }
    if (!address) {
      setInviteStatus("Please connect wallet first")
      return
    }

    try {
      setLoading(true)
      setInviteStatus("Joining team...")
      const res = await axios.post(`${API}/team/accept`, { token, wallet: address })
      setJoinedTeam(res.data.teamId)
      setTeamId(res.data.teamId)
      localStorage.setItem("taskchain_joinedTeam", res.data.teamId)
      setInviteStatus("Joined team")
    } catch (err: any) {
      setInviteStatus("Error: " + (err.response?.data?.error || err.message))
    } finally {
      setLoading(false)
    }
  }

  async function startWorkspace(taskId: string, claimId?: string) {
    if (!address) {
      // Try to connect if not connected
      try {
        await connectAndVerify()
      } catch (e) {
        alert("Please connect wallet first")
        return
      }
    }

    // Generate claimId if missing (simple fallback)
    const finalClaimId = claimId || `claim-${Date.now()}-${taskId}`

    // Navigate to Work Dashboard
    window.location.href = `/work?taskId=${taskId}&claimId=${finalClaimId}`
  }

  async function handleClaimTask(taskId: string) {
    if (!address) {
      alert("Please connect wallet first")
      return
    }

    try {
      await claimTaskOnChain(parseInt(taskId, 10), 1)
      await axios.patch(`${API}/task/${teamId}/${taskId}`, {
        status: "claimed",
        claimedBy: address,
      })
      setClaimedTasks([...claimedTasks, taskId])
      setTasks(tasks.map(t => (t.id === taskId ? { ...t, status: "claimed", claimedBy: address } : t)))
      // const claimId = `claim-${Date.now()}-${address.slice(0, 6)}`
      // await startWorkspace(taskId, claimId)
      alert(`Task #${taskId} claimed on-chain`)
    } catch (err: any) {
      console.error("Error claiming task:", err)
      alert("Failed to claim task: " + (err.response?.data?.error || err.message))
    }
  }

  async function handleCompleteTask(taskId: string) {
    try {
      const receiptHash =
        "0x" +
        Array.from(crypto.getRandomValues(new Uint8Array(32)))
          .map(b => b.toString(16).padStart(2, "0"))
          .join("")
      const ipfsCid = "QmExample" + Date.now()

      await completeTaskOnChain(parseInt(taskId, 10), receiptHash, ipfsCid)
      await axios.patch(`${API}/task/${teamId}/${taskId}`, {
        status: "completed",
      })
      setTasks(tasks.map(t => (t.id === taskId ? { ...t, status: "completed" } : t)))
      setClaimedTasks(claimedTasks.filter(id => id !== taskId))
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#7f5af0', '#14f195', '#00d9f5']
      })
      alert(`Task #${taskId} completed on-chain`)
    } catch (err: any) {
      console.error("Error completing task:", err)
      alert("Failed to complete task: " + (err.response?.data?.error || err.message))
    }
  }


  const filteredTasks = tasks.filter(t => {
    if (filter === "open") return t.status === "open"
    if (filter === "claimed") return claimedTasks.includes(t.id) || t.claimedBy === address
    return true
  })

  const openCount = tasks.filter(t => t.status === "open").length
  const completedCount = tasks.filter(t => t.status === "completed").length

  const isMyTask = (task: Task) => claimedTasks.includes(task.id) || task.claimedBy === address

  const getPriorityLabel = (priority: number) => {
    if (priority >= 8) return "Critical"
    if (priority >= 5) return "High"
    return "Normal"
  }



  return (
    <div style={styles.container}>
      {/* Header */}
      {address &&
        teamId &&
        callState?.status === "requested" &&
        callState.createdAt !== dismissedCallId && (

          <div
            style={{
              position: "fixed",
              bottom: 20,
              right: 20,
              background: "#0a0a0a",
              border: "1px solid #00ff88",
              color: "#00ff88",
              padding: "16px 18px",
              borderRadius: "10px",
              zIndex: 9999,
              width: "320px",
              boxShadow: "0 0 20px rgba(0,255,136,0.25)",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong>📞 Team Meet Requested</strong>
              <button
                onClick={() => setDismissedCallId(callState.createdAt)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#888",
                  cursor: "pointer",
                  fontSize: "16px",
                }}
              >
                ×
              </button>
            </div>

            {/* Body */}
            <div style={{ fontSize: 12, color: "#aaa", margin: "8px 0 12px" }}>
              Requested by {callState.requestedBy?.slice(0, 6)}…
            </div>

            <a
              href={callState.meetLink}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "inline-block",
                background: "#00ff88",
                color: "#000",
                padding: "6px 12px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: "bold",
                textDecoration: "none",
              }}
            >
              JOIN MEET
            </a>
          </div>
        )}

      <div style={styles.header}>
        <div>
          <div style={styles.eyebrow}>HYPER NEON • ON-CHAIN DELIVERY</div>
          <h1 style={styles.title}>Taskchain Member Console</h1>
          <p style={styles.lead}>
            Claim, build, and ship inside one neon cockpit. Live workspace with Monaco + Git, wired to your wallet.
          </p>
          <div style={styles.heroActions}>
            {!address ? (
              <button style={styles.ctaPrimary} onClick={connectWalletHandler} disabled={loading}>
                {loading ? "CONNECTING..." : "CONNECT WALLET"}
              </button>
            ) : (
              <div style={styles.connectedPill}>
                <span style={styles.pillDot} />
                {address.slice(0, 6)}...{address.slice(-4)}
              </div>
            )}
            <button
              style={{ ...styles.ctaGhost, ...(activeTab === "tasks" ? styles.tabActive : {}) }}
              onClick={() => setActiveTab("tasks")}
            >
              JUMP TO TASKS
            </button>
          </div>
        </div>

        <div style={styles.glassStat}>
          <div style={styles.statRow}>
            <div>
              <div style={styles.statLabel}>TOTAL TASKS</div>
              <div style={styles.metric}>{tasks.length}</div>
            </div>
            <div style={styles.teamBadge}>Team {teamId}</div>
          </div>
          <div style={styles.statGrid}>
            <div>
              <div style={styles.statLabel}>Open</div>
              <div style={{ ...styles.metricSmall, color: "#f9d423" }}>{openCount}</div>
            </div>
            <div>
              <div style={styles.statLabel}>Claimed</div>
              <div style={{ ...styles.metricSmall, color: "#00f5a0" }}>{claimedTasks.length}</div>
            </div>
            <div>
              <div style={styles.statLabel}>Completed</div>
              <div style={{ ...styles.metricSmall, color: "#7dd3fc" }}>{completedCount}</div>
            </div>
          </div>
          <div style={styles.progressTrack}>
            <div
              style={{
                ...styles.progressFill,
                width: `${tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0}%`,
              }}
            />
          </div>
          <div style={styles.progressLabel}>VELOCITY METER</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={styles.tabBar}>
        <button
          onClick={() => setActiveTab("join")}
          style={{ ...styles.tabBtn, ...(activeTab === "join" ? styles.tabActive : {}) }}
        >
          Invite
        </button>
        <button
          onClick={() => setActiveTab("tasks")}
          style={{ ...styles.tabBtn, ...(activeTab === "tasks" ? styles.tabActive : {}) }}
        >
          Tasks
        </button>
        <button
          onClick={() => setActiveTab("apps")}
          style={{ ...styles.tabBtn, ...(activeTab === "apps" ? styles.tabActive : {}) }}
        >
          Apps
        </button>
      </div>

      {/* JOIN TAB */}
      {activeTab === "join" && (
        <section style={styles.section}>
          <div style={styles.sectionHead}>
            <div style={styles.eyebrow}>JOIN</div>
            <h2 style={styles.sectionTitle}>Accept your invite</h2>
            <p style={styles.sectionLead}>Connect your wallet, snap into the crew, and start earning.</p>
            {token && <div style={styles.tokenBadge}>{token.slice(0, 20)}...</div>}
          </div>

          <div style={styles.joinGrid}>
            <div style={styles.card}>
              <div style={styles.infoRow}>
                <span style={styles.label}>STATUS</span>
                <span style={styles.pill}>{inviteStatus || "PENDING"}</span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.label}>WALLET</span>
                <span style={styles.value}>{address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "NOT CONNECTED"}</span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.label}>TEAM</span>
                <span style={styles.value}>{joinedTeam || "UNASSIGNED"}</span>
              </div>

              {!joinedTeam ? (
                <div style={styles.actionRow}>
                  {!address ? (
                    <button onClick={connectWalletHandler} disabled={loading} style={styles.ctaPrimary}>
                      {loading ? "CONNECTING..." : "CONNECT WALLET"}
                    </button>
                  ) : (
                    <button onClick={handleJoinTeam} disabled={loading || !token} style={styles.ctaPrimary}>
                      {loading ? "JOINING..." : "ACCEPT INVITE"}
                    </button>
                  )}
                </div>
              ) : (
                <div style={styles.successCard}>
                  <div style={styles.successTitle}>YOU ARE IN.</div>
                  <div style={styles.value}>TEAM: {joinedTeam}</div>
                </div>
              )}
            </div>

            <div style={styles.card}>
              <h3 style={styles.cardTitle}>HOW IT WORKS</h3>
              <ul style={styles.list}>
                <li style={styles.listItem}>Connect wallet to verify and unlock workspace.</li>
                <li style={styles.listItem}>Accept invite token to join the squad.</li>
                <li style={styles.listItem}>Claim tasks, edit live, and commit from the dashboard.</li>
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* TASKS TAB */}
      {activeTab === "tasks" && (
        <section style={styles.section}>
          <div style={styles.sectionHeaderFlex}>
            <div>
              <div style={styles.eyebrow}>PIPELINE</div>
              <h2 style={styles.sectionTitle}>Claim and build</h2>
              <p style={styles.sectionLead}>Every task opens a live workspace with Monaco + Git terminal.</p>
            </div>
            <div style={styles.filterPills}>
              <button
                onClick={() => setFilter("all")}
                style={{ ...styles.filterPill, ...(filter === "all" ? styles.filterPillActive : {}) }}
              >
                All ({tasks.length})
              </button>
              <button
                onClick={() => setFilter("open")}
                style={{ ...styles.filterPill, ...(filter === "open" ? styles.filterPillActive : {}) }}
              >
                Open ({openCount})
              </button>
              <button
                onClick={() => setFilter("claimed")}
                style={{ ...styles.filterPill, ...(filter === "claimed" ? styles.filterPillActive : {}) }}
              >
                Mine ({tasks.filter(t => isMyTask(t)).length})
              </button>
            </div>
          </div>

          <div style={styles.tasksGrid}>

            {filteredTasks.length === 0 ? (
              <div style={styles.emptyState}>
                <p style={styles.emptyTitle}>NOTHING HERE YET.</p>
                <p style={styles.emptySub}>Check back shortly or refresh.</p>
              </div>
            ) : (
              filteredTasks.map(task => (
                <div key={task.id} style={styles.taskCard}>
                  <div style={styles.cardTop}>
                    <div>
                      <div style={styles.taskId}>#{task.id}</div>
                      <h3 style={styles.taskTitle}>{task.title}</h3>
                      <p style={styles.taskDescription}>{task.description}</p>
                    </div>
                    <div style={{ ...styles.priorityBadge, ...styles[getPriorityLabel(task.priority)] }}>
                      {getPriorityLabel(task.priority)}
                    </div>
                  </div>

                  <div style={styles.metaRow}>
                    <div style={styles.metaBlock}>
                      <div style={styles.metaLabel}>DEADLINE</div>
                      <div style={styles.metaValue}>{new Date(task.deadline).toLocaleDateString()}</div>
                    </div>
                    <div style={styles.metaBlock}>
                      <div style={styles.metaLabel}>REWARD</div>
                      <div style={styles.metaValue}>{task.reward || "-"}</div>
                    </div>
                    <div style={styles.metaBlock}>
                      <div style={styles.metaLabel}>OWNER</div>
                      <div style={styles.metaValueTruncated}>{task.createdBy || "-"}</div>
                    </div>
                  </div>

                  <div style={styles.actionsRow}>
                    {/* Actions Row */}
                    <div style={{ display: 'flex', flexDirection: "column", gap: "10px", width: "100%", alignItems: "flex-end", marginTop: 15 }}>

                      {/* Primary Actions */}
                      <div style={{ display: 'flex', gap: '10px' }}>
                        {!isMyTask(task) && task.status === "open" && (
                          <button
                            onClick={() => handleClaimTask(task.id)}
                            disabled={!address}
                            style={{ ...styles.ctaPrimary, opacity: !address ? 0.6 : 1, width: 'auto', padding: '8px 20px' }}
                          >
                            Claim
                          </button>
                        )}

                        {isMyTask(task) && task.status === "claimed" && (
                          <>
                            <button onClick={() => startWorkspace(task.id)} style={styles.ctaGhost}>
                              <Code size={14} /> Open Workspace
                            </button>
                            <button onClick={() => handleCompleteTask(task.id)} style={{ ...styles.ctaPrimary, background: "#1f6feb", color: "#fff" }}>
                              Complete Task (Submit)
                            </button>
                          </>
                        )}

                        {task.status === "completed" && <button style={styles.ctaDone}>Completed</button>}
                      </div>
                    </div>

                  </div>
                </div>
              ))
            )}
          </div>



          <div style={styles.statsRow}>
            <div style={styles.statCard}>
              <div style={styles.label}>Total</div>
              <div style={styles.metric}>{tasks.length}</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.label}>Claimed</div>
              <div style={styles.metric}>{claimedTasks.length}</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.label}>Completed</div>
              <div style={styles.metric}>{completedCount}</div>
            </div>
          </div>
        </section>
      )}

      {/* APPS TAB */}
      {activeTab === "apps" && (
        <section style={styles.section}>
          <div style={styles.sectionHead}>
            <div style={styles.eyebrow}>TOOLING</div>
            <h2 style={styles.sectionTitle}>Productivity Suite</h2>
            <p style={styles.sectionLead}>Collaborate, plan, and document with your squad. Real-time tools.</p>
          </div>

          <div style={styles.appsGrid}>
            {[
              { title: "Team Chat", icon: <MessageCircle size={32} color="#00ff88" />, desc: "Real-time messaging channels", link: "/chat", action: null },
              { title: "Team Health", icon: <Activity size={32} color="#ff3333" />, desc: "Burnout & Velocity Analytics", link: "/health", action: null },
              { title: "Project Board", icon: <Trello size={32} color="#00d1ff" />, desc: "Kanban task management", link: `/board/default-${teamId}`, action: null },
              { title: "Calendar", icon: <Calendar size={32} color="#ff0088" />, desc: "Schedule and events", link: "/calendar", action: null },
              { title: "Video Meet", icon: <Video size={32} color="#ff9900" />, desc: "Secure video conferencing", link: null, action: handleRequestMeet },
              { title: "Team Wiki", icon: <FileText size={32} color="#aa00ff" />, desc: "Collaborative documentation", link: "/docs", action: null },
              { title: "Jamboard", icon: <Monitor size={32} color="#ffff00" />, desc: "Visual brainstorming canvas", link: `/whiteboard/default-${teamId}`, action: null },
            ].map((app, i) => (
              <div
                key={i}
                style={styles.appCard}
                onClick={() => {
                  if (app.action) app.action()
                  else if (app.link) window.open(app.link, "_blank")
                }}
              >
                <div style={styles.appIconBox}>{app.icon}</div>
                <h3 style={styles.appTitle}>{app.title}</h3>
                <p style={styles.appDesc}>{app.desc}</p>
                <button style={styles.launchBtn}>LAUNCH APP →</button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div >
  )
}

const styles: any = {
  container: {
    minHeight: "100vh",
    background: "#050505",
    color: "#e0e0e0",
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    display: "flex",
    flexDirection: "column",
    padding: "40px 30px",
    boxSizing: "border-box",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "60px",
    flexWrap: "wrap",
    gap: "40px",
  },
  eyebrow: {
    fontSize: "10px",
    color: "#444",
    fontWeight: "bold",
    letterSpacing: "1px",
    marginBottom: "10px",
    textTransform: "uppercase",
    fontFamily: "inherit",
  },
  title: {
    fontSize: "32px",
    color: "#fff",
    margin: "0 0 10px 0",
    fontWeight: "700",
    letterSpacing: "-0.5px",
  },
  lead: {
    color: "#888",
    fontSize: "14px",
    maxWidth: "500px",
    lineHeight: "1.5",
    marginBottom: "30px",
  },
  heroActions: {
    display: "flex",
    gap: "15px",
    alignItems: "center",
  },
  ctaPrimary: {
    background: "#00ff88",
    color: "#000",
    border: "none",
    padding: "10px 24px",
    borderRadius: "6px",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  ctaGhost: {
    background: "transparent",
    border: "1px solid #333",
    color: "#fff",
    padding: "10px 24px",
    borderRadius: "6px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    textTransform: "uppercase",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  toolBtn: {
    background: "#111",
    border: "1px solid #333",
    color: "#888",
    padding: "8px 16px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    transition: "all 0.2s",
    textTransform: "uppercase",
  },
  ctaDone: {
    background: "#111",
    border: "1px solid #333",
    color: "#666",
    padding: "10px 24px",
    borderRadius: "6px",
    fontSize: "13px",
    cursor: "default",
    textTransform: "uppercase",
  },
  connectedPill: {
    background: "#111",
    border: "1px solid #333",
    padding: "8px 16px",
    borderRadius: "20px",
    color: "#00ff88",
    fontSize: "12px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontFamily: "monospace",
  },
  pillDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "#00ff88",
    boxShadow: "0 0 5px #00ff88",
  },

  glassStat: {
    background: "#0a0a0a",
    border: "1px solid #1a1a1a",
    borderRadius: "12px",
    padding: "24px",
    width: "300px",
  },
  statRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "20px",
  },
  statLabel: {
    fontSize: "10px",
    color: "#555",
    fontWeight: "bold",
    marginBottom: "4px",
    textTransform: "uppercase",
  },
  metric: {
    fontSize: "32px",
    color: "#fff",
    fontWeight: "700",
    lineHeight: "1",
  },
  metricSmall: {
    fontSize: "18px",
    fontWeight: "700",
    lineHeight: "1",
    marginBottom: "4px",
  },
  teamBadge: {
    fontSize: "10px",
    background: "#111",
    border: "1px solid #333",
    padding: "2px 8px",
    borderRadius: "4px",
    color: "#666",
  },
  statGrid: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "20px",
    textAlign: "left",
  },
  progressTrack: {
    height: "4px",
    background: "#1a1a1a",
    borderRadius: "2px",
    marginBottom: "10px",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    background: "#333",
    borderRadius: "2px",
  },
  progressLabel: {
    fontSize: "9px",
    color: "#444",
    textTransform: "uppercase",
    letterSpacing: "1px",
  },

  tabBar: {
    display: "flex",
    gap: "2px",
    background: "#0a0a0a",
    padding: "4px",
    borderRadius: "8px",
    width: "fit-content",
    marginBottom: "40px",
    border: "1px solid #1a1a1a",
  },
  tabBtn: {
    background: "transparent",
    border: "none",
    color: "#666",
    padding: "8px 24px",
    borderRadius: "6px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  tabActive: {
    background: "#1a1a1a",
    color: "#fff",
  },

  section: {
    animation: "fadeIn 0.3s ease",
  },
  sectionHead: {
    marginBottom: "40px",
  },
  sectionHeaderFlex: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: "40px",
  },
  sectionTitle: {
    fontSize: "24px",
    color: "#fff",
    margin: "0 0 10px 0",
    fontWeight: "700",
  },
  sectionLead: {
    color: "#666",
    fontSize: "13px",
    margin: 0,
  },
  tokenBadge: {
    display: "inline-block",
    marginTop: "15px",
    background: "#111",
    border: "1px solid #333",
    color: "#00ff88",
    padding: "4px 12px",
    borderRadius: "4px",
    fontSize: "12px",
    fontFamily: "monospace",
  },

  joinGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "30px",
  },
  card: {
    background: "#0a0a0a",
    border: "1px solid #1a1a1a",
    borderRadius: "12px",
    padding: "30px",
  },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "15px",
    borderBottom: "1px solid #111",
    paddingBottom: "15px",
  },
  label: { margin: 0, padding: 0, fontSize: "11px", color: "#444", fontWeight: "bold" },
  value: { color: "#ccc", fontSize: "13px", fontFamily: "monospace" },
  pill: {
    background: "#111",
    color: "#888",
    padding: "4px 10px",
    borderRadius: "4px",
    fontSize: "11px",
    textTransform: "uppercase",
  },
  actionRow: { marginTop: "20px" },
  successCard: { marginTop: "20px", borderTop: "1px solid #333", paddingTop: "20px" },
  successTitle: { color: "#00ff88", fontSize: "16px", fontWeight: "bold", marginBottom: "10px" },
  cardTitle: { fontSize: "14px", color: "#fff", marginBottom: "20px", textTransform: "uppercase", letterSpacing: "1px" },
  list: { paddingLeft: "20px", color: "#888", fontSize: "13px", lineHeight: "1.8" },
  listItem: { marginBottom: "10px" },

  filterPills: {
    display: "flex",
    gap: "10px",
    background: "#0a0a0a",
    padding: "4px",
    borderRadius: "6px",
    border: "1px solid #1a1a1a",
  },
  filterPill: {
    background: "transparent",
    border: "none",
    color: "#666",
    padding: "6px 12px",
    borderRadius: "4px",
    fontSize: "11px",
    fontWeight: "600",
    cursor: "pointer",
  },
  filterPillActive: {
    background: "#1a1a1a",
    color: "#fff",
  },

  tasksGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "20px",
  },
  taskCard: {
    background: "#0a0a0a",
    border: "1px solid #1a1a1a",
    borderRadius: "8px",
    padding: "24px",
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "20px",
  },
  taskId: {
    fontSize: "11px",
    color: "#444",
    marginBottom: "4px",
  },
  taskTitle: {
    fontSize: "18px",
    color: "#fff",
    margin: "0 0 5px 0",
    fontWeight: "600",
  },
  taskDescription: {
    color: "#666",
    fontSize: "13px",
    margin: 0,
    maxWidth: "600px",
  },
  priorityBadge: {
    fontSize: "10px",
    padding: "4px 8px",
    borderRadius: "4px",
    fontWeight: "bold",
    textTransform: "uppercase",
    height: "fit-content",
  },
  Normal: { background: "rgba(0, 255, 136, 0.1)", color: "#00ff88", border: "1px solid rgba(0, 255, 136, 0.2)" },
  High: { background: "rgba(255, 153, 0, 0.1)", color: "#ff9900", border: "1px solid rgba(255, 153, 0, 0.2)" },
  Critical: { background: "rgba(255, 51, 51, 0.1)", color: "#ff3333", border: "1px solid rgba(255, 51, 51, 0.2)" },

  metaRow: {
    display: "flex",
    gap: "40px",
    marginBottom: "25px",
    paddingBottom: "25px",
    borderBottom: "1px solid #111",
  },
  metaBlock: { display: "flex", flexDirection: "column", gap: "6px" },
  metaLabel: { fontSize: "10px", color: "#444", fontWeight: "bold", textTransform: "uppercase" },
  metaValue: { fontSize: "13px", color: "#ccc", fontFamily: "monospace" },
  metaValueTruncated: {
    fontSize: "13px",
    color: "#ccc",
    fontFamily: "monospace",
    maxWidth: "150px", // Strict limit
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    display: "block",
  },

  actionsRow: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
  },
  statusStrip: { marginBottom: "20px" },
  statusChip: { display: "inline-block", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "700", color: "#000" },

  actionBtnPrimary: {
    background: "#fff",
    color: "#000",
    border: "none",
    padding: "8px 20px",
    borderRadius: "6px",
    fontWeight: "600",
    cursor: "pointer",
  },
  actionBtnSecondary: {
    background: "transparent",
    color: "#fff",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    padding: "8px 20px",
    borderRadius: "6px",
    cursor: "pointer",
  },
  actionBtnGhost: {
    background: "rgba(255, 255, 255, 0.1)",
    color: "#fff",
    border: "1px solid #333",
    padding: "8px 20px",
    borderRadius: "6px",
    cursor: "pointer",
  },
  actionBtnDone: {
    background: "transparent",
    color: "#4caf50",
    border: "1px solid #4caf50",
    padding: "8px 20px",
    borderRadius: "6px",
    cursor: "default",
  },
  emptyState: {
    padding: "60px",
    textAlign: "center",
    border: "1px dashed #222",
    borderRadius: "12px",
  },
  emptyTitle: { fontSize: "14px", color: "#666", fontWeight: "bold", marginBottom: "5px" },
  emptySub: { fontSize: "13px", color: "#444" },
  statsRow: { marginTop: "40px", display: "flex", gap: "20px", borderTop: "1px solid #1a1a1a", paddingTop: "20px" },
  statCard: { marginRight: "40px" },
  statBig: { fontSize: "24px", fontWeight: "bold", color: "#fff" },


  appsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "20px",
  },
  appCard: {
    background: "#0a0a0a",
    border: "1px solid #1a1a1a",
    borderRadius: "12px",
    padding: "24px",
    cursor: "pointer",
    transition: "transform 0.2s, border-color 0.2s",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    ':hover': {
      transform: "translateY(-4px)",
      borderColor: "#333"
    }
  },
  appIconBox: {
    marginBottom: "16px",
    padding: "12px",
    background: "rgba(255, 255, 255, 0.03)",
    borderRadius: "10px",
  },
  appTitle: {
    fontSize: "16px",
    fontWeight: "bold",
    color: "#fff",
    margin: "0 0 8px 0",
  },
  appDesc: {
    fontSize: "12px",
    color: "#666",
    margin: "0 0 20px 0",
    lineHeight: "1.5",
    flex: 1,
  },
  launchBtn: {
    background: "transparent",
    border: "1px solid #333",
    color: "#00ff88",
    padding: "8px 16px",
    borderRadius: "6px",
    fontSize: "11px",
    fontWeight: "bold",
    cursor: "pointer",
    width: "100%",
    textAlign: "center" as const,
  },
}
















































