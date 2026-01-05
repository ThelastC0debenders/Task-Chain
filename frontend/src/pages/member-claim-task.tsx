import { useState } from "react"
import { connectWallet } from "../services/wallet"
import { Wallet, Clock, DollarSign, User, Activity, Layers, CheckCircle, Filter } from "lucide-react"



interface Task {
  id: string
  title: string
  description: string
  priority: number
  deadline: string
  status: "open" | "claimed" | "completed"
  reward?: string
  claimedBy?: string
  createdBy?: string
}

export default function MemberClaimTask() {
  const [address, setAddress] = useState("")
  const teamId = "team-123"

  const [tasks, setTasks] = useState<Task[]>([
    {
      id: "task-1",
      title: "Code Review",
      description: "Review the authentication module",
      priority: 8,
      deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      status: "open",
      reward: "100 USDC",
      createdBy: "0x1234...5678",
    },
    {
      id: "task-2",
      title: "Write Tests",
      description: "Write unit tests for payment processing",
      priority: 5,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: "open",
      reward: "75 USDC",
      createdBy: "0x1234...5678",
    },
    {
      id: "task-3",
      title: "Documentation",
      description: "Update API documentation",
      priority: 2,
      deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      status: "open",
      reward: "50 USDC",
      createdBy: "0x1234...5678",
    },
  ])
  const [claimedTasks, setClaimedTasks] = useState<string[]>([])
  const [filter, setFilter] = useState("all")

  async function connectWalletHandler() {
    try {
      const { address } = await connectWallet()
      setAddress(address)
    } catch (err: any) {
      alert("Error: " + err.message)
    }
  }

  function handleClaimTask(taskId: string) {
    if (!address) {
      alert("Please connect wallet first")
      return
    }

    setClaimedTasks([...claimedTasks, taskId])
    setTasks(
      tasks.map(t =>
        t.id === taskId ? { ...t, status: "claimed", claimedBy: address } : t
      )
    )
  }

  function handleCompleteTask(taskId: string) {
    setTasks(
      tasks.map(t =>
        t.id === taskId ? { ...t, status: "completed" } : t
      )
    )
    setClaimedTasks(claimedTasks.filter(id => id !== taskId))
  }

  const filteredTasks = tasks.filter(t => {
    if (filter === "open") return t.status === "open"
    if (filter === "claimed") return claimedTasks.includes(t.id)
    return true
  })

  const getPriorityLabel = (priority: number) => {
    if (priority >= 8) return "🔴 Critical"
    if (priority >= 5) return "🟡 High"
    return "🟢 Normal"
  }

  const isTaskClaimed = (taskId: string) => claimedTasks.includes(taskId)

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.eyebrow}>AVAILABLE BOUNTIES</div>
          <h1 style={styles.title}>Task Marketplace</h1>
          <p style={styles.subtitle}>Claim tasks, ship code, get paid.</p>
        </div>

        {address ? (
          <div style={styles.walletBadge}>
            <div style={styles.walletDot}></div>
            <span style={styles.walletText}>{address.slice(0, 6)}...{address.slice(-4)}</span>
          </div>
        ) : (
          <button onClick={connectWalletHandler} style={styles.connectBtn}>
            <Wallet size={16} /> CONNECT WALLET
          </button>
        )}
      </div>

      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <div style={styles.statIcon}><Layers size={20} color="#667eea" /></div>
          <div>
            <div style={styles.statValue}>{tasks.length}</div>
            <div style={styles.statLabel}>Total Tasks</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}><Activity size={20} color="#f9d423" /></div>
          <div>
            <div style={styles.statValue}>{tasks.filter(t => t.status === "open").length}</div>
            <div style={styles.statLabel}>Open Bounties</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}><CheckCircle size={20} color="#00ff88" /></div>
          <div>
            <div style={styles.statValue}>{claimedTasks.length}</div>
            <div style={styles.statLabel}>Claimed by You</div>
          </div>
        </div>
      </div>

      <div style={styles.controlsBar}>
        <div style={styles.filterGroup}>
          <Filter size={14} color="#666" style={{ marginRight: '8px' }} />
          <button
            onClick={() => setFilter("all")}
            style={{ ...styles.filterBtn, ...(filter === "all" ? styles.filterBtnActive : {}) }}
          >
            All
          </button>
          <button
            onClick={() => setFilter("open")}
            style={{ ...styles.filterBtn, ...(filter === "open" ? styles.filterBtnActive : {}) }}
          >
            Open
          </button>
          <button
            onClick={() => setFilter("claimed")}
            style={{ ...styles.filterBtn, ...(filter === "claimed" ? styles.filterBtnActive : {}) }}
          >
            My Claims
          </button>
        </div>
        <div style={styles.teamTag}>
          TEAM: {teamId}
        </div>
      </div>

      <div style={styles.tasksGrid}>
        {filteredTasks.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>⚡</div>
            <p style={{ color: '#fff', fontWeight: 'bold' }}>No tasks found</p>
            <p style={styles.smallText}>Refresh or check back later.</p>
          </div>
        ) : (
          filteredTasks.map(task => (
            <div key={task.id} style={styles.taskCard}>
              <div style={styles.cardHeader}>
                <div style={styles.taskId}>#{task.id.toUpperCase()}</div>
                <div style={{ ...styles.priorityBadge, ...styles[getPriorityLabel(task.priority).replace(/[^a-zA-Z]/g, '')] }}>
                  {getPriorityLabel(task.priority)}
                </div>
              </div>

              <h3 style={styles.taskTitle}>{task.title}</h3>
              <p style={styles.taskDescription}>{task.description}</p>

              <div style={styles.metaGrid}>
                <div style={styles.metaItem}>
                  <Clock size={14} color="#666" />
                  <span>{new Date(task.deadline).toLocaleDateString()}</span>
                </div>
                <div style={styles.metaItem}>
                  <DollarSign size={14} color="#00ff88" />
                  <span style={{ color: '#00ff88' }}>{task.reward}</span>
                </div>
                <div style={styles.metaItem}>
                  <User size={14} color="#666" />
                  <span style={styles.ownerHash}>{task.createdBy || 'Unknown'}</span>
                </div>
              </div>

              <div style={styles.cardActions}>
                {!isTaskClaimed(task.id) && task.status === "open" && (
                  <button
                    onClick={() => handleClaimTask(task.id)}
                    disabled={!address}
                    style={{
                      ...styles.actionBtn,
                      opacity: !address ? 0.5 : 1,
                      cursor: !address ? "not-allowed" : "pointer",
                    }}
                  >
                    CLAIM BOUNTY
                  </button>
                )}

                {isTaskClaimed(task.id) && task.status === "claimed" && (
                  <button
                    onClick={() => handleCompleteTask(task.id)}
                    style={styles.actionBtnSecondary}
                  >
                    MARK COMPLETE
                  </button>
                )}

                {task.status === "completed" && (
                  <div style={styles.completedTag}>COMPLETED</div>
                )}

                {task.status === "claimed" && !isTaskClaimed(task.id) && (
                  <div style={styles.lockedTag}>LOCKED</div>
                )}
              </div>
            </div>
          ))
        )}
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
    flexWrap: "wrap",
    gap: "20px",
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
  connectBtn: {
    background: "#00ff88",
    color: "#000",
    border: "none",
    padding: "10px 20px",
    borderRadius: "4px",
    fontWeight: "bold",
    fontSize: "12px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    boxShadow: "0 0 20px rgba(0, 255, 136, 0.2)",
  },
  walletBadge: {
    background: "#111",
    border: "1px solid #222",
    padding: "8px 16px",
    borderRadius: "20px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  walletDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "#00ff88",
    boxShadow: "0 0 8px #00ff88",
  },
  walletText: {
    fontSize: "12px",
    fontFamily: "monospace",
    color: "#fff",
  },
  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "20px",
    marginBottom: "40px",
  },
  statCard: {
    background: "#0a0a0a",
    border: "1px solid #1a1a1a",
    borderRadius: "8px",
    padding: "20px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  statIcon: {
    background: "#111",
    padding: "10px",
    borderRadius: "8px",
  },
  statValue: {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#fff",
    lineHeight: "1",
    marginBottom: "4px",
  },
  statLabel: {
    fontSize: "11px",
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  controlsBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    background: "#0a0a0a",
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #1a1a1a",
  },
  filterGroup: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
  },
  filterBtn: {
    background: "transparent",
    border: "none",
    color: "#666",
    padding: "6px 12px",
    borderRadius: "4px",
    fontSize: "12px",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  filterBtnActive: {
    background: "#1a1a1a",
    color: "#fff",
    fontWeight: "bold",
  },
  teamTag: {
    fontSize: "11px",
    color: "#444",
    border: "1px solid #222",
    padding: "4px 8px",
    borderRadius: "4px",
  },
  tasksGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "20px",
  },
  taskCard: {
    background: "#0b0b0b",
    border: "1px solid #1f1f1f",
    borderRadius: "8px",
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    transition: "transform 0.2s, border-color 0.2s",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "15px",
  },
  taskId: {
    fontSize: "11px",
    color: "#444",
  },
  priorityBadge: {
    fontSize: "10px",
    padding: "2px 8px",
    borderRadius: "4px",
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  Normal: { background: "rgba(0, 255, 136, 0.1)", color: "#00ff88" },
  High: { background: "rgba(249, 212, 35, 0.1)", color: "#f9d423" },
  Critical: { background: "rgba(255, 78, 80, 0.1)", color: "#ff4e50" },

  taskTitle: {
    fontSize: "18px",
    margin: "0 0 10px 0",
    color: "#fff",
    fontWeight: "bold",
  },
  taskDescription: {
    fontSize: "13px",
    color: "#888",
    margin: "0 0 20px 0",
    lineHeight: "1.5",
    flex: 1,
  },
  metaGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
    marginBottom: "20px",
    background: "#111",
    padding: "10px",
    borderRadius: "6px",
  },
  metaItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "12px",
    color: "#ccc",
  },
  ownerHash: {
    maxWidth: "80px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    display: "block",
    fontFamily: "monospace",
  },
  cardActions: {
    marginTop: "auto",
    paddingTop: "20px",
    borderTop: "1px solid #1a1a1a",
    display: "flex",
    justifyContent: "center",
  },
  actionBtn: {
    background: "#fff",
    color: "#000",
    border: "none",
    padding: "10px 0",
    width: "100%",
    borderRadius: "4px",
    fontWeight: "bold",
    fontSize: "12px",
    cursor: "pointer",
    letterSpacing: "0.5px",
  },
  actionBtnSecondary: {
    background: "transparent",
    color: "#00ff88",
    border: "1px solid #00ff88",
    padding: "10px 0",
    width: "100%",
    borderRadius: "4px",
    fontWeight: "bold",
    fontSize: "12px",
    cursor: "pointer",
  },
  completedTag: {
    color: "#666",
    fontSize: "12px",
    fontWeight: "bold",
    letterSpacing: "1px",
  },
  lockedTag: {
    color: "#444",
    fontSize: "12px",
    fontWeight: "bold",
    letterSpacing: "1px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  emptyState: {
    gridColumn: "1 / -1",
    textAlign: "center",
    padding: "60px",
    border: "1px dashed #222",
    borderRadius: "12px",
  },
  emptyIcon: {
    fontSize: "32px",
    marginBottom: "10px",
  },
  smallText: {
    fontSize: "12px",
    color: "#444",
  },
}
