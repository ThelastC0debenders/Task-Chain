import { useEffect, useState } from "react"
import axios from "axios"
import { connectWallet } from "../services/wallet"

const API = "http://localhost:5000"

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
  const [teamId, setTeamId] = useState("team-123")
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

  const getPriorityColor = (priority: number) => {
    if (priority >= 8) return "#f44336"
    if (priority >= 5) return "#ff9800"
    return "#4caf50"
  }

  const getPriorityLabel = (priority: number) => {
    if (priority >= 8) return "🔴 Critical"
    if (priority >= 5) return "🟡 High"
    return "🟢 Normal"
  }

  const isTaskClaimed = (taskId: string) => claimedTasks.includes(taskId)

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>🎯 Task Marketplace</h1>
        <p style={styles.subtitle}>Claim tasks and earn rewards</p>
      </div>

      {address && (
        <div style={styles.walletCard}>
          <span>✓ Connected:</span>
          <span style={styles.address}>{address.slice(0, 6)}...{address.slice(-4)}</span>
        </div>
      )}

      <div style={styles.controlsCard}>
        {!address && (
          <button onClick={connectWalletHandler} style={styles.buttonConnect}>
            🔗 Connect Wallet to Claim Tasks
          </button>
        )}

        <div style={styles.filterBox}>
          <div style={styles.filterLabel}>Filter:</div>
          <button
            onClick={() => setFilter("all")}
            style={{ ...styles.filterBtn, opacity: filter === "all" ? 1 : 0.6 }}
          >
            All Tasks ({tasks.length})
          </button>
          <button
            onClick={() => setFilter("open")}
            style={{ ...styles.filterBtn, opacity: filter === "open" ? 1 : 0.6 }}
          >
            Open ({tasks.filter(t => t.status === "open").length})
          </button>
          <button
            onClick={() => setFilter("claimed")}
            style={{ ...styles.filterBtn, opacity: filter === "claimed" ? 1 : 0.6 }}
          >
            My Tasks ({claimedTasks.length})
          </button>
        </div>

        <div style={styles.teamInfo}>
          <strong>Team:</strong> {teamId}
        </div>
      </div>

      <div style={styles.tasksGrid}>
        {filteredTasks.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>📭</div>
            <p>No tasks available</p>
            <p style={styles.smallText}>Check back later for new opportunities</p>
          </div>
        ) : (
          filteredTasks.map(task => (
            <div key={task.id} style={styles.taskCard}>
              <div style={styles.taskHeader}>
                <div>
                  <h3 style={styles.taskTitle}>{task.title}</h3>
                  <p style={styles.taskDescription}>{task.description}</p>
                </div>
                <div
                  style={{
                    ...styles.badge,
                    background: getPriorityColor(task.priority),
                  }}
                >
                  {getPriorityLabel(task.priority)}
                </div>
              </div>

              <div style={styles.taskMeta}>
                <div style={styles.metaItem}>
                  <span style={styles.metaLabel}>📅</span>
                  <div>
                    <div style={styles.metaTitle}>Deadline</div>
                    <div style={styles.metaValue}>
                      {new Date(task.deadline).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div style={styles.metaItem}>
                  <span style={styles.metaLabel}>💰</span>
                  <div>
                    <div style={styles.metaTitle}>Reward</div>
                    <div style={styles.metaValue}>{task.reward}</div>
                  </div>
                </div>

                <div style={styles.metaItem}>
                  <span style={styles.metaLabel}>👤</span>
                  <div>
                    <div style={styles.metaTitle}>Posted by</div>
                    <div style={styles.metaValue}>{task.createdBy}</div>
                  </div>
                </div>
              </div>

              <div style={styles.statusBar}>
                <span
                  style={{
                    ...styles.status,
                    background:
                      task.status === "completed"
                        ? "#4CAF50"
                        : task.status === "claimed"
                        ? "#2196F3"
                        : "#FFC107",
                  }}
                >
                  {task.status === "completed"
                    ? "✓ Completed"
                    : task.status === "claimed"
                    ? "🔒 Claimed"
                    : "Open"}
                </span>
              </div>

              <div style={styles.actionButtons}>
                {!isTaskClaimed(task.id) && task.status === "open" && (
                  <button
                    onClick={() => handleClaimTask(task.id)}
                    disabled={!address}
                    style={{
                      ...styles.buttonClaim,
                      opacity: !address ? 0.5 : 1,
                      cursor: !address ? "not-allowed" : "pointer",
                    }}
                  >
                    ✓ Claim Task
                  </button>
                )}

                {isTaskClaimed(task.id) && task.status === "claimed" && (
                  <button
                    onClick={() => handleCompleteTask(task.id)}
                    style={styles.buttonComplete}
                  >
                    ✓ Mark Complete
                  </button>
                )}

                {task.status === "completed" && (
                  <button style={styles.buttonDisabled}>✓ Completed</button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div style={styles.statsCard}>
        <div style={styles.stat}>
          <div style={styles.statValue}>{tasks.length}</div>
          <div style={styles.statLabel}>Total Tasks</div>
        </div>
        <div style={styles.stat}>
          <div style={styles.statValue}>{claimedTasks.length}</div>
          <div style={styles.statLabel}>Tasks Claimed</div>
        </div>
        <div style={styles.stat}>
          <div style={styles.statValue}>{tasks.filter(t => t.status === "completed").length}</div>
          <div style={styles.statLabel}>Completed</div>
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
    marginBottom: "30px",
  },
  subtitle: {
    fontSize: "16px",
    opacity: 0.9,
    marginTop: "8px",
  },
  walletCard: {
    background: "rgba(255, 255, 255, 0.2)",
    border: "1px solid rgba(255, 255, 255, 0.3)",
    color: "white",
    padding: "12px 20px",
    borderRadius: "8px",
    marginBottom: "20px",
    maxWidth: "900px",
    margin: "0 auto 20px",
    display: "flex",
    justifyContent: "center",
    gap: "10px",
  },
  address: {
    fontFamily: "monospace",
    background: "rgba(0, 0, 0, 0.2)",
    padding: "4px 12px",
    borderRadius: "4px",
  },
  controlsCard: {
    background: "white",
    padding: "20px",
    borderRadius: "12px",
    marginBottom: "30px",
    maxWidth: "900px",
    margin: "0 auto 30px",
    boxShadow: "0 10px 40px rgba(0, 0, 0, 0.1)",
  },
  buttonConnect: {
    width: "100%",
    padding: "12px 20px",
    background: "#4CAF50",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "bold",
    marginBottom: "20px",
  },
  filterBox: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
    marginBottom: "16px",
    flexWrap: "wrap" as const,
  },
  filterLabel: {
    fontWeight: "bold",
    color: "#333",
  },
  filterBtn: {
    padding: "8px 16px",
    background: "#667eea",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
  },
  teamInfo: {
    color: "#666",
    fontSize: "14px",
  },
  tasksGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
    gap: "20px",
    maxWidth: "1400px",
    margin: "0 auto 30px",
  },
  taskCard: {
    background: "white",
    borderRadius: "12px",
    padding: "20px",
    boxShadow: "0 10px 40px rgba(0, 0, 0, 0.1)",
    transition: "transform 0.2s, box-shadow 0.2s",
  },
  taskHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "16px",
    gap: "12px",
  },
  taskTitle: {
    margin: "0 0 6px",
    color: "#333",
    fontSize: "18px",
  },
  taskDescription: {
    margin: "0",
    color: "#666",
    fontSize: "14px",
    lineHeight: "1.4",
  },
  badge: {
    padding: "6px 12px",
    color: "white",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: "bold",
    whiteSpace: "nowrap" as const,
  },
  taskMeta: {
    display: "grid",
    gap: "12px",
    marginBottom: "16px",
    paddingBottom: "16px",
    borderBottom: "1px solid #e0e0e0",
  },
  metaItem: {
    display: "flex",
    gap: "8px",
  },
  metaLabel: {
    fontSize: "16px",
  },
  metaTitle: {
    fontSize: "11px",
    color: "#999",
    textTransform: "uppercase" as const,
    fontWeight: "bold",
  },
  metaValue: {
    fontSize: "13px",
    color: "#333",
    fontWeight: "500",
  },
  statusBar: {
    marginBottom: "16px",
  },
  status: {
    display: "inline-block",
    padding: "6px 12px",
    color: "white",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: "bold",
  },
  actionButtons: {
    display: "grid",
    gap: "8px",
  },
  buttonClaim: {
    padding: "10px 16px",
    background: "#4CAF50",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "bold",
  },
  buttonComplete: {
    padding: "10px 16px",
    background: "#2196F3",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "bold",
  },
  buttonDisabled: {
    padding: "10px 16px",
    background: "#999",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "not-allowed",
    fontSize: "14px",
    fontWeight: "bold",
  },
  emptyState: {
    gridColumn: "1 / -1",
    textAlign: "center" as const,
    padding: "60px 20px",
    color: "white",
  },
  emptyIcon: {
    fontSize: "64px",
    marginBottom: "16px",
  },
  smallText: {
    fontSize: "14px",
    marginTop: "8px",
    opacity: 0.8,
  },
  statsCard: {
    background: "white",
    padding: "30px",
    borderRadius: "12px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "20px",
    maxWidth: "900px",
    margin: "0 auto",
    boxShadow: "0 10px 40px rgba(0, 0, 0, 0.1)",
  },
  stat: {
    textAlign: "center" as const,
  },
  statValue: {
    fontSize: "32px",
    fontWeight: "bold",
    color: "#667eea",
  },
  statLabel: {
    fontSize: "13px",
    color: "#999",
    marginTop: "6px",
  },
}
