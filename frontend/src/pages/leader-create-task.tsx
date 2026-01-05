import { useState } from "react"
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
}

export default function LeaderCreateTask() {
  const [teamId, setTeamId] = useState("team-123")
  const [address, setAddress] = useState("")
  const [tasks, setTasks] = useState<Task[]>([])
  const [formOpen, setFormOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "1",
    deadline: "",
    reward: "",
  })

  async function connectAndLoad() {
    try {
      const { address } = await connectWallet()
      setAddress(address)
    } catch (err: any) {
      alert("Error: " + err.message)
    }
  }

  function handleCreateTask() {
    if (!form.title || !form.description || !form.deadline) {
      alert("Please fill all fields")
      return
    }

    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: form.title,
      description: form.description,
      priority: parseInt(form.priority),
      deadline: form.deadline,
      reward: form.reward || "Not specified",
      status: "open",
    }

    setTasks([...tasks, newTask])
    setForm({ title: "", description: "", priority: "1", deadline: "", reward: "" })
    setFormOpen(false)
  }

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

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>📋 Task Management Dashboard</h1>
        <p style={styles.subtitle}>Create and manage team tasks</p>
      </div>

      {address && (
        <div style={styles.walletCard}>
          <span>✓ Connected:</span>
          <span style={styles.address}>{address.slice(0, 6)}...{address.slice(-4)}</span>
        </div>
      )}

      <div style={styles.grid}>
        {/* Left: Create Task */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h2>➕ Create New Task</h2>
            {!address && (
              <button onClick={connectAndLoad} style={styles.buttonConnect}>
                🔗 Connect Wallet
              </button>
            )}
          </div>

          {address && (
            <>
              {!formOpen ? (
                <button onClick={() => setFormOpen(true)} style={styles.buttonPrimary}>
                  + Create Task
                </button>
              ) : (
                <div style={styles.form}>
                  <label style={styles.label}>
                    <div>Task Title</div>
                    <input
                      value={form.title}
                      onChange={e => setForm({ ...form, title: e.target.value })}
                      placeholder="e.g., Review Smart Contract"
                      style={styles.input}
                    />
                  </label>

                  <label style={styles.label}>
                    <div>Description</div>
                    <textarea
                      value={form.description}
                      onChange={e => setForm({ ...form, description: e.target.value })}
                      placeholder="Detailed task description..."
                      style={{ ...styles.input, minHeight: "80px", resize: "none" }}
                    />
                  </label>

                  <label style={styles.label}>
                    <div>Priority Level</div>
                    <select
                      value={form.priority}
                      onChange={e => setForm({ ...form, priority: e.target.value })}
                      style={styles.input}
                    >
                      <option value="1">🟢 Normal (1-3)</option>
                      <option value="5">🟡 High (5-7)</option>
                      <option value="8">🔴 Critical (8+)</option>
                    </select>
                  </label>

                  <label style={styles.label}>
                    <div>Deadline</div>
                    <input
                      type="datetime-local"
                      value={form.deadline}
                      onChange={e => setForm({ ...form, deadline: e.target.value })}
                      style={styles.input}
                    />
                  </label>

                  <label style={styles.label}>
                    <div>Reward (optional)</div>
                    <input
                      value={form.reward}
                      onChange={e => setForm({ ...form, reward: e.target.value })}
                      placeholder="e.g., 100 USDC"
                      style={styles.input}
                    />
                  </label>

                  <div style={styles.formButtons}>
                    <button onClick={handleCreateTask} style={styles.buttonConfirm}>
                      ✓ Create Task
                    </button>
                    <button
                      onClick={() => setFormOpen(false)}
                      style={{ ...styles.button, background: "#999" }}
                    >
                      ✕ Cancel
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right: Task List */}
        <div style={styles.card}>
          <h2>📌 Team Tasks ({tasks.length})</h2>

          <div style={styles.tasksList}>
            {tasks.length === 0 ? (
              <div style={styles.emptyState}>
                <p>No tasks yet</p>
                <p style={styles.smallText}>Create a task to get started</p>
              </div>
            ) : (
              tasks.map(task => (
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
                    <div>
                      <span style={styles.metaLabel}>📅 Deadline:</span>
                      <span>{new Date(task.deadline).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span style={styles.metaLabel}>💰 Reward:</span>
                      <span>{task.reward}</span>
                    </div>
                    <div>
                      <span style={styles.metaLabel}>Status:</span>
                      <span
                        style={{
                          ...styles.statusBadge,
                          background: task.status === "open" ? "#4CAF50" : "#2196F3",
                        }}
                      >
                        {task.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div style={styles.statsBox}>
            <div><strong>Total Tasks:</strong> {tasks.length}</div>
            <div><strong>Team:</strong> {teamId}</div>
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
  walletCard: {
    background: "rgba(255, 255, 255, 0.2)",
    border: "1px solid rgba(255, 255, 255, 0.3)",
    color: "white",
    padding: "12px 20px",
    borderRadius: "8px",
    marginBottom: "30px",
    maxWidth: "600px",
    margin: "0 auto 30px",
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
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "30px",
    maxWidth: "1400px",
    margin: "0 auto",
  },
  card: {
    background: "white",
    padding: "30px",
    borderRadius: "12px",
    boxShadow: "0 10px 40px rgba(0, 0, 0, 0.1)",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  buttonConnect: {
    padding: "8px 16px",
    background: "#4CAF50",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
  },
  buttonPrimary: {
    width: "100%",
    padding: "12px 20px",
    background: "#667eea",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  button: {
    flex: 1,
    padding: "10px 16px",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
  },
  buttonConfirm: {
    flex: 1,
    padding: "10px 16px",
    background: "#4CAF50",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
  },
  form: {
    display: "grid",
    gap: "16px",
  },
  formButtons: {
    display: "flex",
    gap: "10px",
  },
  label: {
    display: "block",
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    marginTop: "6px",
    border: "2px solid #e0e0e0",
    borderRadius: "6px",
    fontSize: "14px",
    boxSizing: "border-box" as const,
  },
  tasksList: {
    display: "grid",
    gap: "12px",
    maxHeight: "600px",
    overflowY: "auto" as const,
    marginBottom: "20px",
  },
  taskCard: {
    background: "#f9f9f9",
    border: "2px solid #e0e0e0",
    borderRadius: "8px",
    padding: "16px",
  },
  taskHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "12px",
  },
  taskTitle: {
    margin: "0 0 6px",
    color: "#333",
    fontSize: "16px",
  },
  taskDescription: {
    margin: "0",
    color: "#666",
    fontSize: "13px",
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
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "8px",
    fontSize: "12px",
    color: "#666",
  },
  metaLabel: {
    fontWeight: "bold",
    marginRight: "4px",
  },
  statusBadge: {
    color: "white",
    padding: "2px 8px",
    borderRadius: "3px",
    fontSize: "11px",
  },
  emptyState: {
    textAlign: "center" as const,
    padding: "40px 20px",
    color: "#999",
  },
  smallText: {
    fontSize: "12px",
    marginTop: "6px",
  },
  statsBox: {
    background: "#f0f0f0",
    padding: "16px",
    borderRadius: "6px",
    fontSize: "14px",
  },
}
