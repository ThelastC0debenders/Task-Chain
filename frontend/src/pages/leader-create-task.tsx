
import { useState } from "react"
import { connectWallet } from "../services/wallet"
import {
  Wallet,
  PlusCircle,
  Check,
  Calendar,
  DollarSign,
  FileText,
  Clock,
  Layout,
  Plus
} from "lucide-react"



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
  const teamId = "team-123"
  const [address, setAddress] = useState("")
  const [tasks, setTasks] = useState<Task[]>([])
  const [formOpen, setFormOpen] = useState(false)


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
      id: `task - ${Date.now()} `,
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
    if (priority >= 8) return "#ff3333" // Red
    if (priority >= 5) return "#ff9900" // Orange
    return "#00ff88" // Green
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

const styles: any = {
  container: {
    minHeight: "100vh",
    background: "#050505",
    color: "#e0e0e0",
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    height: "70px",
    borderBottom: "1px solid #1a1a1a",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 30px",
    background: "#080808",
  },
  logoArea: { display: "flex", alignItems: "center", gap: "12px" },
  logoIcon: {
    width: "32px", height: "32px", background: "rgba(0, 255, 136, 0.1)",
    borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center",
  },
  title: { fontSize: "18px", fontWeight: "800", color: "#ffffff", margin: 0, lineHeight: 1 },
  subtitle: { fontSize: "10px", color: "#00ff88", margin: 0, letterSpacing: "1px", opacity: 0.8 },
  headerTitle: {
    position: "absolute", left: "50%", transform: "translateX(-50%)",
    color: "#ffffff", fontSize: "14px", fontWeight: "600",
  },
  headerActions: { display: "flex", alignItems: "center", gap: "15px" },
  walletBadge: {
    background: "#111", border: "1px solid #333", padding: "6px 12px",
    borderRadius: "6px", fontSize: "13px", display: "flex", alignItems: "center",
    gap: "8px", color: "#ccc",
  },
  connectedText: { background: "#1a1a1a", padding: "2px 6px", borderRadius: "4px", fontSize: "10px", color: "#666" },
  connectBtnSmall: {
    background: "#00ff88", color: "black", border: "none", padding: "6px 14px",
    borderRadius: "4px", fontWeight: "bold", fontSize: "12px", cursor: "pointer",
  },

  main: {
    flex: 1,
    padding: "40px 30px", // Match header padding
    width: "100%",
    boxSizing: "border-box",
  },
  sectionHeader: {
    display: "flex", alignItems: "center", marginBottom: "25px", position: "relative",
  },
  sectionTitleBorder: {
    width: "4px", height: "24px", background: "#00ff88",
    marginRight: "12px", boxShadow: "0 0 8px #00ff88",
  },
  sectionTitle: { fontSize: "24px", color: "#fff", margin: 0, fontWeight: "700" },
  protocolText: {
    marginLeft: "auto", color: "#444", fontSize: "12px",
    letterSpacing: "1px", textTransform: "uppercase",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1.5fr",
    gap: "30px",
    alignItems: "start",
    width: "100%", // Force full width
  },
  card: {
    background: "#0a0a0a", border: "1px solid #1f1f1f", borderRadius: "12px",
    padding: "24px", position: "relative",
  },
  cardHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px",
  },
  cardTitle: {
    fontSize: "16px", fontWeight: "600", color: "#fff", margin: 0,
    display: "flex", alignItems: "center", gap: "10px",
  },
  plusIcon: { color: "#00ff88" },
  listIcon: { color: "#00ff88", marginRight: "10px" },

  form: { display: "flex", flexDirection: "column", gap: "20px" },
  formGroup: { marginBottom: "5px" },
  formGroupHalf: { flex: 1 },
  label: {
    display: "block", color: "#666", fontSize: "11px", fontWeight: "bold",
    marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px",
  },
  input: {
    width: "100%", background: "#0f0f0f", border: "1px solid #2a2a2a",
    padding: "12px", color: "white", borderRadius: "6px", fontSize: "14px",
    fontFamily: "inherit", boxSizing: "border-box",
  },
  textarea: {
    width: "100%", background: "#0f0f0f", border: "1px solid #2a2a2a",
    padding: "12px", color: "white", borderRadius: "6px", fontSize: "14px",
    fontFamily: "inherit", minHeight: "100px", resize: "vertical", boxSizing: "border-box",
  },
  selectWrapper: { position: "relative" },
  select: {
    width: "100%", background: "#0f0f0f", border: "1px solid #2a2a2a",
    padding: "12px", color: "white", borderRadius: "6px", fontSize: "14px",
    fontFamily: "inherit", boxSizing: "border-box", appearance: "none", cursor: "pointer",
  },
  inputIconWrapper: {
    display: "flex", background: "#0f0f0f", border: "1px solid #2a2a2a",
    borderRadius: "6px", alignItems: "center",
  },
  inputNoBorder: {
    flex: 1, background: "transparent", border: "none", padding: "12px",
    color: "white", fontSize: "14px", fontFamily: "inherit", outline: "none",
  },
  row: { display: "flex", gap: "15px", marginBottom: "5px" },

  createChainBtn: {
    width: "100%", background: "#00ff88", color: "#000", border: "none",
    padding: "15px", borderRadius: "6px", fontSize: "14px", fontWeight: "800",
    cursor: "pointer", boxShadow: "0 0 20px rgba(0,255,136,0.2)",
    display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
  },
  cancelBtn: {
    width: "100%", background: "transparent", border: "1px solid #333", color: "#666",
    padding: "15px", borderRadius: "6px", fontSize: "12px", fontWeight: "600",
    cursor: "pointer", marginTop: "10px",
  },
  formButtons: { marginTop: "10px" },

  registryCard: {
    flex: 1, background: "#0a0a0a", border: "1px solid #1f1f1f",
    borderRadius: "12px", display: "flex", flexDirection: "column",
  },
  registryHeader: {
    padding: "20px", borderBottom: "1px solid #1f1f1f",
    display: "flex", justifyContent: "space-between", alignItems: "center",
  },
  countBadge: { background: "#111", padding: "2px 8px", borderRadius: "10px", fontSize: "12px", color: "#666", marginLeft: "10px", border: "1px solid #222" },
  taskList: { padding: "10px", maxHeight: "600px", overflowY: "auto" },
  emptyState: { padding: "60px", textAlign: "center", color: "#444", fontStyle: "italic" },
  iconPos: { marginBottom: "15px", display: "flex", justifyContent: "center" },

  taskItem: {
    background: "#0e0e0e", border: "1px solid #1f1f1f", borderRadius: "8px",
    padding: "20px", marginBottom: "12px", display: "flex", gap: "20px",
  },
  taskItemMain: { flex: 1 },
  taskItemTitle: { color: "white", fontSize: "16px", fontWeight: "700", marginBottom: "6px" },
  taskItemMeta: { color: "#888", fontSize: "13px", marginBottom: "12px", lineHeight: "1.4" },
  taskMetaRow: { display: "flex", gap: "15px" },
  metaWithIcon: { display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#666", background: "#111", padding: "4px 8px", borderRadius: "4px" },

  taskItemRight: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "10px", minWidth: "100px" },
  priorityBadge: {
    fontSize: "10px", padding: "4px 10px", borderRadius: "4px",
    border: "1px solid", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.5px",
  },
  statusPill: {
    background: "#111", border: "1px solid #333", padding: "4px 10px",
    borderRadius: "20px", fontSize: "10px", color: "#aaa",
    display: "inline-flex", alignItems: "center", gap: "6px",
  },
  statusDotSmall: { width: "6px", height: "6px", borderRadius: "50%" },
}
