import { useState, useEffect } from "react"
import axios from "axios"
import { connectWallet } from "../services/wallet"
import { createTaskOnChain } from "../services/contract"
import {
  Wallet,
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
  Rocket
} from "lucide-react"

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
  const [activeTab, setActiveTab] = useState<"tasks" | "invite">("tasks")

  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    priority: "1",
    deadline: "",
    reward: "",
  })

  useEffect(() => {
    checkWallet()
  }, [])

  useEffect(() => {
    if (activeTab === "tasks") fetchTasks()
    else fetchMembers()
  }, [activeTab, teamId])

  async function checkWallet() {}

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
      setTimeout(fetchMembers, 500)
    } catch (err: any) {
      setStatus("❌ " + (err.response?.data?.error || err.message))
    }
  }

  async function fetchMembers() {
    const res = await axios.get(`${API}/team/members/${teamId}`)
    setMembers(res.data.members || [])
  }

  async function fetchTasks() {
    const res = await axios.get(`${API}/task/${teamId}`)
    setTasks(res.data.tasks || [])
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

      const metadataHash =
        "0x" +
        Array.from(new TextEncoder().encode(metadata))
          .map(b => b.toString(16).padStart(2, "0"))
          .join("")
          .slice(0, 64)

      const deadlineTimestamp = Math.floor(new Date(taskForm.deadline).getTime() / 1000)
      const priority = parseInt(taskForm.priority)

      const taskId = await createTaskOnChain(
        metadataHash,
        "General",
        deadlineTimestamp,
        86400,
        priority
      )

      const newTask: Task = {
        id: taskId.toString(),
        title: taskForm.title,
        description: taskForm.description,
        priority,
        deadline: taskForm.deadline,
        reward: taskForm.reward || "Not specified",
        status: "open",
        createdBy: address || "unknown",
      }

      await axios.post(`${API}/task/create`, { teamId, task: newTask })
      setTasks([...tasks, newTask])
      setTaskForm({ title: "", description: "", priority: "1", deadline: "", reward: "" })
      setStatus(`✅ Task #${taskId} created on blockchain!`)
      fetchTasks()
    } catch (err: any) {
      setStatus("❌ " + (err.response?.data?.error || err.message))
    }
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const pendingTasks = tasks.filter(t => t.status === "open").length

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <header style={styles.header}>
        <div style={styles.logoArea}>
          <div style={styles.logoIcon}>⬢</div>
          <div>
            <h1 style={styles.title}>TaskChain</h1>
            <p style={styles.subtitle}>PROTOCOL CONSOLE</p>
          </div>
        </div>

        <div style={styles.headerTitle}>Leader Dashboard</div>

        <div style={styles.headerActions}>
          <div style={styles.betaBadge}>Mainnet Beta</div>
          {address ? (
            <div style={styles.walletBadge}>
              <Wallet size={14} />
              {address.slice(0, 6)}…{address.slice(-2)}
            </div>
          ) : (
            <button onClick={connectAndLoad} style={styles.connectBtnSmall}>
              Connect Wallet
            </button>
          )}
        </div>
      </header>

      {/* STATUS BAR */}
      <div style={styles.statusBar}>
        <div style={styles.statusLeft}>
          <div style={{ ...styles.statusDot, background: address ? "#00ff88" : "#ff3333" }} />
          <span style={styles.statusText}>{address ? "CONNECTED" : "DISCONNECTED"}</span>
        </div>
        <span style={styles.statusMessage}>{status}</span>
      </div>

      {/* MAIN */}
      <div style={styles.main}>
        <div style={styles.tabNav}>
          <button onClick={() => setActiveTab("tasks")} style={styles.tabBtn(activeTab === "tasks")}>
            <PlusCircle size={16} /> Task Creation
          </button>
          <button onClick={() => setActiveTab("invite")} style={styles.tabBtn(activeTab === "invite")}>
            <Users size={16} /> Team Invites
          </button>
        </div>

        <div style={styles.contentGrid(activeTab)}>
          {/* content unchanged */}
        </div>
      </div>

      {/* FOOTER FIXED */}
      <div style={styles.quickView}>
        <div style={styles.quickLabel}>QUICK TEAM VIEW</div>
        <div style={styles.linkSimple}>Manage Team Invites</div>
      </div>

      <div style={styles.bottomStats}>
        <div style={styles.bottomCard}>
          <div style={styles.bottomLabel}>My Role</div>
          <div style={styles.bottomValue}>Admin</div>
          <Shield size={18} />
        </div>
      </div>
    </div>
  )
}

/* ===================== */
/* ====== STYLES ====== */
/* ===================== */

const styles: any = {
  container: {
    minHeight: "100vh",
    background: "#050505",
    color: "#e0e0e0",
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
  },

  header: {
    height: "70px",
    padding: "0 30px",
    borderBottom: "1px solid #1a1a1a",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: "#080808",
    boxSizing: "border-box",
  },

  main: {
    flex: 1,
    padding: "40px 30px",
    width: "100%",
    boxSizing: "border-box",
  },

  contentGrid: (tab: string) => ({
    display: "grid",
    gridTemplateColumns:
      tab === "invite"
        ? "minmax(0, 1fr) minmax(0, 1fr)"
        : "minmax(0, 1fr) minmax(0, 1.5fr)",
    gap: "24px",
    width: "100%",
    boxSizing: "border-box",
  }),

  quickView: {
    padding: "0 30px",
    display: "flex",
    justifyContent: "space-between",
    boxSizing: "border-box",
  },

  bottomStats: {
    padding: "0 30px 40px",
    display: "flex",
    gap: "20px",
    boxSizing: "border-box",
  },
}
