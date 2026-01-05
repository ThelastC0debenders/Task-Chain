import { useState, useEffect } from "react"
import axios from "axios"
import { connectWallet } from "../services/wallet"
import { createTaskOnChain } from "../services/contract"

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

export default function LeaderDashboard() {
  const [teamId, setTeamId] = useState("team-123")
  const [ttlSeconds, setTtlSeconds] = useState("3600")
  const [address, setAddress] = useState("")
  const [inviteUrl, setInviteUrl] = useState("")
  const [members, setMembers] = useState<string[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [status, setStatus] = useState("")
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<"invite" | "tasks">("invite")
  const [taskFormOpen, setTaskFormOpen] = useState(false)

  const [taskForm, setTaskForm] = useState({
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
      setStatus("✓ Wallet connected")
    } catch (err: any) {
      setStatus("❌ " + err.message)
    }
  }

  async function handleGenerateInvite() {
    try {
      setStatus("🔗 Creating invite…")
      const res = await axios.post(`${API}/team/invite`, {
        teamId,
        ttlSeconds: Number(ttlSeconds) || 3600,
      })
      setInviteUrl(res.data.inviteUrl)
      setStatus("✅ Invite created!")
      setTimeout(() => fetchMembers(), 500)
    } catch (err: any) {
      setStatus("❌ " + (err.response?.data?.error || err.message))
    }
  }

  async function fetchMembers() {
    try {
      const res = await axios.get(`${API}/team/members/${teamId}`)
      setMembers(res.data.members || [])
    } catch (err: any) {
      console.error("Error fetching members:", err)
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

  async function handleCreateTask() {
    if (!taskForm.title || !taskForm.description || !taskForm.deadline) {
      setStatus("❌ Please fill all task fields")
      return
    }

    try {
      setStatus("⏳ Creating task on blockchain...")
      
      const metadata = JSON.stringify({
        title: taskForm.title,
        description: taskForm.description,
        reward: taskForm.reward || "Not specified"
      })
      const metadataHash = "0x" + Array.from(new TextEncoder().encode(metadata))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('').slice(0, 64)
      
      const deadlineTimestamp = Math.floor(new Date(taskForm.deadline).getTime() / 1000)
      const gracePeriod = 86400
      const priority = parseInt(taskForm.priority)
      
      const taskId = await createTaskOnChain(
        metadataHash,
        "General",
        deadlineTimestamp,
        gracePeriod,
        priority
      )

      const newTask: Task = {
        id: taskId.toString(),
        title: taskForm.title,
        description: taskForm.description,
        priority: priority,
        deadline: taskForm.deadline,
        reward: taskForm.reward || "Not specified",
        status: "open",
        createdBy: address || "unknown",
      }

      await axios.post(`${API}/task/create`, { teamId, task: newTask })
      
      setTasks([...tasks, newTask])
      setTaskForm({ title: "", description: "", priority: "1", deadline: "", reward: "" })
      setTaskFormOpen(false)
      setStatus(`✅ Task #${taskId} created on blockchain!`)
      await fetchTasks()
    } catch (err: any) {
      setStatus("❌ " + (err.response?.data?.error || err.message))
    }
  }
  useEffect(() => {
    if (activeTab === "tasks") {
      fetchTasks()
    }
  }, [activeTab])

  function copyToClipboard() {
    navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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
        <h1>�� Team Leader Dashboard</h1>
        <p style={styles.subtitle}>Manage team invites & create tasks</p>
      </div>

      {address && (
        <div style={styles.walletCard}>
          <span>✓ Connected:</span>
          <span style={styles.address}>{address.slice(0, 6)}...{address.slice(-4)}</span>
        </div>
      )}

      {!address && (
        <button onClick={connectAndLoad} style={styles.connectBtn}>
          🔗 Connect Wallet
        </button>
      )}

      {status && (
        <div
          style={{
            ...styles.status,
            background: status.includes("✅") ? "#c8e6c9" : status.includes("🔗") || status.includes("✓") ? "#e3f2fd" : "#ffcdd2",
            color: status.includes("✅") ? "#2e7d32" : status.includes("🔗") || status.includes("✓") ? "#1565c0" : "#c62828",
          }}
        >
          {status}
        </div>
      )}

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          onClick={() => setActiveTab("invite")}
          style={{
            ...styles.tab,
            borderBottom: activeTab === "invite" ? "3px solid #667eea" : "none",
            color: activeTab === "invite" ? "#667eea" : "#666",
          }}
        >
          🔗 Team Invites
        </button>
        <button
          onClick={() => setActiveTab("tasks")}
          style={{
            ...styles.tab,
            borderBottom: activeTab === "tasks" ? "3px solid #667eea" : "none",
            color: activeTab === "tasks" ? "#667eea" : "#666",
          }}
        >
          📋 Tasks ({tasks.length})
        </button>
      </div>

      {/* Invite Tab */}
      {activeTab === "invite" && (
        <div style={styles.grid}>
          {/* Generate Invite */}
          <div style={styles.card}>
            <h2>➕ Generate Invite Link</h2>

            <label style={styles.label}>
              <div>Team ID</div>
              <input
                value={teamId}
                onChange={e => setTeamId(e.target.value)}
                style={styles.input}
                placeholder="e.g., team-123"
              />
            </label>

            <label style={styles.label}>
              <div>Link Expiry (seconds)</div>
              <input
                type="number"
                value={ttlSeconds}
                onChange={e => setTtlSeconds(e.target.value)}
                style={styles.input}
                placeholder="3600"
              />
            </label>

            <button onClick={handleGenerateInvite} style={styles.buttonPrimary}>
              🔗 Generate Invite
            </button>

            {inviteUrl && (
              <div style={styles.inviteBox}>
                <div style={styles.inviteTitle}>📋 Your Invite Link</div>
                <div style={styles.inviteUrlText}>{inviteUrl}</div>
                <button onClick={copyToClipboard} style={{...styles.button, background: copied ? "#4CAF50" : "#2196F3"}}>
                  {copied ? "✓ Copied!" : "Copy Link"}
                </button>
              </div>
            )}
          </div>

          {/* Team Members */}
          <div style={styles.card}>
            <h2>👥 Team Members</h2>
            <button onClick={fetchMembers} style={styles.button}>
              🔄 Refresh
            </button>

            <div style={styles.membersList}>
              {members.length === 0 ? (
                <div style={styles.emptyState}>
                  <p>No members yet</p>
                  <p style={styles.smallText}>Share the invite link to add members</p>
                </div>
              ) : (
                members.map((member, i) => (
                  <div key={i} style={styles.memberItem}>
                    <span style={styles.memberIcon}>{(i + 1).toString().padStart(2, "0")}</span>
                    <span style={styles.memberAddress}>{member.slice(0, 6)}...{member.slice(-4)}</span>
                  </div>
                ))
              )}
            </div>

            <div style={styles.statsBox}>
              <div><strong>Total Members:</strong> {members.length}</div>
              <div><strong>Team ID:</strong> {teamId}</div>
            </div>
          </div>
        </div>
      )}

      {/* Tasks Tab */}
      {activeTab === "tasks" && (
        <div style={styles.grid}>
          {/* Create Task */}
          <div style={styles.card}>
            <h2>➕ Create New Task</h2>

            {!taskFormOpen ? (
              <button onClick={() => setTaskFormOpen(true)} style={styles.buttonPrimary}>
                + Create Task
              </button>
            ) : (
              <div style={styles.form}>
                <label style={styles.label}>
                  <div>Task Title</div>
                  <input
                    value={taskForm.title}
                    onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
                    placeholder="e.g., Review Smart Contract"
                    style={styles.input}
                  />
                </label>

                <label style={styles.label}>
                  <div>Description</div>
                  <textarea
                    value={taskForm.description}
                    onChange={e => setTaskForm({ ...taskForm, description: e.target.value })}
                    placeholder="Detailed task description..."
                    style={{ ...styles.input, minHeight: "80px", resize: "none" }}
                  />
                </label>

                <label style={styles.label}>
                  <div>Priority Level</div>
                  <select
                    value={taskForm.priority}
                    onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}
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
                    value={taskForm.deadline}
                    onChange={e => setTaskForm({ ...taskForm, deadline: e.target.value })}
                    style={styles.input}
                  />
                </label>

                <label style={styles.label}>
                  <div>Reward (optional)</div>
                  <input
                    value={taskForm.reward}
                    onChange={e => setTaskForm({ ...taskForm, reward: e.target.value })}
                    placeholder="e.g., 100 USDC"
                    style={styles.input}
                  />
                </label>

                <div style={styles.formButtons}>
                  <button onClick={handleCreateTask} style={styles.buttonConfirm}>
                    ✓ Create
                  </button>
                  <button
                    onClick={() => setTaskFormOpen(false)}
                    style={{ ...styles.button, background: "#999" }}
                  >
                    ✕ Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Task List */}
          <div style={styles.card}>
            <h2>📌 Team Tasks</h2>

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
      )}
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
  connectBtn: {
    display: "block",
    margin: "0 auto 20px",
    padding: "12px 24px",
    background: "#4CAF50",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "bold",
  },
  status: {
    padding: "12px 16px",
    borderRadius: "8px",
    marginBottom: "20px",
    maxWidth: "900px",
    margin: "0 auto 20px",
    textAlign: "center" as const,
  },
  tabs: {
    display: "flex",
    gap: "20px",
    maxWidth: "900px",
    margin: "0 auto 30px",
    borderBottom: "2px solid rgba(255, 255, 255, 0.2)",
    paddingBottom: "0",
  },
  tab: {
    background: "transparent",
    color: "white",
    border: "none",
    padding: "12px 20px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "bold",
    opacity: 0.7,
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
    marginBottom: "16px",
  },
  button: {
    width: "100%",
    padding: "10px 16px",
    background: "#2196F3",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "14px",
    cursor: "pointer",
    marginBottom: "16px",
  },
  label: {
    display: "block",
    marginBottom: "16px",
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
  inviteBox: {
    background: "#f5f5f5",
    border: "2px solid #667eea",
    padding: "16px",
    borderRadius: "8px",
    marginTop: "16px",
  },
  inviteTitle: {
    fontWeight: "bold",
    marginBottom: "10px",
    color: "#333",
  },
  inviteUrlText: {
    background: "white",
    padding: "10px",
    borderRadius: "4px",
    wordBreak: "break-all" as const,
    fontSize: "12px",
    fontFamily: "monospace",
    marginBottom: "12px",
    color: "#666",
  },
  membersList: {
    marginTop: "20px",
    maxHeight: "300px",
    overflowY: "auto" as const,
  },
  memberItem: {
    display: "flex",
    alignItems: "center",
    padding: "12px",
    background: "#f9f9f9",
    borderRadius: "6px",
    marginBottom: "8px",
  },
  memberIcon: {
    fontSize: "16px",
    fontWeight: "bold",
    marginRight: "12px",
    background: "#667eea",
    color: "white",
    width: "32px",
    height: "32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
  },
  memberAddress: {
    fontFamily: "monospace",
    color: "#333",
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
  buttonConfirm: {
    flex: 1,
    padding: "10px 16px",
    background: "#4CAF50",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "bold",
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


