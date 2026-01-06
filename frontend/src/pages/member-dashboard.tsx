import { useEffect, useState } from "react"
import axios from "axios"
import { checkWalletConnection, connectWallet } from "../services/wallet"
import { claimTaskOnChain, completeTaskOnChain } from "../services/contract"
import confetti from "canvas-confetti"
import { Monitor, Video, Code, MessageCircle, Trello, Calendar, FileText, Activity } from "lucide-react"
import type { ContributionReceipt } from "../types/receipt"
import { generateReceipt } from "../utils/receiptGenerator"
import { ContributionReceiptCard } from "../components/ContributionReceiptCard"
import { SubmitProofModal } from "../components/SubmitProofModal"

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
  const [receipt, setReceipt] = useState<ContributionReceipt | null>(null)
  const [activeTaskForProof, setActiveTaskForProof] = useState<Task | null>(null)


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
    const task = tasks.find(t => t.id === taskId)
    if (task) {
      setActiveTaskForProof(task)
    }
  }

  async function handleSubmitProof(description: string, link: string) {
    if (!activeTaskForProof) return
    const taskId = activeTaskForProof.id

    try {
      setLoading(true)
      const receiptHash =
        "0x" +
        Array.from(crypto.getRandomValues(new Uint8Array(32)))
          .map(b => b.toString(16).padStart(2, "0"))
          .join("")

      // Mock IPFS CID generation from proof content
      const ipfsCid = "Qm" + btoa(JSON.stringify({ description, link })).slice(0, 44)

      await completeTaskOnChain(parseInt(taskId, 10), receiptHash, ipfsCid)
      await axios.patch(`${API}/task/${teamId}/${taskId}`, {
        status: "completed",
        proof: { description, link, cid: ipfsCid }
      })

      setTasks(tasks.map(t => (t.id === taskId ? { ...t, status: "completed" } : t)))
      setClaimedTasks(claimedTasks.filter(id => id !== taskId))

      // Generate Receipt
      const newReceipt = await generateReceipt(
        taskId,
        activeTaskForProof.title,
        activeTaskForProof.reward || "0 ETH",
        address,
        receiptHash
      )
      setReceipt(newReceipt)
      setActiveTaskForProof(null)

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#7f5af0', '#14f195', '#00d9f5']
      })
    } catch (err: any) {
      console.error("Error completing task:", err)
      alert("Failed to complete task: " + (err.response?.data?.error || err.message))
    } finally {
      setLoading(false)
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
      {activeTaskForProof && (
        <SubmitProofModal
          taskId={activeTaskForProof.id}
          taskTitle={activeTaskForProof.title}
          onClose={() => setActiveTaskForProof(null)}
          onSubmit={handleSubmitProof}
          loading={loading}
        />
      )}

      {receipt && (
        <ContributionReceiptCard
          receipt={receipt}
          onClose={() => setReceipt(null)}
        />
      )}
    </div >
  )
}

