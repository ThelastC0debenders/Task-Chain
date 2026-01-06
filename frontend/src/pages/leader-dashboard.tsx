import { useState, useEffect } from "react"
import axios from "axios"
import { connectWallet } from "../services/wallet"
import { createTaskOnChain } from "../services/contract"
import {
  // Wallet, // Removed unused

  PlusCircle,
  Users,
  Plus,
  Folder,
  Clock,
  List,
  RefreshCw,
  Link as LinkIcon,
  Settings,
  Copy,
  Check,
  Shield,
  Rocket,
  MessageSquare,
  Layout,
  Calendar,
  Video,
  Monitor,

  FileText,
  Activity,
  BarChart2
} from "lucide-react"
import Navbar from "../components/Navbar"
import LeaderReports from "./leader-reports"

const API = "/api"

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
  const [activeTab, setActiveTab] = useState<"tasks" | "invite" | "apps" | "reports">("tasks") // Default to tasks to match image

  // Task Form State
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    priority: "1",
    deadline: "",
    reward: "",
  })

  useEffect(() => {
    // Initial load
    checkWallet()
  }, [])

  useEffect(() => {
    if (activeTab === "tasks") {
      fetchTasks()
    } else if (activeTab === "invite") {
      fetchMembers()
    } else if (activeTab === "reports") {
      // Logic for reports load if needed
    }
  }, [activeTab, teamId])

  async function checkWallet() {
    // Check if already connected (mock check/restore if lib supports, otherwise wait for user)
    // For now purely relying on explicit connect unless stored
  }

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
      const token = res.data.token
      const origin = window.location.origin // e.g., https://xyz.lhr.life or http://localhost:5173
      const dynamicUrl = `${origin}/invite?token=${encodeURIComponent(token)}`

      setInviteUrl(dynamicUrl)
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
      setStatus(`✅ Task #${taskId} created on blockchain!`)
      await fetchTasks()
    } catch (err: any) {
      setStatus("❌ " + (err.response?.data?.error || err.message))
    }
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // --- Helpers for styling ---
  const getPriorityColor = (priority: number) => {
    if (priority >= 8) return "#ff3333"; // Critical RED
    if (priority >= 5) return "#ff9900"; // High ORANGE
    return "#00ff88"; // Normal GREEN
  }

  const getPriorityLabel = (priority: number) => {
    if (priority >= 8) return "CRITICAL";
    if (priority >= 5) return "HIGH";
    return "NORMAL";
  }

  // Calculate stats
  const pendingTasks = tasks.filter(t => t.status === 'open').length;

  return (
    <div style={styles.container}>
      {/* Top Navigation Bar */}
      <Navbar
        title="Leader Dashboard"
        subtitle="PROTOCOL CONSOLE"
        isConnected={!!address}
        address={address}
        onConnect={connectAndLoad}
      />

      {/* Sub Header / Status Bar */}
      <div style={styles.statusBar}>
        <div style={styles.statusLeft}>
          <div style={{ ...styles.statusDot, background: address ? "#00ff88" : "#ff3333" }}></div>
          <span style={styles.statusText}>{address ? "CONNECTED" : "DISCONNECTED"}</span>
          <span style={styles.divider}>|</span>
          <span style={styles.sessionText}>Session Hash:</span>
          <span style={styles.hashTag}>0x9f...2b1a</span>
        </div>
        <div>
          {status && <span style={styles.statusMessage}>{status}</span>}
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.main}>

        {/* Tab Navigation */}
        <div style={styles.tabNav}>
          <button
            onClick={() => setActiveTab("tasks")}
            style={styles.tabBtn(activeTab === "tasks")}
          >
            <PlusCircle size={16} /> Task Creation
          </button>
          <button
            onClick={() => setActiveTab("invite")}
            style={styles.tabBtn(activeTab === "invite")}
          >
            <Users size={16} /> Team Invites
          </button>
          <button
            onClick={() => setActiveTab("reports")}
            style={styles.tabBtn(activeTab === "reports")}
          >
            <BarChart2 size={16} /> Reports & Analytics
          </button>
          <button
            onClick={() => setActiveTab("apps")}
            style={styles.tabBtn(activeTab === "apps")}
          >
            <Layout size={16} /> Productivity Apps
          </button>
        </div>

        {/* Section Title */}
        <div style={styles.sectionHeader}>
          <div style={styles.sectionTitleBorder}></div>
          <h2 style={styles.sectionTitle}>
            {activeTab === "tasks" ? "Task Creation" : activeTab === "invite" ? "Team Invites" : activeTab === "reports" ? "Insights & Metrics" : "Workspace Apps"}
          </h2>
          <div style={styles.protocolText}>PROTOCOL V2.1 // ACTIVE</div>
        </div>

        {activeTab === "reports" && <LeaderReports teamId={teamId} />}

        {activeTab === "tasks" && (
          <div style={styles.contentGrid(activeTab)}>

            {/* Left Column: Create Task Form */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>
                  <Plus size={20} style={styles.plusIcon} /> Create Task
                </h3>
                <span style={styles.onChainBadge}>ON-CHAIN</span>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>TASK TITLE</label>
                <input
                  style={styles.input}
                  placeholder="e.g. Audit Smart Contract v2"
                  value={taskForm.title}
                  onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>TASK DESCRIPTION</label>
                <textarea
                  style={styles.textarea}
                  placeholder="Provide detailed specifications..."
                  value={taskForm.description}
                  onChange={e => setTaskForm({ ...taskForm, description: e.target.value })}
                ></textarea>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>DEADLINE</label>
                <input
                  type="datetime-local"
                  style={styles.input}
                  value={taskForm.deadline}
                  onChange={e => setTaskForm({ ...taskForm, deadline: e.target.value })}
                />
              </div>

              <div style={styles.row}>
                <div style={styles.formGroupHalf}>
                  <label style={styles.label}>PRIORITY</label>
                  <select
                    style={styles.select}
                    value={taskForm.priority}
                    onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}
                  >
                    <option value="1">Normal (0-100)</option>
                    <option value="5">High (101-200)</option>
                    <option value="9">Critical (200+)</option>
                  </select>
                </div>
                <div style={styles.formGroupHalf}>
                  <label style={styles.label}>REWARD</label>
                  <div style={styles.inputWithUnit}>
                    <input
                      style={styles.inputNoBorder}
                      placeholder="0.0"
                      value={taskForm.reward}
                      onChange={e => setTaskForm({ ...taskForm, reward: e.target.value })}
                    />
                    <span style={styles.unit}>ETH</span>
                  </div>
                </div>
              </div>

              <button style={styles.createChainBtn} onClick={handleCreateTask}>
                <Rocket size={16} style={{ marginRight: 8 }} /> CREATE TASK (ON-CHAIN)
              </button>
              <div style={styles.secureText}>🔒 Transaction requires wallet signature</div>
            </div>

            {/* Right Column: Stats & Registry */}
            <div style={styles.rightCol}>

              {/* Stats Row */}
              <div style={styles.statsRow}>
                <div style={styles.statCard}>
                  <div style={styles.statLabel}>TOTAL TASKS</div>
                  <div style={styles.statValue}>
                    {tasks.length}
                    <span style={styles.statSub}>+2 new</span>
                  </div>
                  <div style={styles.iconPos}>
                    <Folder size={24} style={{ opacity: 0.2 }} />
                  </div>
                </div>
                <div style={styles.statCard}>
                  <div style={styles.statLabel}>PENDING</div>
                  <div style={styles.statValue}>
                    {pendingTasks}
                    <span style={styles.statSubWarn}>Action req.</span>
                  </div>
                  <div style={styles.iconPos}>
                    <Clock size={24} style={{ opacity: 0.2 }} />
                  </div>
                </div>
              </div>

              {/* Task Registry */}
              <div style={styles.registryCard}>
                <div style={styles.registryHeader}>
                  <h3 style={styles.cardTitle}>
                    <List size={20} style={styles.listIcon} /> Task Registry
                  </h3>
                  <div style={styles.registryActions}>
                    <button onClick={fetchTasks} style={styles.iconBtn}><RefreshCw size={16} /></button>
                  </div>
                </div>

                <div style={styles.tableHeader}>
                  <div style={{ flex: 2 }}>TASK DETAILS</div>
                  <div style={{ flex: 1 }}>PRIORITY</div>
                  <div style={{ flex: 1 }}>STATUS</div>
                  <div style={{ flex: 1, textAlign: 'right' }}>REWARD</div>
                </div>

                <div style={styles.taskList}>
                  {tasks.length === 0 ? (
                    <div style={styles.emptyState}>No tasks registered. Create one to begin.</div>
                  ) : (
                    tasks.map((task) => (
                      <div key={task.id} style={styles.taskItem}>
                        <div style={styles.taskItemMain}>
                          <div style={styles.taskItemTitle}>{task.title}</div>
                          <div style={styles.taskItemMeta}>🕒 {new Date(task.deadline).toLocaleDateString()} remaining</div>
                        </div>
                        <div style={styles.taskItemPriority}>
                          <span style={{
                            ...styles.priorityBadge,
                            color: getPriorityColor(task.priority),
                            borderColor: getPriorityColor(task.priority) + '44',
                            background: getPriorityColor(task.priority) + '11'
                          }}>
                            {getPriorityLabel(task.priority)}
                          </span>
                        </div>
                        <div style={styles.taskItemStatus}>
                          <span style={styles.statusPill}>
                            <span style={{ ...styles.statusDotSmall, background: task.status === 'completed' ? '#00ff88' : '#2196F3' }}></span>
                            {task.status.toUpperCase()}
                          </span>
                        </div>
                        <div style={styles.taskItemReward}>
                          <span style={styles.rewardValue}>{task.reward || "0.0"}</span>
                          <span style={styles.unitSmall}>ETH</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Invite Tab UI */}
        {activeTab === "invite" && (
          <div style={styles.contentGrid(activeTab)}>
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>
                  <LinkIcon size={20} style={styles.linkIcon} /> Invite Management
                </h3>
                <span style={styles.securedBadge}>SECURED</span>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>TEAM ID</label>
                <div style={styles.inputIconWrapper}>
                  <span style={styles.inputPrefix}>#</span>
                  <input
                    style={styles.inputWithPrefix}
                    value={teamId}
                    onChange={e => setTeamId(e.target.value)}
                    placeholder="team-123"
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>INVITE TTL (SECONDS)</label>
                <div style={styles.inputWithUnit}>
                  <input
                    style={styles.inputNoBorder}
                    value={ttlSeconds}
                    onChange={e => setTtlSeconds(e.target.value)}
                    placeholder="3600"
                  />
                  <span style={styles.unit}>SEC</span>
                </div>
              </div>

              <button style={styles.generateBtn} onClick={handleGenerateInvite}>
                <Settings size={16} style={{ marginRight: 8 }} /> GENERATE INVITE
              </button>

              {inviteUrl && (
                <div style={styles.inviteSection}>
                  <div style={styles.inviteHeader}>
                    <span style={styles.inviteLabel}>YOUR INVITE LINK</span>
                    <span style={styles.activeDot}>● Active</span>
                  </div>
                  <div style={styles.inviteBox}>
                    <div style={styles.inviteLink}>{inviteUrl}</div>
                    <button style={styles.copyBtn} onClick={copyToClipboard}>
                      {copied ? <Check size={14} color="#00ff88" /> : <Copy size={14} color="white" />}
                    </button>
                  </div>
                  {window.location.hostname === 'localhost' && (
                    <div style={{ marginTop: 10, padding: 10, background: 'rgba(255, 165, 0, 0.1)', border: '1px solid orange', borderRadius: 4, fontSize: 12, color: 'orange' }}>
                      ⚠️ You are on localhost. This link will not work for others.
                      <br /><strong>Open this dashboard using your SSH Public URL</strong> to generate a shareable link.
                    </div>
                  )}
                  <div style={styles.sigConfirmed}>🛡 Signature confirmed on-chain. <a href="#" style={styles.link}>View Transaction</a></div>
                </div>
              )}
            </div>

            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}><Users size={20} style={{ marginRight: 10 }} /> Team Members</h3>
                <button style={styles.refreshBtn} onClick={fetchMembers}><RefreshCw size={12} /> REFRESH</button>
              </div>

              <div style={styles.membersArea}>
                {members.length === 0 ? (
                  <div style={styles.noMembers}>
                    <div style={styles.peopleIcon}><Users size={40} style={{ opacity: 0.2 }} /></div>
                    <h3>No members yet</h3>
                    <p>Share the secure invite link to add members to your team protocol.</p>
                    <div style={styles.waitingBadge}>● Waiting for connection...</div>
                  </div>
                ) : (
                  <div style={styles.memberList}>
                    {members.map((m, i) => (
                      <div key={i} style={styles.memberRow}>
                        <div style={styles.memberAvatar}>{i + 1}</div>
                        <div style={styles.memberHash}>{m}</div>
                        <div style={styles.memberStatus}>ACTIVE</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={styles.footerRow}>
                <div style={styles.footerStat}>● TOTAL MEMBERS: <span style={{ color: 'white' }}>{members.length}</span></div>
                <div style={styles.footerStat}>TEAM ID: <span style={styles.teamIdBadge}>{teamId}</span></div>
              </div>
            </div>
          </div>
        )}

        {/* Apps Tab UI */}
        {activeTab === "apps" && (
          <div style={styles.appsGrid}>
            {[
              { title: "Team Chat", icon: <MessageSquare size={32} color="#00ff88" />, desc: "Real-time messaging channels", link: "/chat" },
              { title: "Team Health", icon: <Activity size={32} color="#ff3333" />, desc: "Burnout & Velocity Analytics", link: "/health" },
              { title: "Project Board", icon: <Layout size={32} color="#00d1ff" />, desc: "Kanban task management", link: `/board/default-${teamId}` },
              { title: "Calendar", icon: <Calendar size={32} color="#ff0088" />, desc: "Schedule and events", link: "/calendar" },
              { title: "Video Meet", icon: <Video size={32} color="#ff9900" />, desc: "Secure video conferencing", link: "/meet" },
              { title: "Team Wiki", icon: <FileText size={32} color="#aa00ff" />, desc: "Collaborative documentation", link: "/docs" },
              { title: "Jamboard", icon: <Monitor size={32} color="#ffff00" />, desc: "Visual brainstorming canvas", link: `/whiteboard/default-${teamId}` },
            ].map((app, i) => (
              <div
                key={i}
                style={styles.appCard}
                onClick={() => window.location.href = app.link}
              >
                <div style={styles.appIconBox}>{app.icon}</div>
                <h3 style={styles.appTitle}>{app.title}</h3>
                <p style={styles.appDesc}>{app.desc}</p>
                <button style={styles.launchBtn}>LAUNCH APP →</button>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Footer / Quick View */}
      <div style={styles.quickView}>
        <div style={styles.quickLabel}>QUICK TEAM VIEW</div>
        <div style={styles.linkSimple}>Manage Team Invites</div>
      </div>
      <div style={styles.bottomStats}>
        <div style={styles.bottomCard}>
          <div style={styles.bottomLabel}>My Role</div>
          <div style={styles.bottomValue}>Admin</div>
          <div style={styles.iconPos}>
            <Shield size={18} color="#333" />
          </div>
        </div>
        <div style={styles.bottomCard}>
          <div style={styles.bottomLabel}>Team Members</div>
          <div style={styles.bottomValue}>{members.length || "0"} Active</div>
          <div style={styles.membersIcons}>
            {/* Mock circles */}
            <div style={styles.circle}></div>
            <div style={styles.circle}></div>
          </div>
        </div>
      </div>

    </div >
  )
}

// --- Styles ---
const styles: any = {
  container: {
    minHeight: "100vh",
    background: "var(--bg-primary)",
    color: "var(--text-primary)",
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    display: "flex",
    flexDirection: "column",
    transition: "background 0.3s, color 0.3s"
  },
  header: {
    height: "70px",
    borderBottom: "1px solid var(--border-color)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 30px",
    background: "var(--bg-secondary)",
  },
  logoArea: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  logoIcon: {
    width: "32px",
    height: "32px",
    background: "rgba(0, 255, 136, 0.1)",
    borderRadius: "6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: "18px",
    fontWeight: "800",
    color: "var(--text-primary)",
    margin: 0,
    lineHeight: 1,
  },
  subtitle: {
    fontSize: "10px",
    color: "var(--accent-primary)",
    margin: 0,
    letterSpacing: "1px",
    opacity: 0.8,
  },
  headerTitle: {
    position: "absolute",
    left: "50%",
    transform: "translateX(-50%)",
    color: "var(--text-primary)",
    fontSize: "14px",
    fontWeight: "600",
  },
  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
  },
  betaBadge: {
    background: "rgba(0, 255, 136, 0.1)",
    color: "var(--accent-primary)",
    fontSize: "12px",
    padding: "4px 10px",
    borderRadius: "20px",
    border: "1px solid rgba(0, 255, 136, 0.2)",
  },
  walletBadge: {
    background: "var(--bg-tertiary)",
    border: "1px solid var(--border-color)",
    padding: "6px 12px",
    borderRadius: "6px",
    fontSize: "13px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "var(--text-secondary)",
  },
  walletIcon: {
    fontSize: "14px",
  },
  connectedText: {
    background: "var(--bg-secondary)",
    padding: "2px 6px",
    borderRadius: "4px",
    fontSize: "10px",
    color: "var(--text-tertiary)",
  },
  connectBtnSmall: {
    background: "var(--accent-primary)",
    color: "var(--text-on-accent)",
    border: "none",
    padding: "6px 14px",
    borderRadius: "4px",
    fontWeight: "bold",
    fontSize: "12px",
    cursor: "pointer",
  },

  statusBar: {
    height: "40px",
    background: "var(--bg-tertiary)",
    borderBottom: "1px solid var(--border-color)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 30px",
    fontSize: "12px",
  },
  statusLeft: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  statusDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    boxShadow: "0 0 5px currentColor",
  },
  statusText: {
    color: "var(--accent-primary)",
    fontWeight: "bold",
    letterSpacing: "0.5px",
  },
  divider: { color: "var(--border-color)" },
  sessionText: { color: "var(--text-secondary)" },
  hashTag: {
    background: "var(--bg-secondary)",
    padding: "2px 6px",
    borderRadius: "4px",
    border: "1px solid var(--border-color)",
    fontFamily: "monospace",
    color: "var(--text-tertiary)"
  },
  statusMessage: {
    color: "var(--accent-primary)",
  },

  main: {
    flex: 1,
    padding: "40px 30px", // Match header padding horizontally
    // maxWidth removed to fill screen
    margin: "0 auto",
    width: "100%",
    boxSizing: "border-box",
  },

  tabNav: {
    display: "flex",
    gap: "15px",
    marginBottom: "30px",
  },
  tabBtn: (active: boolean) => ({
    background: active ? "rgba(0, 255, 136, 0.1)" : "transparent",
    border: active ? "1px solid var(--accent-primary)" : "1px solid var(--border-color)",
    color: active ? "var(--accent-primary)" : "var(--text-secondary)",
    padding: "10px 20px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    transition: "all 0.2s",
  }),
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    marginBottom: "25px",
    position: "relative",
  },
  sectionTitleBorder: {
    width: "4px",
    height: "24px",
    background: "var(--accent-primary)",
    marginRight: "12px",
    boxShadow: "0 0 8px var(--accent-primary)",
  },
  sectionTitle: {
    fontSize: "24px",
    color: "var(--text-primary)",
    margin: 0,
    fontWeight: "700",
  },
  protocolText: {
    marginLeft: "auto",
    color: "var(--text-tertiary)",
    fontSize: "12px",
    letterSpacing: "1px",
    textTransform: "uppercase",
  },

  contentGrid: (activeTab: string) => ({
    display: "grid",
    gridTemplateColumns: activeTab === 'invite' ? "1fr 1fr" : "1fr 1.5fr",
    gap: "24px",
    alignItems: "start",
    width: "100%", // Force full width
  }),
  appsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "24px",
    width: "100%",
  },
  appCard: {
    background: "var(--bg-secondary)",
    border: "1px solid var(--border-color)",
    borderRadius: "12px",
    padding: "30px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    cursor: "pointer",
    transition: "transform 0.2s, border-color 0.2s",
    minHeight: "220px",
  },
  appIconBox: {
    width: "60px",
    height: "60px",
    borderRadius: "12px",
    background: "var(--bg-tertiary)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "20px",
  },
  appTitle: {
    margin: "0 0 10px 0",
    color: "var(--text-primary)",
    fontSize: "18px",
    fontWeight: "bold",
  },
  appDesc: {
    margin: "0 0 20px 0",
    color: "var(--text-secondary)",
    fontSize: "13px",
    lineHeight: "1.4",
  },
  launchBtn: {
    marginTop: "auto",
    background: "transparent",
    border: "1px solid var(--border-color)",
    color: "var(--accent-primary)",
    padding: "8px 16px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  card: {
    background: "var(--bg-secondary)",
    border: "1px solid var(--border-color)",
    borderRadius: "12px",
    padding: "24px",
    position: "relative",
    width: "100%",
    boxSizing: "border-box",
    minWidth: 0,
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "25px",
  },
  cardTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "var(--text-primary)",
    margin: 0,
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  plusIcon: { color: "var(--accent-primary)" },
  onChainBadge: {
    fontSize: "10px",
    background: "var(--bg-tertiary)",
    border: "1px solid var(--border-color)",
    padding: "4px 8px",
    borderRadius: "4px",
    color: "var(--text-secondary)",
  },

  formGroup: { marginBottom: "20px" },
  formGroupHalf: { marginBottom: "20px", flex: 1 },
  label: {
    display: "block",
    color: "var(--text-tertiary)",
    fontSize: "11px",
    fontWeight: "bold",
    marginBottom: "8px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  input: {
    width: "100%",
    background: "var(--bg-tertiary)",
    border: "1px solid var(--border-color)",
    padding: "12px",
    color: "var(--text-primary)",
    borderRadius: "6px",
    fontSize: "14px",
    fontFamily: "inherit",
    boxSizing: "border-box",
  },
  textarea: {
    width: "100%",
    background: "var(--bg-tertiary)",
    border: "1px solid var(--border-color)",
    padding: "12px",
    color: "var(--text-primary)",
    borderRadius: "6px",
    fontSize: "14px",
    fontFamily: "inherit",
    minHeight: "100px",
    resize: "vertical",
    boxSizing: "border-box",
  },
  row: { display: "flex", gap: "20px" },
  select: {
    width: "100%",
    background: "var(--bg-tertiary)",
    border: "1px solid var(--border-color)",
    padding: "12px",
    color: "var(--text-primary)",
    borderRadius: "6px",
    fontSize: "14px",
    fontFamily: "inherit",
    boxSizing: "border-box",
    appearance: "none",
  },
  inputWithUnit: {
    background: "var(--bg-tertiary)",
    border: "1px solid var(--border-color)",
    borderRadius: "6px",
    display: "flex",
    alignItems: "center",
    paddingRight: "12px",
  },
  inputNoBorder: {
    flex: 1,
    background: "transparent",
    border: "none",
    padding: "12px",
    color: "var(--text-primary)",
    fontSize: "14px",
    fontFamily: "inherit",
    outline: "none",
  },
  unit: { color: "var(--text-secondary)", fontSize: "12px", fontWeight: "bold" },

  createChainBtn: {
    width: "100%",
    background: "var(--accent-primary)",
    color: "var(--text-on-accent)",
    border: "none",
    padding: "15px",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: "800",
    cursor: "pointer",
    boxShadow: "0 0 20px rgba(0,255,136,0.2)",
    marginBottom: "15px",
    textTransform: "uppercase",
  },
  secureText: {
    textAlign: "center",
    color: "var(--text-tertiary)",
    fontSize: "11px",
  },

  rightCol: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  statsRow: {
    display: "flex",
    gap: "20px",
  },
  statCard: {
    flex: 1,
    background: "var(--bg-secondary)",
    border: "1px solid var(--border-color)",
    borderRadius: "12px",
    padding: "20px",
    position: "relative",
    overflow: "hidden",
  },
  statLabel: {
    color: "var(--text-tertiary)",
    fontSize: "11px",
    fontWeight: "bold",
    letterSpacing: "0.5px",
    marginBottom: "10px",
  },
  statValue: {
    fontSize: "32px",
    fontWeight: "700",
    color: "var(--text-primary)",
    display: "flex",
    alignItems: "baseline",
    gap: "10px",
  },
  statSub: { fontSize: "12px", color: "var(--accent-primary)" },
  statSubWarn: { fontSize: "12px", color: "#ff9900" },
  iconPos: { position: "absolute", top: "20px", right: "20px" },

  registryCard: {
    flex: 1,
    background: "var(--bg-secondary)",
    border: "1px solid var(--border-color)",
    borderRadius: "12px",
    display: "flex",
    flexDirection: "column",
  },
  registryHeader: {
    padding: "20px",
    borderBottom: "1px solid var(--border-color)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  listIcon: { color: "var(--accent-primary)", marginRight: "10px" },
  registryActions: { display: "flex", gap: "10px" },
  iconBtn: { background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", fontSize: "16px" },

  tableHeader: {
    display: "flex",
    padding: "15px 20px",
    background: "var(--bg-tertiary)",
    color: "var(--text-secondary)",
    fontSize: "10px",
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  taskList: {
    padding: "10px",
    flex: 1,
    overflowY: "auto",
    maxHeight: "400px",
  },
  taskItem: {
    background: "var(--bg-tertiary)",
    border: "1px solid var(--border-color)",
    borderRadius: "8px",
    padding: "15px",
    marginBottom: "10px",
    display: "flex",
    alignItems: "center",
    transition: "border-color 0.2s",
    cursor: "pointer",
  },
  taskItemMain: { flex: 2 },
  taskItemTitle: { color: "var(--text-primary)", fontSize: "14px", fontWeight: "600", marginBottom: "4px" },
  taskItemMeta: { color: "var(--text-secondary)", fontSize: "11px" },
  taskItemPriority: { flex: 1 },
  priorityBadge: {
    fontSize: "10px",
    padding: "3px 8px",
    borderRadius: "4px",
    border: "1px solid",
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  taskItemStatus: { flex: 1 },
  statusPill: {
    background: "var(--bg-primary)",
    border: "1px solid var(--border-color)",
    padding: "4px 8px",
    borderRadius: "20px",
    fontSize: "10px",
    color: "var(--text-secondary)",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
  },
  statusDotSmall: { width: "6px", height: "6px", borderRadius: "50%" },
  taskItemReward: { flex: 1, textAlign: "right" },
  rewardValue: { color: "var(--text-primary)", fontWeight: "bold", fontSize: "14px" },
  unitSmall: { color: "var(--text-secondary)", fontSize: "10px", marginLeft: "4px" },
  emptyState: { padding: "40px", textAlign: "center", color: "var(--text-tertiary)", fontStyle: "italic" },

  // Invite Tab Specific
  linkIcon: { color: "var(--accent-primary)", marginRight: "10px" },
  securedBadge: { fontSize: "10px", border: "1px solid var(--border-color)", padding: "2px 6px", textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-secondary)" },
  inputIconWrapper: {
    display: "flex",
    background: "var(--bg-tertiary)",
    border: "1px solid var(--border-color)",
    borderRadius: "6px",
    alignItems: "center",
  },
  inputPrefix: { padding: "0 12px", color: "var(--text-secondary)" },
  inputWithPrefix: {
    flex: 1,
    background: "transparent",
    border: "none",
    padding: "12px 0",
    color: "var(--text-primary)",
    fontSize: "14px",
    fontFamily: "inherit",
    outline: "none",
  },
  generateBtn: {
    width: "100%",
    background: "var(--accent-primary)",
    color: "var(--text-on-accent)",
    border: "none",
    padding: "15px",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: "800",
    cursor: "pointer",
    boxShadow: "0 0 20px rgba(0,255,136,0.2)",
    marginBottom: "25px",
    textTransform: "uppercase",
  },
  inviteSection: {
    borderTop: "1px solid var(--border-color)",
    paddingTop: "20px",
  },
  inviteHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "10px",
  },
  inviteLabel: { color: "var(--accent-primary)", fontSize: "11px", fontWeight: "bold" },
  activeDot: { color: "var(--accent-primary)", fontSize: "10px", background: "rgba(0,255,136,0.1)", padding: "2px 6px", borderRadius: "10px" },
  inviteBox: {
    background: "var(--bg-tertiary)",
    border: "1px solid var(--border-color)",
    borderRadius: "6px",
    padding: "8px",
    display: "flex",
    alignItems: "center",
    marginBottom: "10px",
    width: "100%",
    boxSizing: "border-box",
  },
  inviteLink: {
    flex: 1,
    padding: "0 12px",
    color: "var(--text-secondary)",
    fontSize: "12px",
    fontFamily: "monospace",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    minWidth: 0,
    maxWidth: "400px", // Explicit constraint
  },
  copyBtn: { background: "var(--bg-secondary)", border: "1px solid var(--border-color)", color: "var(--text-primary)", padding: "8px 12px", borderRadius: "4px", cursor: "pointer" },
  sigConfirmed: { fontSize: "10px", color: "var(--text-tertiary)", display: "flex", alignItems: "center", gap: "6px" },
  link: { color: "var(--accent-primary)", textDecoration: "none" },

  refreshBtn: { background: "none", border: "none", color: "var(--text-secondary)", fontSize: "10px", cursor: "pointer", textTransform: "uppercase" },
  membersArea: { flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", minHeight: "300px" },
  noMembers: { textAlign: "center", color: "var(--text-tertiary)" },
  peopleIcon: { fontSize: "40px", marginBottom: "15px", opacity: 0.2 },
  waitingBadge: { display: "inline-block", marginTop: "20px", background: "rgba(0,255,136,0.05)", color: "var(--accent-primary)", padding: "6px 14px", borderRadius: "20px", fontSize: "12px", border: "1px solid rgba(0, 255, 136, 0.2)" },

  memberList: { width: "100%" },
  memberRow: { display: "flex", alignItems: "center", padding: "12px", borderBottom: "1px solid var(--border-color)", gap: "15px" },
  memberAvatar: { width: "24px", height: "24px", background: "var(--bg-tertiary)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", color: "var(--text-secondary)" },
  memberHash: { flex: 1, fontFamily: "monospace", fontSize: "13px", color: "var(--text-secondary)" },
  memberStatus: { fontSize: "10px", color: "var(--accent-primary)", border: "1px solid rgba(0, 255, 136, 0.2)", padding: "2px 6px", borderRadius: "4px" },

  footerRow: {
    borderTop: "1px solid var(--border-color)",
    paddingTop: "20px",
    display: "flex",
    justifyContent: "space-between",
    fontSize: "11px",
    color: "var(--text-tertiary)",
    textTransform: "uppercase",
  },
  teamIdBadge: { background: "var(--bg-secondary)", padding: "2px 6px", borderRadius: "4px", color: "var(--text-primary)" },

  quickView: { padding: "0 60px", marginBottom: "15px", display: "flex", justifyContent: "space-between" },
  quickLabel: { fontSize: "10px", color: "var(--text-tertiary)", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "1px" },
  linkSimple: { fontSize: "10px", color: "var(--accent-primary)", cursor: "pointer", textDecoration: "underline" },
  bottomStats: { padding: "0 60px 40px", display: "flex", gap: "20px" },
  bottomCard: { background: "var(--bg-secondary)", padding: "15px 20px", borderRadius: "8px", minWidth: "200px", border: "1px solid var(--border-color)", display: "flex", flexDirection: "column", position: "relative" },
  bottomLabel: { fontSize: "10px", color: "var(--text-secondary)", marginBottom: "4px" },
  bottomValue: { fontSize: "14px", color: "var(--text-primary)", fontWeight: "bold" },

  membersIcons: { position: "absolute", right: "20px", top: "50%", transform: "translateY(-50%)", display: "flex" },
  circle: { width: "20px", height: "20px", background: "var(--bg-tertiary)", borderRadius: "50%", marginLeft: "-8px", border: "2px solid var(--bg-secondary)" },
}
