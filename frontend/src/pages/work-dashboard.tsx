import { useState, useEffect } from "react"
import Editor from "@monaco-editor/react"
import axios from "axios"
import { checkWalletConnection, connectWallet } from "../services/wallet"
import { Terminal, Code, GitCommit, RefreshCw, AlertTriangle, File as FileIcon, Save, Wallet } from "lucide-react"

const API = "/api"

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

export default function WorkDashboard() {
  const [taskId, setTaskId] = useState("")
  const [claimId, setClaimId] = useState("")
  const [address, setAddress] = useState("")
  const [files, setFiles] = useState<WorkspaceFile[]>([])
  const [activeFile, setActiveFile] = useState<string>("")
  const [fileContent, setFileContent] = useState("")
  const [mode, setMode] = useState<"work" | "review" | "commit">("work")
  const [gitLogs, setGitLogs] = useState<GitLog[]>([])
  const [gitCommand, setGitCommand] = useState("")
  const [commitMessage, setCommitMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [pushing, setPushing] = useState(false)


  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const tId = params.get("taskId")
    const cId = params.get("claimId")

    if (tId && cId) {
      setTaskId(tId)
      setClaimId(cId)
      // Try silent connect first
      // If we don't have an address, we don't prompt yet unless they click connect
      // But we CAN load files if we have the IDs
      checkWalletConnection().then(res => {
        if (res) setAddress(res.address)
      })
    } else {
      // Restore from localStorage
      const savedTaskId = localStorage.getItem("taskchain_taskId")
      const savedClaimId = localStorage.getItem("taskchain_claimId")
      const savedActiveFile = localStorage.getItem("taskchain_activeFile")

      if (savedTaskId && savedClaimId) {
        setTaskId(savedTaskId)
        setClaimId(savedClaimId)
        if (savedActiveFile) setActiveFile(savedActiveFile)

        checkWalletConnection().then(res => {
          if (res) setAddress(res.address)
        })
      }
    }
  }, [])

  useEffect(() => {
    if (taskId) localStorage.setItem("taskchain_taskId", taskId)
    if (claimId) localStorage.setItem("taskchain_claimId", claimId)
    if (activeFile) localStorage.setItem("taskchain_activeFile", activeFile)
  }, [taskId, claimId, activeFile])

  async function handleManualConnect() {
    try {
      const { address } = await connectWallet()
      setAddress(address)
      if (!claimId) {
        setClaimId(`claim-${Date.now()}-${address.slice(0, 6)}`)
      }
    } catch (err: any) {
      setError("❌ " + err.message)
    }
  }

  // Effect to load files when we have IDs and no files loaded (restoration)
  useEffect(() => {
    if (taskId && claimId && files.length === 0 && !loading) {
      // Force initialize to ensure scope is up to date (writable)
      initializeWorkspace()
    }
  }, [taskId, claimId])

  async function initializeWorkspace() {
    try {
      setLoading(true)
      setError("")
      const repoUrl = "https://github.com/ThelastC0debenders/Pathway-Hack.git"

      await axios.post(`${API}/workspace/create`, {
        taskId,
        claimId,
        repoUrl,
        scope: [
          { path: ".", permission: "editable" } // [MODIFIED] Full access
        ]
      })

      await loadFiles()
    } catch (err: any) {
      setError("❌ " + (err.response?.data?.error || err.message))
    } finally {
      setLoading(false)
    }
  }

  async function loadFiles() {
    try {
      const res = await axios.get(`${API}/workspace/${taskId}/${claimId}/files`)
      setFiles(res.data.files)
      if (res.data.files.length > 0) {
        // If we have an active file from storage, try to use it
        // Otherwise use the first one
        if (!activeFile) {
          setActiveFile(res.data.files[0].path)
          await loadFile(res.data.files[0].path)
        } else {
          // Just reload content of active file
          await loadFile(activeFile)
        }
      }
    } catch (err: any) {
      setError("❌ " + (err.response?.data?.error || err.message))
    }
  }

  async function loadFile(filePath: string) {
    try {
      const res = await axios.get(`${API}/workspace/${taskId}/${claimId}/file/${filePath}`)
      setFileContent(res.data.content)
      setActiveFile(filePath)
    } catch (err: any) {
      setError("❌ " + (err.response?.data?.error || err.message))
    }
  }

  async function saveFile() {
    if (!activeFile || !taskId || !claimId) return
    try {
      await axios.post(`${API}/workspace/${taskId}/${claimId}/file/${activeFile}`, {
        content: fileContent,
      })
      setError("✅ Saved")
      setTimeout(() => setError(""), 1500)
    } catch (err: any) {
      setError("❌ " + (err.response?.data?.error || err.message))
    }
  }

  async function runGitCommand() {
    if (!gitCommand.trim()) return
    try {
      setGitLogs([...gitLogs, {
        type: "command",
        message: `$ git ${gitCommand}`,
        timestamp: new Date().toLocaleTimeString()
      }])

      const res = await axios.post(`${API}/workspace/${taskId}/${claimId}/git`, {
        command: gitCommand
      })

      if (res.data.ok) {
        setGitLogs(prev => [...prev, {
          type: "output",
          message: res.data.output,
          timestamp: new Date().toLocaleTimeString()
        }])
      } else {
        setGitLogs(prev => [...prev, {
          type: "error",
          message: res.data.error,
          timestamp: new Date().toLocaleTimeString()
        }])
      }

      setGitCommand("")
    } catch (err: any) {
      setGitLogs(prev => [...prev, {
        type: "error",
        message: err.message,
        timestamp: new Date().toLocaleTimeString()
      }])
    }
  }

  async function commitChanges() {
    if (!address) {
      setError("❌ Connect wallet to commit")
      return
    }
    if (!commitMessage.trim()) {
      setError("❌ Enter commit message")
      return
    }

    try {
      // ===== COMMIT PHASE =====
      setLoading(true)

      const res = await axios.post(
        `${API}/workspace/${taskId}/${claimId}/commit`,
        {
          message: commitMessage,
          author: address
        }
      )

      if (!res.data.ok) throw new Error("Commit failed")

      setError("✅ Changes committed!")
      setCommitMessage("")
      setMode("commit")

      // 🔑 END commit phase
      setLoading(false)

      // ===== PUSH PHASE =====
      setPushing(true)
      setError("🚀 Pushing changes...")

      const pushRes = await axios.post(
        `${API}/workspace/${taskId}/${claimId}/push`
      )

      if (!pushRes.data.ok) {
        setError("⚠️ Commit done, push failed")
      } else {
        setError("🚀 Changes committed & pushed!")
      }

      setTimeout(() => setError(""), 3000)
    } catch (err: any) {
      setError("❌ " + (err.response?.data?.error || err.message))
      setLoading(false)
    } finally {
      setPushing(false)
    }
  }


  const currentFile = files.find(f => f.path === activeFile)
  const isReadOnly = currentFile?.permission === "readonly"

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.activityButton}><Code size={20} color="#00ff88" /></div>
          <div>
            <h1 style={styles.title}>IDE :: {taskId}</h1>
            <div style={styles.breadcrumb}>
              <span style={styles.claimId}>CLAIM: {claimId}</span>
              {address ? (
                <span style={styles.walletAddr}> | WALLET: {address.slice(0, 6)}...{address.slice(-4)}</span>
              ) : (
                <button onClick={handleManualConnect} style={styles.connectLink}>
                  <Wallet size={10} /> CONNECT WALLET
                </button>
              )}
            </div>
          </div>
        </div>
        <div style={styles.headerRight}>
          {files.length > 0 && (
            <button onClick={saveFile} style={styles.ctaPrimary}>
              <Save size={14} /> SAVE
            </button>
          )}

          {!files.length ? (
            <button
              onClick={initializeWorkspace}
              disabled={loading}
              style={styles.ctaPrimary}
            >
              <RefreshCw size={14} className={loading ? "spin" : ""} /> {loading ? "INITIALIZING..." : "INITIALIZE ENV"}
            </button>
          ) : (
            <div style={styles.modeSwitcher}>
              {(["work", "review", "commit"] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  style={{
                    ...styles.modeBtn,
                    ...(mode === m ? styles.modeBtnActive : {})
                  }}
                >
                  {m.toUpperCase()}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {error && (
        <div style={styles.errorBanner}>
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {files.length > 0 && (
        <div style={styles.workspaceShell}>
          {/* Sidebar */}
          <div style={styles.sidebar}>
            <div style={styles.sidebarHeader}>EXPLORER</div>
            <div style={styles.fileList}>
              {files.map(file => (
                <div
                  key={file.path}
                  onClick={() => loadFile(file.path)}
                  style={{
                    ...styles.fileItem,
                    ...(activeFile === file.path ? styles.fileItemActive : {})
                  }}
                >
                  {file.permission === "readonly" ? <AlertTriangle size={12} color="#f9d423" /> : <FileIcon size={14} color="#666" />}
                  <span style={styles.fileName}>{file.path}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Main Editor Area */}
          <div style={styles.editorArea}>
            {/* Bare Editor Component */}
            <div style={{ flex: 1, border: "1px solid #333", overflow: "hidden" }}>
              <Editor
                height="100%"
                language={currentFile?.language || "javascript"}
                value={fileContent}
                onChange={(val) => !isReadOnly && setFileContent(val || "")}
                options={{
                  readOnly: isReadOnly || mode !== "work",
                  minimap: { enabled: true },
                  fontSize: 14,
                  fontFamily: "monospace",
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                }}
                theme="vs-dark"
              />
            </div>

            {/* Terminal / Commit Panel */}
            <div style={styles.bottomPanel}>
              {mode === "commit" ? (
                <div style={styles.commitPanel}>
                  <div style={styles.panelTitle}><GitCommit size={16} /> COMMIT CHANGES</div>
                  <div style={styles.commitForm}>
                    <textarea
                      value={commitMessage}
                      onChange={(e) => setCommitMessage(e.target.value)}
                      placeholder="feat: implement new authentication flow..."
                      style={styles.commitInput}
                    />
                    <button
                      onClick={commitChanges}
                      disabled={loading || pushing}
                      style={styles.commitBtn}
                    >
                      {loading
                        ? "COMMITTING..."
                        : pushing
                          ? "PUSHING..."
                          : "COMMIT"}
                    </button>

                  </div>
                </div>
              ) : (
                <div style={styles.terminalPanel}>
                  <div style={styles.panelTitle}><Terminal size={14} /> TERMINAL</div>
                  <div style={styles.terminalOutput}>
                    {gitLogs.map((log, i) => (
                      <div key={i} style={{
                        ...styles.logLine,
                        color: log.type === "error" ? "#ff4e50" : log.type === "command" ? "#00d9f5" : "#00ff88"
                      }}>
                        <span style={styles.timestamp}>[{log.timestamp}]</span> {log.message}
                      </div>
                    ))}
                  </div>
                  <div style={styles.terminalInputRow}>
                    <span style={styles.prompt}>$</span>
                    <input
                      type="text"
                      value={gitCommand}
                      onChange={(e) => setGitCommand(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && runGitCommand()}
                      placeholder="git command..."
                      style={styles.terminalInput}
                    />
                    <button onClick={runGitCommand} style={styles.runDist}>RUN</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const styles: any = {
  container: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "#0d1117",
    color: "#c9d1d9",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
    overflow: "hidden",
  },
  header: {
    height: "50px",
    background: "#161b22",
    borderBottom: "1px solid #30363d",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 16px",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  activityButton: {
    padding: "8px",
    borderRadius: "6px",
    cursor: "pointer",
    background: "rgba(0, 255, 136, 0.1)",
  },
  title: {
    fontSize: "14px",
    fontWeight: "bold",
    margin: 0,
    color: "#fff",
    letterSpacing: "0.5px",
  },
  breadcrumb: {
    fontSize: "11px",
    color: "#8b949e",
    display: "flex",
    gap: "8px",
    fontFamily: "monospace",
  },
  claimId: {
    maxWidth: "200px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  walletAddr: {
    fontFamily: "monospace",
    color: "#00ff88",
  },
  headerRight: {
    display: "flex",
    gap: "12px",
  },
  ctaPrimary: {
    background: "#238636",
    color: "#fff",
    border: "1px solid rgba(240, 246, 252, 0.1)",
    borderRadius: "6px",
    padding: "6px 14px",
    fontSize: "12px",
    fontWeight: "bold",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  modeSwitcher: {
    display: "flex",
    background: "#0d1117",
    border: "1px solid #30363d",
    borderRadius: "6px",
    padding: "2px",
  },
  modeBtn: {
    background: "transparent",
    border: "none",
    color: "#8b949e",
    padding: "4px 12px",
    fontSize: "11px",
    fontWeight: "600",
    cursor: "pointer",
    borderRadius: "4px",
  },
  modeBtnActive: {
    background: "#1f6feb",
    color: "#fff",
  },
  errorBanner: {
    background: "#2a0e0e",
    color: "#ffa198",
    padding: "8px 16px",
    fontSize: "12px",
    borderBottom: "1px solid #4c1d1d",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  workspaceShell: {
    flex: 1,
    display: "flex",
    overflow: "hidden",
  },
  sidebar: {
    width: "250px",
    background: "#0d1117",
    borderRight: "1px solid #30363d",
    display: "flex",
    flexDirection: "column",
  },
  sidebarHeader: {
    padding: "10px 16px",
    fontSize: "11px",
    fontWeight: "bold",
    color: "#8b949e",
    textTransform: "uppercase",
    letterSpacing: "1px",
  },
  fileList: {
    flex: 1,
    overflowY: "auto",
    padding: "0 8px",
  },
  fileItem: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 8px",
    borderRadius: "4px",
    cursor: "pointer",
    color: "#8b949e",
    marginBottom: "2px",
  },
  fileItemActive: {
    background: "#161b22",
    color: "#fff",
  },
  fileName: {
    fontSize: "13px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  editorArea: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    background: "#0d1117",
  },
  editorHeader: {
    height: "36px",
    background: "#0d1117",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #30363d",
  },
  tabActive: {
    height: "100%",
    background: "#1e1e1e",
    borderTop: "1px solid #f9826c",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "0 16px",
    fontSize: "12px",
  },
  editorActions: {
    paddingRight: "10px",
  },
  actionBtn: {
    background: "transparent",
    border: "1px solid #30363d",
    color: "#c9d1d9",
    padding: "4px 8px",
    fontSize: "11px",
    borderRadius: "4px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  editorWrapper: {
    flex: 1,
    overflow: "hidden",
  },
  bottomPanel: {
    height: "250px",
    background: "#0d1117",
    borderTop: "1px solid #30363d",
    display: "flex",
    flexDirection: "column",
  },
  terminalPanel: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    padding: "10px",
    overflow: "hidden",
  },
  commitPanel: {
    flex: 1,
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  panelTitle: {
    fontSize: "11px",
    fontWeight: "bold",
    color: "#8b949e",
    marginBottom: "10px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  terminalOutput: {
    flex: 1,
    fontFamily: "monospace",
    fontSize: "12px",
    overflowY: "auto",
    marginBottom: "10px",
  },
  logLine: {
    marginBottom: "4px",
    lineHeight: "1.4",
  },
  timestamp: {
    color: "#484f58",
  },
  terminalInputRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "#161b22",
    padding: "6px",
    borderRadius: "4px",
    border: "1px solid #30363d",
  },
  prompt: {
    color: "#00ff88",
    fontWeight: "bold",
  },
  terminalInput: {
    flex: 1,
    background: "transparent",
    border: "none",
    color: "#fff",
    fontFamily: "monospace",
    fontSize: "12px",
    outline: "none",
  },
  runDist: {
    background: "#238636",
    border: "none",
    color: "#fff",
    padding: "2px 8px",
    borderRadius: "3px",
    fontSize: "10px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  commitForm: {
    display: "flex",
    gap: "10px",
    alignItems: "start",
  },
  commitInput: {
    flex: 1,
    height: "100px",
    background: "#161b22",
    border: "1px solid #30363d",
    borderRadius: "6px",
    color: "#fff",
    padding: "10px",
    fontFamily: "monospace",
    fontSize: "13px",
  },
  commitBtn: {
    background: "#238636",
    color: "#fff",
    border: "none",
    padding: "10px 20px",
    borderRadius: "6px",
    fontWeight: "bold",
    cursor: "pointer",
    height: "fit-content",
  },
}