const styles: any = {
  container: {
    minHeight: "100vh",
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    display: "flex",
    flexDirection: "column",
    background: "var(--bg-primary)",
    color: "var(--text-primary)",
    transition: "background 0.3s, color 0.3s"
  },
  header: {
    padding: "60px 40px 40px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    position: "relative",
    // borderBottom: "1px solid #222" <-- Remove fixed border
    borderBottom: "1px solid var(--border-color)",
  },
  eyebrow: {
    fontSize: "11px",
    fontWeight: "800",
    letterSpacing: "2px",
    color: "var(--accent-primary)",
    marginBottom: "12px",
    textTransform: "uppercase",
  },
  title: {
    fontSize: "48px",
    fontWeight: "900",
    color: "var(--text-primary)", // styles.title used plain white before potentially
    margin: "0 0 16px 0",
    letterSpacing: "-2px",
    lineHeight: "1.0",
  },
  lead: {
    fontSize: "16px",
    color: "var(--text-secondary)", // was #888
    maxWidth: "500px",
    lineHeight: "1.6",
    marginBottom: "30px",
  },
  heroActions: {
    display: "flex",
    gap: "16px",
    alignItems: "center"
  },
  ctaPrimary: {
    background: "var(--accent-primary)",
    color: "var(--text-on-accent)",
    border: "none",
    padding: "12px 24px",
    fontSize: "14px",
    fontWeight: "bold",
    letterSpacing: "0.5px",
    borderRadius: "4px",
    cursor: "pointer",
    boxShadow: "0 4px 20px rgba(0, 255, 136, 0.2)",
    transition: "all 0.2s",
  },
  ctaGhost: {
    background: "transparent",
    border: "1px solid var(--border-color)", // was #333
    color: "var(--text-primary)", // was #fff
    padding: "12px 24px",
    fontSize: "14px",
    fontWeight: "bold",
    borderRadius: "4px",
    cursor: "pointer",
    transition: "all 0.2s",
    display: "flex", alignItems: "center", gap: "8px"
  },
  ctaDone: {
    background: "var(--bg-secondary)", // was #111
    border: "1px solid var(--border-color)", // was #333
    color: "var(--accent-primary)", // was #00ff88
    padding: "8px 16px",
    fontSize: "12px",
    fontWeight: "bold",
    borderRadius: "4px",
    cursor: "default",
    opacity: 0.8
  },
  connectedPill: {
    background: "var(--bg-secondary)",
    border: "1px solid var(--border-color)",
    padding: "10px 20px",
    borderRadius: "30px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "13px",
    fontWeight: "bold",
    color: "var(--text-primary)",
  },
  pillDot: {
    width: "8px", height: "8px", borderRadius: "50%",
    background: "var(--accent-primary)",
    boxShadow: "0 0 10px var(--accent-primary)"
  },
  glassStat: {
    background: "var(--bg-secondary)", // was rbga(255,255,255,0.03)
    border: "1px solid var(--border-color)", // was #222
    backdropFilter: "blur(10px)",
    borderRadius: "16px",
    padding: "24px",
    width: "320px",
    position: "relative",
    overflow: "hidden"
  },
  statRow: {
    display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px"
  },
  statLabel: {
    fontSize: "10px", fontWeight: "700", color: "var(--text-tertiary)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "4px"
  },
  metric: {
    fontSize: "42px", fontWeight: "900", color: "var(--text-primary)", lineHeight: 1
  },
  metricSmall: {
    fontSize: "20px", fontWeight: "bold", color: "var(--text-primary)"
  },
  teamBadge: {
    background: "var(--bg-tertiary)", border: "1px solid var(--border-color)",
    fontSize: "10px", padding: "4px 8px", borderRadius: "4px", color: "var(--text-secondary)"
  },
  statGrid: {
    display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "20px"
  },
  progressTrack: {
    width: "100%", height: "4px", background: "var(--border-color)", borderRadius: "2px", overflow: "hidden", marginBottom: "8px"
  },
  progressFill: {
    height: "100%", background: "linear-gradient(90deg, #00ff88, #00d1ff)"
  },
  progressLabel: {
    fontSize: "10px", color: "var(--text-tertiary)", textAlign: "right" as const
  },

  // TABS
  tabBar: {
    padding: "0 40px",
    display: "flex",
    gap: "32px",
    borderBottom: "1px solid var(--border-color)",
    marginBottom: "40px"
  },
  tabBtn: {
    background: "transparent",
    border: "none",
    padding: "16px 0",
    fontSize: "14px",
    fontWeight: "bold",
    color: "var(--text-secondary)", // was #666
    cursor: "pointer",
    borderBottom: "2px solid transparent",
    transition: "all 0.2s"
  },
  tabActive: {
    color: "var(--text-primary)", // was #fff
    borderBottom: "2px solid var(--accent-primary)"
  },

  // SECTIONS
  section: {
    padding: "0 40px 60px",
    animation: "fadeIn 0.5s ease"
  },
  sectionHead: {
    marginBottom: "40px"
  },
  sectionTitle: {
    fontSize: "32px",
    fontWeight: "800",
    color: "var(--text-primary)",
    margin: "0 0 10px 0"
  },
  sectionLead: {
    fontSize: "16px", color: "var(--text-secondary)", maxWidth: "600px"
  },
  sectionHeaderFlex: {
    display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "40px"
  },

  // JOIN GRID
  joinGrid: {
    display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "24px"
  },
  card: {
    background: "var(--bg-secondary)", // was #0a0a0a
    border: "1px solid var(--border-color)", // was #222
    borderRadius: "12px",
    padding: "24px",
    transition: "border-color 0.2s"
  },
  cardTitle: {
    fontSize: "14px", fontWeight: "800", color: "var(--text-primary)", marginBottom: "20px", letterSpacing: "1px", textTransform: "uppercase"
  },
  infoRow: {
    display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px",
    paddingBottom: "16px", borderBottom: "1px solid var(--border-color)"
  },
  label: {
    fontSize: "11px", fontWeight: "700", color: "var(--text-tertiary)", letterSpacing: "0.5px"
  },
  value: {
    fontSize: "13px", fontWeight: "600", color: "var(--text-primary)", fontFamily: "monospace"
  },
  pill: {
    fontSize: "11px", fontWeight: "bold", padding: "4px 8px", background: "var(--bg-tertiary)",
    borderRadius: "4px", color: "var(--accent-primary)", border: "1px solid var(--border-color)"
  },
  actionRow: {
    marginTop: "24px"
  },
  successCard: {
    marginTop: "20px", padding: "16px", background: "rgba(0,255,136,0.1)", border: "1px solid var(--accent-primary)", borderRadius: "8px", textAlign: "center"
  },
  successTitle: {
    color: "var(--accent-primary)", fontWeight: "bold", fontSize: "14px", marginBottom: "4px"
  },
  list: {
    paddingLeft: "20px", color: "var(--text-secondary)", lineHeight: "1.8", fontSize: "14px"
  },
  listItem: {
    marginBottom: "10px"
  },

  // TASKS
  tasksGrid: {
    display: "flex", flexDirection: "column", gap: "16px"
  },
  taskCard: {
    background: "var(--bg-secondary)", // was #0a0a0a
    border: "1px solid var(--border-color)",
    borderRadius: "8px",
    padding: "24px",
    position: "relative",
    transition: "transform 0.2s, border-color 0.2s",
  },
  cardTop: {
    display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px"
  },
  taskId: {
    fontSize: "12px", color: "var(--text-tertiary)", marginBottom: "8px", fontFamily: "monospace"
  },
  taskTitle: {
    fontSize: "18px", fontWeight: "700", color: "var(--text-primary)", margin: "0 0 8px 0"
  },
  taskDescription: {
    fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.5", maxWidth: "700px"
  },
  priorityBadge: {
    fontSize: "10px", fontWeight: "800", padding: "4px 8px", borderRadius: "4px",
    letterSpacing: "0.5px", textTransform: "uppercase"
  },
  Critical: { background: "rgba(255, 51, 51, 0.1)", color: "#ff3333", border: "1px solid rgba(255,51,51,0.3)" },
  High: { background: "rgba(255, 153, 0, 0.1)", color: "#ff9900", border: "1px solid rgba(255,153,0,0.3)" },
  Normal: { background: "rgba(0, 255, 136, 0.1)", color: "#00ff88", border: "1px solid rgba(0,255,136,0.3)" },

  metaRow: {
    display: "flex", gap: "40px", borderTop: "1px solid var(--border-color)", borderBottom: "1px solid var(--border-color)", padding: "16px 0"
  },
  metaBlock: {},
  metaLabel: { fontSize: "10px", color: "var(--text-tertiary)", fontWeight: "700", marginBottom: "4px", letterSpacing: "1px" },
  metaValue: { fontSize: "13px", color: "var(--text-primary)", fontWeight: "600", fontFamily: "monospace" },
  metaValueTruncated: { fontSize: "13px", color: "var(--text-primary)", fontWeight: "600", fontFamily: "monospace", maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },

  actionsRow: {
    display: "flex", justifyContent: "flex-end", marginTop: "16px"
  },
  filterPills: {
    display: "flex", gap: "8px", background: "var(--bg-secondary)", padding: "4px", borderRadius: "8px", border: "1px solid var(--border-color)"
  },
  filterPill: {
    background: "transparent", border: "none", color: "var(--text-secondary)", fontSize: "12px", fontWeight: "600",
    padding: "6px 12px", borderRadius: "6px", cursor: "pointer", transition: "all 0.2s"
  },
  filterPillActive: {
    background: "var(--bg-tertiary)", color: "var(--text-primary)", boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
  },
  emptyState: {
    padding: "60px", textAlign: "center", border: "2px dashed var(--border-color)", borderRadius: "12px", color: "var(--text-tertiary)"
  },
  emptyTitle: { fontSize: "16px", fontWeight: "bold", marginBottom: "8px", color: "var(--text-secondary)" },
  emptySub: { fontSize: "14px" },

  statsRow: {
    display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "24px", marginTop: "40px"
  },
  statCard: {
    background: "var(--bg-secondary)", border: "1px solid var(--border-color)", padding: "20px", borderRadius: "8px", textAlign: "center"
  },

  // APPS
  appsGrid: {
    display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "24px"
  },
  appCard: {
    background: "var(--bg-secondary)",
    border: "1px solid var(--border-color)",
    padding: "30px", borderRadius: "16px",
    display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
    transition: "transform 0.2s, border-color 0.2s",
    cursor: "pointer",
    minHeight: "200px"
  },
  appIconBox: {
    marginBottom: "20px", padding: "16px", background: "var(--bg-tertiary)", borderRadius: "12px",
    boxShadow: "0 8px 16px rgba(0,0,0,0.2)"
  },
  appTitle: {
    fontSize: "18px", fontWeight: "700", color: "var(--text-primary)", marginBottom: "8px"
  },
  appDesc: {
    fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.5", marginBottom: "24px"
  },
  launchBtn: {
    marginTop: "auto",
    background: "transparent", border: "1px solid var(--accent-primary)", color: "var(--accent-primary)",
    fontSize: "11px", fontWeight: "bold", padding: "8px 16px", borderRadius: "4px", letterSpacing: "1px"
  }
}
