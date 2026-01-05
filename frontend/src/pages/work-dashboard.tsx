import { useState, useEffect } from "react"
import Editor from "@monaco-editor/react"
import axios from "axios"
import { connectWallet } from "../services/wallet"

const API = "http://localhost:5000"

interface File {
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
  const [taskId, setTaskId] = useState("task-1")
  const [claimId, setClaimId] = useState("")
  const [address, setAddress] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [activeFile, setActiveFile] = useState<string>("")
  const [fileContent, setFileContent] = useState("")
  const [mode, setMode] = useState<"work" | "review" | "commit">("work")
  const [gitLogs, setGitLogs] = useState<GitLog[]>([])
  const [gitCommand, setGitCommand] = useState("")
  const [commitMessage, setCommitMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    connectAndLoad()
  }, [])

  async function connectAndLoad() {
    try {
      const { address } = await connectWallet()
      setAddress(address)
      setClaimId(`claim-${Date.now()}-${address.slice(0, 6)}`)
    } catch (err: any) {
      setError("❌ " + err.message)
    }
  }

  async function initializeWorkspace() {
    try {
      setLoading(true)
      setError("")
      const repoUrl = "https://github.com/saaj376/taskchain.git"
      
      const res = await axios.post(`${API}/workspace/create`, {
        taskId,
        claimId,
        repoUrl,
        scope: [
          { path: "src", permission: "editable" },
          { path: "contracts", permission: "editable" },
          { path: "README.md", permission: "readonly" },
          { path: "package.json", permission: "readonly" }
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
        setActiveFile(res.data.files[0].path)
        await loadFile(res.data.files[0].path)
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
    if (!activeFile) return
    try {
      await axios.post(`${API}/workspace/${taskId}/${claimId}/file/${activeFile}`, {
        content: fileContent
      })
      setError("✅ File saved!")
      setTimeout(() => setError(""), 2000)
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
    if (!commitMessage.trim()) {
      setError("❌ Enter commit message")
      return
    }
    try {
      setLoading(true)
      const res = await axios.post(`${API}/workspace/${taskId}/${claimId}/commit`, {
        message: commitMessage,
        author: address
      })
      
      if (res.data.ok) {
        setError("✅ Changes committed!")
        setCommitMessage("")
        setMode("commit")
        setTimeout(() => setError(""), 3000)
      }
    } catch (err: any) {
      setError("❌ " + (err.response?.data?.error || err.message))
    } finally {
      setLoading(false)
    }
  }

  const currentFile = files.find(f => f.path === activeFile)
  const isReadOnly = currentFile?.permission === "readonly"

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", padding: "20px" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ background: "white", padding: "20px", borderRadius: "10px", marginBottom: "20px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
          <h1>💻 Workspace</h1>
          <p>Task: <strong>{taskId}</strong> | Claim: <strong>{claimId.slice(0, 20)}...</strong></p>
          <p>Wallet: <strong>{address ? address.slice(0, 10) + "..." : "Not connected"}</strong></p>
          {!files.length && (
            <button 
              onClick={initializeWorkspace}
              disabled={loading}
              style={{
                padding: "10px 20px",
                background: "#667eea",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                marginTop: "10px"
              }}
            >
              {loading ? "Initializing..." : "Initialize Workspace"}
            </button>
          )}
          {error && <p style={{ marginTop: "10px", color: error.includes("✅") ? "green" : "red" }}>{error}</p>}
        </div>

        {files.length > 0 && (
          <>
            {/* Mode Switcher */}
            <div style={{ background: "white", padding: "10px", borderRadius: "10px", marginBottom: "20px", display: "flex", gap: "10px" }}>
              {(["work", "review", "commit"] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  style={{
                    padding: "8px 16px",
                    background: mode === m ? "#667eea" : "#e0e0e0",
                    color: mode === m ? "white" : "black",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                    textTransform: "capitalize"
                  }}
                >
                  {m === "work" && "✏️"} {m === "review" && "👁️"} {m === "commit" && "✓"} {m}
                </button>
              ))}
            </div>

            {/* Main Editor */}
            <div style={{ display: "grid", gridTemplateColumns: "250px 1fr 300px", gap: "20px", marginBottom: "20px" }}>
              {/* File Explorer */}
              <div style={{ background: "white", borderRadius: "10px", padding: "15px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)", maxHeight: "600px", overflowY: "auto" }}>
                <h3>📁 Files</h3>
                {files.map(file => (
                  <div
                    key={file.path}
                    onClick={() => loadFile(file.path)}
                    style={{
                      padding: "8px",
                      margin: "5px 0",
                      background: activeFile === file.path ? "#667eea" : "#f5f5f5",
                      color: activeFile === file.path ? "white" : "black",
                      borderRadius: "5px",
                      cursor: "pointer",
                      fontSize: "12px",
                      wordBreak: "break-word",
                      opacity: file.permission === "readonly" ? 0.7 : 1
                    }}
                  >
                    {file.permission === "readonly" && "🔒 "}{file.path}
                  </div>
                ))}
              </div>

              {/* Editor */}
              <div style={{ background: "white", borderRadius: "10px", overflow: "hidden", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
                <div style={{ padding: "10px", background: "#f5f5f5", borderBottom: "1px solid #ddd", display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontWeight: "bold" }}>{activeFile || "No file selected"}</span>
                  {!isReadOnly && mode === "work" && (
                    <button onClick={saveFile} style={{ padding: "5px 10px", background: "#667eea", color: "white", border: "none", borderRadius: "3px", cursor: "pointer" }}>
                      �� Save
                    </button>
                  )}
                </div>
                <Editor
                  height="600px"
                  language={currentFile?.language || "plaintext"}
                  value={fileContent}
                  onChange={(val) => !isReadOnly && setFileContent(val || "")}
                  options={{
                    readOnly: isReadOnly || mode !== "work",
                    minimap: { enabled: false },
                    fontSize: 13,
                    fontFamily: "Fira Code, monospace"
                  }}
                  theme="vs-light"
                />
              </div>

              {/* Git Terminal */}
              <div style={{ background: "white", borderRadius: "10px", padding: "15px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column" }}>
                <h3>🔌 Git Terminal</h3>
                <div style={{ background: "#1e1e1e", color: "#00ff00", padding: "10px", borderRadius: "5px", height: "350px", overflowY: "auto", fontFamily: "monospace", fontSize: "11px", marginBottom: "10px" }}>
                  {gitLogs.map((log, i) => (
                    <div key={i} style={{ color: log.type === "error" ? "#ff6b6b" : log.type === "command" ? "#4ecdc4" : "#00ff00", marginBottom: "5px" }}>
                      [{log.timestamp}] {log.message}
                    </div>
                  ))}
                </div>
                <input
                  type="text"
                  value={gitCommand}
                  onChange={(e) => setGitCommand(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && runGitCommand()}
                  placeholder="git status, git add ., git log..."
                  style={{ padding: "8px", marginBottom: "10px", borderRadius: "5px", border: "1px solid #ddd", fontFamily: "monospace", fontSize: "12px" }}
                />
                <button onClick={runGitCommand} style={{ padding: "8px", background: "#667eea", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}>
                  Execute
                </button>
              </div>
            </div>

            {/* Commit Panel */}
            {mode === "review" && (
              <div style={{ background: "white", padding: "20px", borderRadius: "10px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
                <h3>📝 Review Changes</h3>
                <p>Review your changes before committing...</p>
              </div>
            )}

            {mode === "commit" && (
              <div style={{ background: "white", padding: "20px", borderRadius: "10px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
                <h3>✓ Commit Work</h3>
                <textarea
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  placeholder="Enter commit message..."
                  style={{ width: "100%", height: "80px", padding: "10px", marginBottom: "10px", borderRadius: "5px", border: "1px solid #ddd", fontFamily: "monospace" }}
                />
                <button
                  onClick={commitChanges}
                  disabled={loading}
                  style={{
                    padding: "10px 20px",
                    background: loading ? "#ccc" : "#4caf50",
                    color: "white",
                    border: "none",
                    borderRadius: "5px",
                    cursor: loading ? "default" : "pointer"
                  }}
                >
                  {loading ? "Committing..." : "💾 Commit Changes"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
