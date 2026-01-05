import { useEffect, useState } from "react"
import Editor from "@monaco-editor/react"
import axios from "axios"
import { connectWallet } from "../services/wallet"
import { claimTaskOnChain, completeTaskOnChain } from "../services/contract"
import confetti from "canvas-confetti"

const API = "http://localhost:5000"

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

interface WorkspaceFile {
  path: string
  permission: "editable" | "readonly" | "hidden"
  language: string
}

interface GitLog {
  type: "output" | "error" | "command"
  message: string
  timestamp: string
}

export default function MemberDashboard() {
  const [address, setAddress] = useState("")
  const [teamId, setTeamId] = useState("team-123")
  const [token, setToken] = useState<string>("")
  const [inviteStatus, setInviteStatus] = useState("")
  const [joinedTeam, setJoinedTeam] = useState("")
  const [activeTab, setActiveTab] = useState<"join" | "tasks">("join")
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState("all")
  const [tasks, setTasks] = useState<Task[]>([])
  const [claimedTasks, setClaimedTasks] = useState<string[]>([])

  const [workspaceTaskId, setWorkspaceTaskId] = useState("")
  const [workspaceClaimId, setWorkspaceClaimId] = useState("")
  const [workspaceClaims, setWorkspaceClaims] = useState<Record<string, string>>({})
  const [workspaceFiles, setWorkspaceFiles] = useState<WorkspaceFile[]>([])
  const [activeWorkspaceFile, setActiveWorkspaceFile] = useState("")
  const [workspaceFileContent, setWorkspaceFileContent] = useState("")

  const [gitLogs, setGitLogs] = useState<GitLog[]>([])
  const [gitCommand, setGitCommand] = useState("")
  const [commitMessage, setCommitMessage] = useState("")
  const [workspaceLoading, setWorkspaceLoading] = useState(false)
  const [workspaceError, setWorkspaceError] = useState("")

  // Collaboration State
  const [activeWorkers, setActiveWorkers] = useState<any[]>([])
  const [conflicts, setConflicts] = useState<string[]>([])
  const [diffContent, setDiffContent] = useState("")
  const [readiness, setReadiness] = useState<{ ready: boolean; reason?: string } | null>(null)

  const [auditLoading, setAuditLoading] = useState(false)
  const [auditResult, setAuditResult] = useState<{
    score: number
    summary: string
    issues: { severity: string; message: string; line: string }[]
  } | null>(null)

  // VS Code Layout State
  const [activeSidebar, setActiveSidebar] = useState<"explorer" | "scm" | "ai">("explorer")
  const [showDiff, setShowDiff] = useState(false)


  // Poll for active workers
  useEffect(() => {
    if (!teamId) return
    const interval = setInterval(async () => {
      try {
        const res = await axios.get(`${API}/task/${teamId}/active`)
        setActiveWorkers(res.data.active || [])
      } catch (err) { }
    }, 5000)
    return () => clearInterval(interval)
  }, [teamId])

  async function handleSync() {
    if (!workspaceTaskId || !workspaceClaimId) return
    try {
      setWorkspaceLoading(true)
      setWorkspaceError("")

      const res = await axios.post(`${API}/workspace/${workspaceTaskId}/${workspaceClaimId}/pull`)
      if (res.data.ok) {
        setWorkspaceError("Synced with remote")
        // Refresh files
        loadWorkspaceFiles(workspaceTaskId, workspaceClaimId)
        setTimeout(() => setWorkspaceError(""), 1500)
      } else {
        // Check for conflicts
        if (res.data.output && res.data.output.includes("conflict")) {
          const conflictRes = await axios.get(`${API}/workspace/${workspaceTaskId}/${workspaceClaimId}/conflicts`)
          setWorkspaceError("Merge conflicts detected!")
          setActiveSidebar("scm")
          // Show conflicts in SCM
          setConflicts(conflictRes.data.files || [])
        } else {
          setWorkspaceError("Sync failed: " + res.data.error)
        }
      }
    } catch (err: any) {
      setWorkspaceError("Error: " + err.message)
    } finally {
      setWorkspaceLoading(false)
    }
  }

  async function handlePush() {
    if (!workspaceTaskId || !workspaceClaimId) return
    try {
      setWorkspaceLoading(true)
      const res = await axios.post(`${API}/workspace/${workspaceTaskId}/${workspaceClaimId}/push`)
      if (res.data.ok) {
        setWorkspaceError("Pushed to remote")
        setTimeout(() => setWorkspaceError(""), 1500)
      } else {
        setWorkspaceError("Push failed: " + res.data.error)
      }
    } catch (err: any) {
      setWorkspaceError("Error: " + err.message)
    } finally {
      setWorkspaceLoading(false)
    }
  }

  async function loadDiff() {
    if (!workspaceTaskId || !workspaceClaimId) return
    try {
      const res = await axios.get(`${API}/workspace/${workspaceTaskId}/${workspaceClaimId}/diff`)
      setDiffContent(res.data.diff || "No changes")
    } catch (err: any) {
      setDiffContent("Error loading diff")
    }
  }

  async function loadReadiness() {
    if (!workspaceTaskId || !workspaceClaimId) return
    try {
      const res = await axios.get(`${API}/workspace/${workspaceTaskId}/${workspaceClaimId}/readiness`)
      setReadiness(res.data)
    } catch (err: any) { }
  }

  async function handleResolveConflict(file: string) {
    if (!workspaceTaskId || !workspaceClaimId) return
    try {
      await axios.post(`${API}/workspace/${workspaceTaskId}/${workspaceClaimId}/resolve`, { file })
      setConflicts(prev => prev.filter(f => f !== file))
      if (conflicts.length <= 1) {
        setWorkspaceError("All conflicts resolved. Commit now.")
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } })
      }
    } catch (err: any) {
      setWorkspaceError("Error resolving: " + err.message)
    }
  }

  async function handleRequestReview() {
    if (!workspaceTaskId) return
    try {
      await axios.patch(`${API}/task/${teamId}/${workspaceTaskId}`, { status: "review" })
      setTasks(tasks.map(t => t.id === workspaceTaskId ? { ...t, status: "review" } : t))
      setWorkspaceError("Review requested")
    } catch (err: any) {
      setWorkspaceError("Error: " + err.message)
    }
  }

  async function handleApproveReview() {
    if (!workspaceTaskId) return
    try {
      await axios.patch(`${API}/task/${teamId}/${workspaceTaskId}`, { status: "approved" })
      setTasks(tasks.map(t => t.id === workspaceTaskId ? { ...t, status: "approved" } : t))
      setWorkspaceError("Task approved")
    } catch (err: any) {
      setWorkspaceError("Error: " + err.message)
    }
  }

  async function handleAIAudit() {
    if (!workspaceTaskId || !workspaceClaimId) return
    try {
      setAuditLoading(true)
      setAuditResult(null)
      // Simulate "thinking" time for wow factor
      await new Promise(r => setTimeout(r, 1500))

      const res = await axios.post(`${API}/workspace/${workspaceTaskId}/${workspaceClaimId}/analyze`)
      setAuditResult(res.data.result)

      if (res.data.result.score > 90) {
        confetti({ particleCount: 80, spread: 100, origin: { y: 0.6 } })
      }
    } catch (err) {
      setWorkspaceError("AI Scan failed")
    } finally {
      setAuditLoading(false)
    }
  }


  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const tokenParam = params.get("token") || ""
    setToken(tokenParam)
    if (tokenParam) setActiveTab("join")

    // Auto-resume workspace if params exist
    const tId = params.get("taskId")
    const cId = params.get("claimId")
    if (tId && cId) {
      // Attempt to restore session
      ; (async () => {
        try {
          // We need wallet to be connected to interact, or at least to verify ownership? 
          // Ideally we just load the workspace. But startWorkspace requires address check.
          // Let's try to silently connect or just prompt since user is returning.
          const { address } = await connectWallet()
          setAddress(address)

          setWorkspaceTaskId(tId)
          setWorkspaceClaimId(cId)
          setWorkspaceClaims(prev => ({ ...prev, [tId]: cId }))
          await initializeWorkspace(tId, cId)
        } catch (err) {
          console.log("Could not auto-resume workspace:", err)
        }
      })()
    }
  }, [])

  async function connectWalletHandler() {
    try {
      setLoading(true)
      const { address } = await connectWallet()
      setAddress(address)
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
      setInviteStatus("Joined team")
    } catch (err: any) {
      setInviteStatus("Error: " + (err.response?.data?.error || err.message))
    } finally {
      setLoading(false)
    }
  }

  async function startWorkspace(taskId: string, claimId?: string) {
    if (!address) {
      alert("Please connect wallet first")
      return
    }
    const resolvedClaimId = claimId || workspaceClaims[taskId] || `claim-${Date.now()}-${address.slice(0, 6)}`

    // Persist to URL
    const url = new URL(window.location.href)
    url.searchParams.set("taskId", taskId)
    url.searchParams.set("claimId", resolvedClaimId)
    window.history.pushState({}, "", url.toString())

    setWorkspaceClaims(prev => ({ ...prev, [taskId]: resolvedClaimId }))
    setWorkspaceTaskId(taskId)
    setWorkspaceClaimId(resolvedClaimId)
    await initializeWorkspace(taskId, resolvedClaimId)
  }

  async function initializeWorkspace(taskId: string, claimId: string) {
    const repoUrl = "https://github.com/saaj376/taskchain.git"
    try {
      setWorkspaceLoading(true)
      setWorkspaceError("")

      try {
        await axios.post(`${API}/workspace/create`, {
          taskId,
          claimId,
          repoUrl,
          scope: [
            { path: "frontend", permission: "editable" },
            { path: "backend", permission: "editable" },
            { path: "contracts", permission: "editable" },
            { path: "README.md", permission: "readonly" },
            { path: "package.json", permission: "readonly" },
          ],
        })
      } catch (err: any) {
        const alreadyExists = err?.response?.status === 409
        if (!alreadyExists) throw err
      }

      await loadWorkspaceFiles(taskId, claimId)
    } catch (err: any) {
      setWorkspaceError("Error: " + (err.response?.data?.error || err.message))
    } finally {
      setWorkspaceLoading(false)
    }
  }

  async function loadWorkspaceFiles(taskId: string, claimId: string) {
    try {
      const res = await axios.get(`${API}/workspace/${taskId}/${claimId}/files`)
      setWorkspaceFiles(res.data.files)
      if (res.data.files.length > 0) {
        setActiveWorkspaceFile(res.data.files[0].path)
        await loadWorkspaceFile(res.data.files[0].path, taskId, claimId)
      }
    } catch (err: any) {
      setWorkspaceError("Error: " + (err.response?.data?.error || err.message))
    }
  }

  async function loadWorkspaceFile(filePath: string, taskId?: string, claimId?: string) {
    const targetTaskId = taskId || workspaceTaskId
    const targetClaimId = claimId || workspaceClaimId
    if (!targetTaskId || !targetClaimId) return

    try {
      const res = await axios.get(`${API}/workspace/${targetTaskId}/${targetClaimId}/file/${filePath}`)
      setWorkspaceFileContent(res.data.content)
      setActiveWorkspaceFile(filePath)
    } catch (err: any) {
      setWorkspaceError("Error: " + (err.response?.data?.error || err.message))
    }
  }

  async function saveWorkspaceFile() {
    if (!activeWorkspaceFile || !workspaceTaskId || !workspaceClaimId) return
    try {
      await axios.post(`${API}/workspace/${workspaceTaskId}/${workspaceClaimId}/file/${activeWorkspaceFile}`, {
        content: workspaceFileContent,
      })
      setWorkspaceError("Saved")
      setTimeout(() => setWorkspaceError(""), 1500)
    } catch (err: any) {
      setWorkspaceError("Error: " + (err.response?.data?.error || err.message))
    }
  }

  async function runWorkspaceGitCommand() {
    if (!gitCommand.trim() || !workspaceTaskId || !workspaceClaimId) return
    try {
      setGitLogs(prev => [
        ...prev,
        {
          type: "command",
          message: `$ git ${gitCommand}`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ])

      const res = await axios.post(`${API}/workspace/${workspaceTaskId}/${workspaceClaimId}/git`, {
        command: gitCommand,
      })

      if (res.data.ok) {
        setGitLogs(prev => [
          ...prev,
          {
            type: "output",
            message: res.data.output,
            timestamp: new Date().toLocaleTimeString(),
          },
        ])
      } else {
        setGitLogs(prev => [
          ...prev,
          {
            type: "error",
            message: res.data.error,
            timestamp: new Date().toLocaleTimeString(),
          },
        ])
      }

      setGitCommand("")
    } catch (err: any) {
      setGitLogs(prev => [
        ...prev,
        {
          type: "error",
          message: err.message,
          timestamp: new Date().toLocaleTimeString(),
        },
      ])
    }
  }

  async function commitWorkspaceChanges() {
    if (!commitMessage.trim() || !workspaceTaskId || !workspaceClaimId) {
      setWorkspaceError("Enter commit message")
      return
    }

    try {
      setWorkspaceLoading(true)
      const res = await axios.post(`${API}/workspace/${workspaceTaskId}/${workspaceClaimId}/commit`, {
        message: commitMessage,
        author: address,
      })

      if (res.data.ok) {
        setWorkspaceError("Changes committed")
        setCommitMessage("")
        setTimeout(() => setWorkspaceError(""), 2000)
      }
    } catch (err: any) {
      setWorkspaceError("Error: " + (err.response?.data?.error || err.message))
    } finally {
      setWorkspaceLoading(false)
    }
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
      const claimId = workspaceClaims[taskId] || `claim-${Date.now()}-${address.slice(0, 6)}`
      setWorkspaceClaims(prev => ({ ...prev, [taskId]: claimId }))
      await startWorkspace(taskId, claimId)
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
    if (filter === "claimed") return claimedTasks.includes(t.id)
    return true
  })

  const openCount = tasks.filter(t => t.status === "open").length
  const completedCount = tasks.filter(t => t.status === "completed").length

  const getPriorityColor = (priority: number) => {
    if (priority >= 8) return "linear-gradient(135deg, #ff6cab, #7366ff)"
    if (priority >= 5) return "linear-gradient(135deg, #f9d423, #ff4e50)"
    return "linear-gradient(135deg, #00f5a0, #00d9f5)"
  }

  const getPriorityLabel = (priority: number) => {
    if (priority >= 8) return "Critical"
    if (priority >= 5) return "High"
    return "Normal"
  }

  const isTaskClaimed = (taskId: string) => claimedTasks.includes(taskId)

  const currentWorkspaceFile = workspaceFiles.find(f => f.path === activeWorkspaceFile)
  const isWorkspaceReadOnly = currentWorkspaceFile?.permission === "readonly"

  return (
    <div style={styles.shell}>
      <style>{`
        @keyframes float { 0% { transform: translateY(0px) } 50% { transform: translateY(-12px) } 100% { transform: translateY(0px) } }
        @keyframes pulse { 0% { opacity: 0.8; transform: scale(1) } 50% { opacity: 1; transform: scale(1.04) } 100% { opacity: 0.8; transform: scale(1) } }
        @keyframes shimmer { 0% { background-position: 0% 50% } 100% { background-position: 200% 50% } }
      `}</style>
      <div style={styles.bgLayer}></div>
      <div style={{ ...styles.blob, ...styles.blobA }}></div>
      <div style={{ ...styles.blob, ...styles.blobB }}></div>
      <div style={{ ...styles.blob, ...styles.blobC }}></div>

      <div style={styles.container}>
        <header style={styles.hero}>
          <div>
            <div style={styles.eyebrow}>Hyper neon • On-chain delivery</div>
            <h1 style={styles.title}>Taskchain Member Console</h1>
            <p style={styles.lead}>
              Claim, build, and ship inside one neon cockpit. Live workspace with Monaco + Git, wired to your wallet.
            </p>
            <div style={styles.heroActions}>
              {!address ? (
                <button style={styles.ctaPrimary} onClick={connectWalletHandler} disabled={loading}>
                  {loading ? "Connecting..." : "Connect Wallet"}
                </button>
              ) : (
                <div style={styles.connectedPill}>
                  <span style={styles.pillDot} />
                  {address.slice(0, 6)}...{address.slice(-4)}
                </div>
              )}
              <button
                style={{ ...styles.ctaGhost, opacity: activeTab === "tasks" ? 1 : 0.8 }}
                onClick={() => setActiveTab("tasks")}
              >
                Jump to Tasks
              </button>
            </div>
          </div>
          <div style={styles.glassStat}>
            <div style={styles.statRow}>
              <div>
                <div style={styles.label}>Total Tasks</div>
                <div style={styles.metric}>{tasks.length}</div>
              </div>
              <div style={styles.pill}>Team {teamId}</div>
            </div>
            <div style={styles.statGrid}>
              <div>
                <div style={styles.label}>Open</div>
                <div style={{ ...styles.metricSmall, color: "#f9d423" }}>{openCount}</div>
              </div>
              <div>
                <div style={styles.label}>Claimed</div>
                <div style={{ ...styles.metricSmall, color: "#00f5a0" }}>{claimedTasks.length}</div>
              </div>
              <div>
                <div style={styles.label}>Completed</div>
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
            <div style={styles.progressLabel}>Velocity meter</div>
          </div>
        </header>

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
        </div>

        {activeTab === "join" && (
          <section style={styles.cardWide}>
            <div style={styles.sectionHead}>
              <div>
                <div style={styles.eyebrow}>Join</div>
                <h2 style={styles.sectionTitle}>Accept your invite</h2>
                <p style={styles.sectionLead}>Connect your wallet, snap into the crew, and start earning.</p>
              </div>
              {token && <div style={styles.tokenBadge}>{token.slice(0, 36)}...</div>}
            </div>

            <div style={styles.joinGrid}>
              <div style={styles.joinCard}>
                <div style={styles.infoRow}>
                  <span style={styles.label}>Status</span>
                  <span style={styles.pill}>{inviteStatus || "Pending"}</span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.label}>Wallet</span>
                  <span style={styles.value}>{address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Not connected"}</span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.label}>Team</span>
                  <span style={styles.value}>{joinedTeam || "Unassigned"}</span>
                </div>

                {!joinedTeam ? (
                  <div style={styles.actionRow}>
                    {!address ? (
                      <button onClick={connectWalletHandler} disabled={loading} style={styles.ctaPrimary}>
                        {loading ? "Connecting..." : "Connect Wallet"}
                      </button>
                    ) : (
                      <button onClick={handleJoinTeam} disabled={loading || !token} style={styles.ctaPrimary}>
                        {loading ? "Joining..." : "Accept Invite"}
                      </button>
                    )}
                  </div>
                ) : (
                  <div style={styles.successCard}>
                    <div style={styles.successTitle}>You are in.</div>
                    <div style={styles.value}>Team: {joinedTeam}</div>
                    {address && <div style={styles.value}>Wallet: {address.slice(0, 6)}...{address.slice(-4)}</div>}
                  </div>
                )}
              </div>

              <div style={styles.sideNote}>
                <h3 style={styles.sideTitle}>How it works</h3>
                <ul style={styles.list}>
                  <li>Connect wallet to verify and unlock workspace.</li>
                  <li>Accept invite token to join the squad.</li>
                  <li>Claim tasks, edit live, and commit from the dashboard.</li>
                </ul>
              </div>
            </div>
          </section>
        )}

        {activeTab === "tasks" && (
          <section style={styles.cardWide}>
            <div style={styles.sectionHead}>
              <div>
                <div style={styles.eyebrow}>Pipeline</div>
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
                  Mine ({claimedTasks.length})
                </button>
              </div>
            </div>

            <div style={styles.tasksGrid}>
              {filteredTasks.length === 0 ? (
                <div style={styles.emptyState}>
                  <p style={styles.emptyTitle}>Nothing here yet.</p>
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
                      <div style={{ ...styles.badge, backgroundImage: getPriorityColor(task.priority) }}>
                        {getPriorityLabel(task.priority)}
                      </div>
                    </div>

                    <div style={styles.metaRow}>
                      <div style={styles.metaBlock}>
                        <div style={styles.label}>Deadline</div>
                        <div style={styles.value}>{new Date(task.deadline).toLocaleDateString()}</div>
                      </div>
                      <div style={styles.metaBlock}>
                        <div style={styles.label}>Reward</div>
                        <div style={styles.value}>{task.reward || "-"}</div>
                      </div>
                      <div style={styles.metaBlock}>
                        <div style={styles.label}>Owner</div>
                        <div style={styles.value}>{task.createdBy || "-"}</div>
                      </div>
                    </div>

                    <div style={styles.statusStrip}>
                      <span
                        style={{
                          ...styles.statusChip,
                          background:
                            task.status === "completed"
                              ? "linear-gradient(135deg, #3b82f6, #7dd3fc)"
                              : task.status === "claimed"
                                ? "linear-gradient(135deg, #00f5a0, #00d9f5)"
                                : "linear-gradient(135deg, #f9d423, #ff4e50)",
                        }}
                      >
                        {task.status === "completed" ? "Completed" : task.status === "claimed" ? "Claimed" : "Open"}
                      </span>
                    </div>

                    <div style={styles.actionsRow}>
                      {!isTaskClaimed(task.id) && task.status === "open" && (
                        <button
                          onClick={() => handleClaimTask(task.id)}
                          disabled={!address}
                          style={{ ...styles.actionBtnPrimary, opacity: !address ? 0.6 : 1 }}
                        >
                          Claim
                        </button>
                      )}

                      {isTaskClaimed(task.id) && task.status === "claimed" && (
                        <button onClick={() => handleCompleteTask(task.id)} style={styles.actionBtnSecondary}>
                          Complete
                        </button>
                      )}

                      {(isTaskClaimed(task.id) || task.status === "claimed") && (
                        <button onClick={() => startWorkspace(task.id)} style={styles.actionBtnGhost}>
                          {workspaceTaskId === task.id ? "Workspace Open" : "Open Workspace"}
                        </button>
                      )}

                      {task.status === "completed" && <button style={styles.actionBtnDone}>Done</button>}
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

            {workspaceTaskId && (
              <div style={styles.workspaceShell}>
                <div style={styles.ideShell}>
                  {/* Activity Bar */}
                  <div style={styles.activityBar}>
                    <div
                      style={{ ...styles.activityIcon, ...(activeSidebar === 'explorer' ? styles.activityIconActive : {}) }}
                      onClick={() => setActiveSidebar('explorer')}
                      title="Explorer"
                    >
                      📁
                    </div>
                    <div
                      style={{ ...styles.activityIcon, ...(activeSidebar === 'scm' ? styles.activityIconActive : {}) }}
                      onClick={() => setActiveSidebar('scm')}
                      title="Source Control"
                    >
                      🌳
                    </div>
                    <div
                      style={{ ...styles.activityIcon, ...(activeSidebar === 'ai' ? styles.activityIconActive : {}) }}
                      onClick={() => setActiveSidebar('ai')}
                      title="AI Auditor"
                    >
                      ✨
                    </div>
                  </div>

                  {/* Sidebar */}
                  <div style={styles.sidebar}>
                    {activeSidebar === 'explorer' && (
                      <>
                        <div style={styles.sidebarHeader}>EXPLORER</div>
                        <div style={styles.fileList}>
                          {workspaceFiles.map(file => (
                            <div
                              key={file.path}
                              onClick={() => loadWorkspaceFile(file.path)}
                              style={{
                                ...styles.fileNode,
                                ...(activeWorkspaceFile === file.path ? styles.fileNodeActive : {})
                              }}
                            >
                              {file.permission === 'readonly' && '🔒 '}{file.path}
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {activeSidebar === 'scm' && (
                      <>
                        <div style={styles.sidebarHeader}>SOURCE CONTROL</div>
                        <div style={{ padding: '10px' }}>
                          <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                            <button onClick={handleSync} disabled={workspaceLoading} style={{ ...styles.ctaPrimary, flex: 1, padding: '6px', fontSize: '11px' }}>Sync ⬇</button>
                            <button onClick={handlePush} disabled={workspaceLoading} style={{ ...styles.ctaGhost, flex: 1, padding: '6px', fontSize: '11px' }}>Push ⬆</button>
                          </div>

                          <input
                            style={styles.scmInput}
                            placeholder="Message"
                            value={commitMessage}
                            onChange={e => setCommitMessage(e.target.value)}
                          />
                          <button onClick={commitWorkspaceChanges} style={styles.scmBtn}>Commit</button>

                          <div style={{ ...styles.sidebarHeader, marginTop: '20px' }}>CHANGES</div>
                          {conflicts.length > 0 && <div style={{ color: '#f87171', fontSize: '11px', padding: '0 10px' }}>⚠ {conflicts.length} Conflicts</div>}

                          <button
                            onClick={() => {
                              loadDiff()
                              setShowDiff(!showDiff)
                            }}
                            style={{ ...styles.ctaGhost, width: '100%', marginTop: '10px', fontSize: '11px' }}
                          >
                            {showDiff ? "Close Diff" : "Show Changes"}
                          </button>

                          <div style={{ ...styles.sidebarHeader, marginTop: '20px' }}>ACTIONS</div>

                          {readiness && (
                            <div style={{ padding: '0 10px 10px', fontSize: '11px' }}>
                              <div style={{ fontWeight: 700, color: readiness.ready ? '#14f195' : '#ef4444' }}>
                                {readiness.ready ? "✅ Ready to Merge" : "❌ Not Ready"}
                              </div>
                              {readiness.reason && <div style={{ color: '#999' }}>{readiness.reason}</div>}
                              {!readiness.ready && <div style={{ color: '#666', marginTop: '4px' }}>Sync to resolve.</div>}
                            </div>
                          )}

                          <button onClick={loadReadiness} style={{ ...styles.ctaGhost, width: '100%', fontSize: '11px', marginBottom: '6px' }}>Check Readiness</button>
                          <button onClick={handleRequestReview} style={{ ...styles.ctaGhost, width: '100%', fontSize: '11px', marginBottom: '6px' }}>Request Review</button>
                          <button onClick={handleApproveReview} style={{ ...styles.ctaPrimary, width: '100%', fontSize: '11px', marginBottom: '6px' }}>Approve</button>

                          <button
                            onClick={() => handleCompleteTask(workspaceTaskId)}
                            style={{ ...styles.ctaPrimary, width: '100%', fontSize: '11px', background: '#22c55e' }}
                          >
                            Complete Task
                          </button>
                        </div>
                      </>
                    )}

                    {activeSidebar === 'ai' && (
                      <div style={{ padding: '10px' }}>
                        <div style={{ ...styles.sidebarHeader, paddingLeft: 0 }}>AI AUDITOR</div>
                        <button
                          onClick={handleAIAudit}
                          style={{ ...styles.ctaGhost, fontSize: '12px', width: '100%', background: 'linear-gradient(135deg, #FF0080, #7928CA)', borderColor: 'transparent', color: 'white', marginBottom: '15px' }}
                        >
                          {auditLoading ? "Scanning..." : "Run Security Scan"}
                        </button>

                        {auditResult && (
                          <div style={{ fontSize: '12px' }}>
                            <div style={{ fontWeight: 'bold', color: auditResult.score > 80 ? '#14f195' : '#ef4444', marginBottom: '8px' }}>
                              Score: {auditResult.score}/100
                            </div>
                            <div style={{ marginBottom: '8px', color: '#ccc' }}>{auditResult.summary}</div>
                            {auditResult.issues.map((issue, idx) => (
                              <div key={idx} style={{ marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid #333' }}>
                                <div style={{ color: issue.severity === 'critical' ? '#ef4444' : '#facc15' }}>{issue.message}</div>
                                <div style={{ color: '#666', fontSize: '10px' }}>{issue.line}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Editor Area */}
                  <div style={styles.editorArea}>
                    <div style={styles.tabBar}>
                      <div style={styles.editorTab}>
                        {activeWorkspaceFile || 'Welcome'}
                        {isWorkspaceReadOnly && ' (Read Only)'}
                      </div>
                      {activeWorkspaceFile && !isWorkspaceReadOnly && (
                        <button onClick={saveWorkspaceFile} style={{ ...styles.ctaPrimary, padding: '2px 8px', fontSize: '11px', marginLeft: 'auto', marginRight: '10px' }}>Save</button>
                      )}
                    </div>
                    {workspaceError && <div style={{ background: '#b91c1c', color: 'white', fontSize: '12px', padding: '4px 10px' }}>{workspaceError}</div>}

                    <div style={{ flex: 1, position: 'relative' }}>
                      {showDiff ? (
                        <div style={{ padding: '10px', height: '100%', overflow: 'auto', fontFamily: 'monospace', whiteSpace: 'pre-wrap', background: '#1e1e1e', color: '#ccc' }}>
                          {diffContent.split('\n').map((line, i) => (
                            <div key={i} style={{
                              color: line.startsWith('+') ? '#4ade80' : line.startsWith('-') ? '#f87171' : '#cbd5e1',
                              backgroundColor: line.startsWith('+') ? 'rgba(74, 222, 128, 0.1)' : line.startsWith('-') ? 'rgba(248, 113, 113, 0.1)' : 'transparent'
                            }}>
                              {line}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <Editor
                          height="100%"
                          language={workspaceFiles.find(f => f.path === activeWorkspaceFile)?.language || "plaintext"}
                          value={workspaceFileContent}
                          onChange={val => {
                            if (isWorkspaceReadOnly) return
                            setWorkspaceFileContent(val || "")
                          }}
                          options={{
                            readOnly: isWorkspaceReadOnly,
                            minimap: { enabled: true },
                            fontSize: 14,
                            fontFamily: "Consolas, 'Courier New', monospace",
                            scrollBeyondLastLine: false,
                          }}
                          theme="vs-dark"
                        />
                      )}

                      {/* Conflict Banner Overlay in Editor */}
                      {conflicts.includes(activeWorkspaceFile) && (
                        <div style={{ position: 'absolute', bottom: 10, right: 10, background: '#b91c1c', padding: '8px 12px', borderRadius: '4px', color: 'white', fontSize: '12px', zIndex: 10 }}>
                          ⚠ File has conflicts
                          <button onClick={() => handleResolveConflict(activeWorkspaceFile)} style={{ marginLeft: '10px', background: 'white', color: '#b91c1c', border: 'none', padding: '2px 6px', cursor: 'pointer' }}>Mark Resolved</button>
                        </div>
                      )}
                    </div>

                    {/* Integrated Terminal Panel */}
                    <div style={{ height: '30%', borderTop: '1px solid #333', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ background: '#252526', padding: '4px 10px', fontSize: '11px', color: '#ccc', borderBottom: '1px solid #333', display: 'flex', gap: '15px' }}>
                        <span style={{ cursor: 'pointer', borderBottom: '1px solid white' }}>TERMINAL</span>
                        <span style={{ cursor: 'pointer', opacity: 0.6 }}>OUTPUT</span>
                        <span style={{ cursor: 'pointer', opacity: 0.6 }}>PROBLEMS</span>
                      </div>
                      <div style={{ ...styles.gitLog, flex: 1, borderRadius: 0, border: 'none', background: '#1e1e1e', fontFamily: 'Consolas, monospace', minHeight: 'auto', maxHeight: 'none' }}>
                        {gitLogs.map((log, idx) => (
                          <div key={idx} style={{ color: log.type === 'error' ? '#f87171' : log.type === 'command' ? '#60a5fa' : '#ccc', marginBottom: '2px' }}>
                            {log.type === 'command' ? '> ' : ''}{log.message}
                          </div>
                        ))}
                      </div>
                      <div style={{ padding: '5px', background: '#1e1e1e' }}>
                        <input
                          style={{ ...styles.gitInput, margin: 0, background: 'transparent', border: 'none', outline: 'none', borderRadius: 0 }}
                          placeholder="Type git command..."
                          value={gitCommand}
                          onChange={e => setGitCommand(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && runWorkspaceGitCommand()}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Status Bar */}
                  <div style={styles.statusBar}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <span>main*</span>
                      <span>0 errors</span>
                      <span>0 warnings</span>
                    </div>
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '15px' }}>
                      {activeWorkers.length > 0 && <span style={{ color: 'yellow' }}>⚠ {activeWorkers.length} Others Active</span>}
                      <span>Ln 1, Col 1</span>
                      <span>UTF-8</span>
                      <span>TypeScript</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  )
}

const styles: Record<string, any> = {
  shell: {
    position: "relative",
    minHeight: "100vh",
    background: "radial-gradient(circle at 10% 20%, rgba(127, 90, 240, 0.4), transparent 28%), radial-gradient(circle at 90% 15%, rgba(20, 241, 149, 0.35), transparent 32%), #050712",
    color: "#e5e7eb",
    overflow: "hidden",
    fontFamily: "'Space Grotesk', 'Inter', 'Segoe UI', sans-serif",
  },
  bgLayer: {
    position: "fixed",
    inset: 0,
    background: "linear-gradient(120deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 50%, rgba(255,255,255,0.05) 100%)",
    backdropFilter: "blur(16px)",
    opacity: 0.35,
    zIndex: 0,
    pointerEvents: "none",
  },
  blob: {
    position: "fixed",
    width: "420px",
    height: "420px",
    borderRadius: "50%",
    filter: "blur(60px)",
    opacity: 0.35,
    animation: "float 16s ease-in-out infinite",
    zIndex: 0,
  },
  blobA: { top: "-120px", left: "-80px", background: "#7f5af0" },
  blobB: { top: "40%", right: "-120px", background: "#14f195", animationDuration: "18s" },
  blobC: { bottom: "-140px", left: "35%", background: "#00d9f5", animationDuration: "20s" },
  container: {
    position: "relative",
    zIndex: 1,
    maxWidth: "1400px",
    margin: "0 auto",
    padding: "48px 20px 64px",
  },
  hero: {
    display: "grid",
    gridTemplateColumns: "2fr 1.1fr",
    gap: "24px",
    alignItems: "center",
    marginBottom: "28px",
  },
  eyebrow: {
    textTransform: "uppercase",
    letterSpacing: "0.14em",
    fontSize: "12px",
    color: "#9ca3af",
    marginBottom: "10px",
  },
  title: {
    margin: "0 0 8px",
    fontSize: "40px",
    color: "#f8fafc",
    lineHeight: 1.1,
  },
  lead: {
    margin: 0,
    color: "#cbd5e1",
    fontSize: "16px",
    maxWidth: "680px",
    lineHeight: 1.6,
  },
  heroActions: {
    display: "flex",
    gap: "12px",
    marginTop: "18px",
    flexWrap: "wrap",
  },
  ctaPrimary: {
    background: "linear-gradient(135deg, #7f5af0, #14f195)",
    border: "none",
    color: "#050712",
    fontWeight: 800,
    padding: "12px 18px",
    borderRadius: "14px",
    cursor: "pointer",
    boxShadow: "0 10px 40px rgba(20, 241, 149, 0.25)",
  },
  ctaGhost: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.16)",
    color: "#e5e7eb",
    padding: "12px 16px",
    borderRadius: "12px",
    cursor: "pointer",
  },
  connectedPill: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    background: "rgba(255,255,255,0.08)",
    padding: "10px 14px",
    borderRadius: "999px",
    border: "1px solid rgba(255,255,255,0.12)",
    fontFamily: "IBM Plex Mono, monospace",
  },
  pillDot: {
    width: "9px",
    height: "99px",
    borderRadius: "50%",
    background: "#14f195",
    boxShadow: "0 0 0 6px rgba(20,241,149,0.2)",
  },
  // VS Code Layout Styles
  ideShell: {
    display: 'grid',
    gridTemplateColumns: '48px 250px 1fr',
    gridTemplateRows: 'auto 1fr 30px', // header, main, status
    height: '85vh',
    background: '#1e1e1e',
    borderRadius: '8px',
    overflow: 'hidden',
    border: '1px solid #333',
    fontFamily: 'Segoe UI, sans-serif'
  },
  activityBar: {
    gridRow: '2 / 3',
    background: '#333333',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingTop: '10px',
    gap: '15px'
  },
  activityIcon: {
    width: '48px',
    height: '48px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    opacity: 0.6,
    borderLeft: '2px solid transparent'
  },
  activityIconActive: {
    opacity: 1,
    borderLeft: '2px solid #fff'
  },
  sidebar: {
    gridRow: '2 / 3',
    background: '#252526',
    borderRight: '1px solid #000',
    display: 'flex',
    flexDirection: 'column'
  },
  sidebarHeader: {
    padding: '10px 20px',
    fontSize: '11px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: '#bbbbbb',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  editorArea: {
    gridColumn: '3 / 4',
    gridRow: '2 / 3',
    display: 'flex',
    flexDirection: 'column',
    background: '#1e1e1e'
  },
  tabBar: {
    background: '#2d2d2d',
    display: 'flex',
    overflowX: 'auto'
  },
  editorTab: {
    padding: '8px 15px',
    background: '#1e1e1e',
    color: '#fff',
    fontSize: '13px',
    borderTop: '1px solid #007acc',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer'
  },
  panel: {
    gridColumn: '2 / 4',
    gridRow: '2 / 3', // Overlay or separate? VS code puts panel at bottom.
    // Let's make the panel toggleable or fixed height at bottom of editor area
    borderTop: '1px solid #333',
    background: '#1e1e1e',
    height: '200px',
    display: 'flex',
    flexDirection: 'column'
  },
  statusBar: {
    gridColumn: '1 / -1',
    gridRow: '3 / 4',
    background: '#007acc',
    display: 'flex',
    alignItems: 'center',
    padding: '0 10px',
    fontSize: '12px',
    color: '#fff',
    gap: '15px'
  },
  fileNode: {
    padding: '4px 20px',
    cursor: 'pointer',
    fontSize: '13px',
    color: '#ccc',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  fileNodeActive: {
    background: '#37373d',
    color: '#fff'
  },
  scmInput: {
    background: '#3c3c3c',
    border: '1px solid #3c3c3c',
    color: '#ccc',
    padding: '6px',
    fontSize: '13px',
    width: '90%',
    margin: '10px auto',
    borderRadius: '2px',
    display: 'block'
  },
  scmBtn: {
    background: '#0e639c',
    color: 'white',
    border: 'none',
    padding: '6px',
    width: '90%',
    margin: '0 auto 10px',
    cursor: 'pointer',
    display: 'block'
  },
  glassStat: {
    background: "rgba(255,255,255,0.06)",
    borderRadius: "18px",
    padding: "18px",
    border: "1px solid rgba(255,255,255,0.12)",
    boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
  },
  statRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "12px",
  },
  statGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "12px",
    marginBottom: "12px",
  },
  label: {
    color: "#9ca3af",
    fontSize: "12px",
  },
  metric: {
    fontSize: "30px",
    fontWeight: 800,
    color: "#f8fafc",
    lineHeight: 1.1,
  },
  metricSmall: {
    fontSize: "22px",
    fontWeight: 800,
    lineHeight: 1.1,
  },
  pill: {
    background: "rgba(255,255,255,0.08)",
    padding: "8px 12px",
    borderRadius: "999px",
    color: "#e5e7eb",
    border: "1px solid rgba(255,255,255,0.12)",
    fontSize: "12px",
  },
  progressTrack: {
    height: "9px",
    background: "rgba(255,255,255,0.08)",
    borderRadius: "999px",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    background: "linear-gradient(120deg, #7f5af0, #14f195, #7dd3fc)",
    backgroundSize: "200% 100%",
    animation: "shimmer 12s linear infinite",
  },
  progressLabel: {
    marginTop: "8px",
    color: "#9ca3af",
    fontSize: "12px",
  },

  cardWide: {
    background: "rgba(10, 14, 35, 0.8)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "20px",
    padding: "22px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
    backdropFilter: "blur(14px)",
    marginBottom: "20px",
  },
  sectionHead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    marginBottom: "12px",
  },
  sectionTitle: {
    margin: "0 0 6px",
    color: "#f8fafc",
    fontSize: "22px",
  },
  sectionLead: {
    margin: 0,
    color: "#9ca3af",
    fontSize: "14px",
  },
  tokenBadge: {
    background: "rgba(127,90,240,0.12)",
    border: "1px solid rgba(127,90,240,0.4)",
    color: "#f8fafc",
    padding: "10px 12px",
    borderRadius: "12px",
    fontFamily: "IBM Plex Mono, monospace",
    fontSize: "12px",
  },
  joinGrid: {
    display: "grid",
    gridTemplateColumns: "1.5fr 1fr",
    gap: "18px",
  },
  joinCard: {
    background: "rgba(255,255,255,0.02)",
    borderRadius: "16px",
    padding: "16px",
    border: "1px solid rgba(255,255,255,0.05)",
  },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "12px 0",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  },
  value: {
    color: "#e5e7eb",
    fontFamily: "IBM Plex Mono, monospace",
  },
  actionRow: {
    marginTop: "16px",
    display: "flex",
    gap: "10px",
  },
  successCard: {
    marginTop: "16px",
    padding: "14px",
    background: "rgba(20,241,149,0.1)",
    border: "1px solid rgba(20,241,149,0.4)",
    borderRadius: "12px",
  },
  successTitle: {
    color: "#14f195",
    fontWeight: 700,
    marginBottom: "8px",
  },
  sideNote: {
    background: "linear-gradient(135deg, rgba(127,90,240,0.08), rgba(20,241,149,0.08))",
    borderRadius: "16px",
    padding: "16px",
    border: "1px solid rgba(255,255,255,0.05)",
  },
  sideTitle: {
    margin: "0 0 8px",
    color: "#e5e7eb",
  },
  list: {
    margin: 0,
    paddingLeft: "18px",
    color: "#cbd5e1",
    lineHeight: 1.6,
  },
  filterPills: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  filterPill: {
    border: "1px solid rgba(255,255,255,0.08)",
    background: "transparent",
    color: "#cbd5e1",
    padding: "8px 12px",
    borderRadius: "999px",
    cursor: "pointer",
    fontSize: "12px",
  },
  filterPillActive: {
    background: "linear-gradient(135deg, rgba(127,90,240,0.3), rgba(20,241,149,0.3))",
    color: "#0b1021",
    border: "none",
  },
  tasksGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "14px",
    marginTop: "12px",
  },
  taskCard: {
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "16px",
    padding: "16px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
  },
  taskId: {
    fontFamily: "IBM Plex Mono, monospace",
    color: "#94a3b8",
    fontSize: "12px",
  },
  taskTitle: {
    margin: "4px 0",
    color: "#f8fafc",
    fontSize: "18px",
  },
  taskDescription: {
    margin: 0,
    color: "#cbd5e1",
    fontSize: "13px",
    lineHeight: 1.5,
  },
  badge: {
    padding: "10px 14px",
    borderRadius: "12px",
    color: "#0b1021",
    fontWeight: 800,
    height: "fit-content",
    boxShadow: "0 8px 20px rgba(0,0,0,0.3)",
  },
  metaRow: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "10px",
  },
  metaBlock: {
    background: "rgba(255,255,255,0.03)",
    borderRadius: "12px",
    padding: "10px",
    border: "1px solid rgba(255,255,255,0.05)",
  },
  statusStrip: {
    display: "flex",
    justifyContent: "flex-start",
  },
  statusChip: {
    padding: "6px 12px",
    borderRadius: "999px",
    fontWeight: 700,
    fontSize: "12px",
    color: "#0b1021",
  },
  actionsRow: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  actionBtnPrimary: {
    background: "linear-gradient(135deg, #7f5af0, #14f195)",
    border: "none",
    color: "#0b1021",
    padding: "10px 12px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: 700,
  },
  actionBtnSecondary: {
    background: "rgba(6,214,160,0.15)",
    border: "1px solid rgba(6,214,160,0.5)",
    color: "#e5e7eb",
    padding: "10px 12px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: 700,
  },
  actionBtnGhost: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#e5e7eb",
    padding: "10px 12px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: 700,
  },
  actionBtnDone: {
    background: "rgba(78,205,196,0.15)",
    border: "1px solid rgba(78,205,196,0.4)",
    color: "#9ae6b4",
    padding: "10px 12px",
    borderRadius: "10px",
    cursor: "not-allowed",
    fontWeight: 700,
  },
  emptyState: {
    gridColumn: "1 / -1",
    textAlign: "center",
    padding: "32px",
    background: "rgba(255,255,255,0.02)",
    borderRadius: "16px",
    border: "1px solid rgba(255,255,255,0.05)",
  },
  emptyTitle: {
    margin: "0 0 6px",
    color: "#f8fafc",
    fontSize: "18px",
  },
  emptySub: {
    margin: 0,
    color: "#94a3b8",
  },
  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "12px",
    marginTop: "14px",
  },
  statCard: {
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.05)",
    borderRadius: "14px",
    padding: "14px",
    textAlign: "center",
  },
  workspaceShell: {
    marginTop: "20px",
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "16px",
    padding: "16px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
  },
  workspaceHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
  },
  workspaceActions: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  bannerWarning: {
    marginTop: "12px",
    padding: "10px",
    background: "rgba(255,193,7,0.12)",
    border: "1px solid rgba(255,193,7,0.35)",
    borderRadius: "10px",
    color: "#facc15",
  },
  workspaceEmpty: {
    marginTop: "12px",
    padding: "14px",
    background: "rgba(255,255,255,0.02)",
    borderRadius: "12px",
    color: "#cbd5e1",
  },
  modeTabs: {
    display: "inline-flex",
    background: "rgba(255,255,255,0.04)",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.05)",
    margin: "14px 0",
  },
  modeTab: {
    border: "none",
    background: "transparent",
    color: "#cbd5e1",
    padding: "10px 14px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: 700,
  },
  modeTabActive: {
    background: "linear-gradient(135deg, rgba(127,90,240,0.25), rgba(20,241,149,0.25))",
    color: "#0b1021",
  },
  workspaceGrid: {
    display: "grid",
    gridTemplateColumns: "260px 1fr 320px",
    gap: "12px",
  },
  workspacePanel: {
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "14px",
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  panelTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 6px",
  },
  panelLabel: {
    fontSize: "11px",
    color: "#9ca3af",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  panelTitle: {
    margin: 0,
    color: "#f8fafc",
    fontSize: "16px",
  },
  fileList: {
    display: "grid",
    gap: "8px",
    maxHeight: "520px",
    overflowY: "auto",
  },
  fileItem: {
    padding: "10px",
    borderRadius: "10px",
    cursor: "pointer",
    border: "1px solid rgba(255,255,255,0.05)",
    fontSize: "13px",
  },
  gitLog: {
    background: "#0f172a",
    borderRadius: "10px",
    padding: "10px",
    minHeight: "300px",
    maxHeight: "300px",
    overflowY: "auto",
    border: "1px solid rgba(255,255,255,0.06)",
  },
  gitInput: {
    width: "100%",
    padding: "10px",
    borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.03)",
    color: "#e5e7eb",
    fontFamily: "IBM Plex Mono, monospace",
    marginTop: "8px",
    marginBottom: "6px",
  },
  commitCard: {
    marginTop: "12px",
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "12px",
    padding: "12px",
  },
  commitArea: {
    width: "100%",
    minHeight: "90px",
    borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.03)",
    color: "#e5e7eb",
    padding: "10px",
    fontFamily: "IBM Plex Mono, monospace",
    margin: "10px 0",
  },
}

















