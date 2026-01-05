import { useEffect, useState } from "react"
import { connectWallet } from "../services/wallet"
import { getContract, getTask, completeTask } from "../services/contract"
import { anchorReceipt } from "../services/backend"
import { Search, Loader } from "lucide-react"


export default function TaskView() {
  const [task, setTask] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  async function load() {
    try {
      const { address } = await connectWallet()
      const contract = await getContract()
      const t = await getTask(contract, 1) // Note: Hardcoded task ID 1
      setTask(t)

      if (t.completedAt === 0n) {
        await completeTask(contract, 1)
        await anchorReceipt(1, address)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <Loader className="spin" size={32} color="#00ff88" />
          <p>SYNCING ON-CHAIN DATA...</p>
        </div>
      </div>
    )
  }

  if (!task) return null

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.iconBox}><Search size={24} color="#00ff88" /></div>
          <div>
            <div style={styles.eyebrow}>BLOCKCHAIN EXPLORER</div>
            <h1 style={styles.title}>Task Details #1</h1>
          </div>
        </div>

        <div style={styles.codeArea}>
          <pre style={styles.pre}>{JSON.stringify(task, null, 2)}</pre>
        </div>
      </div>
    </div>
  )
}

const styles: any = {
  container: {
    minHeight: "100vh",
    background: "#05070a",
    padding: "40px 20px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontFamily: "'JetBrains Mono', monospace",
  },
  loading: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
    color: "#00ff88",
    letterSpacing: "2px",
    fontSize: "12px",
  },
  card: {
    width: "100%",
    maxWidth: "800px",
    background: "#0b0b0b",
    border: "1px solid #1f1f1f",
    borderRadius: "16px",
    padding: "30px",
    boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    marginBottom: "24px",
    borderBottom: "1px solid #1f1f1f",
    paddingBottom: "24px",
  },
  iconBox: {
    width: "48px",
    height: "48px",
    background: "rgba(0, 255, 136, 0.1)",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid rgba(0, 255, 136, 0.2)",
  },
  eyebrow: {
    fontSize: "11px",
    color: "#00ff88",
    letterSpacing: "2px",
    marginBottom: "4px",
    fontWeight: "bold",
  },
  title: {
    margin: 0,
    color: "#fff",
    fontSize: "24px",
    fontWeight: "bold",
  },
  codeArea: {
    background: "#050505",
    borderRadius: "8px",
    padding: "20px",
    border: "1px solid #1f1f1f",
    overflow: "auto",
    maxHeight: "600px",
  },
  pre: {
    margin: 0,
    color: "#a9b7c6",
    fontSize: "13px",
    lineHeight: "1.5",
    fontFamily: "'Fira Code', monospace",
  },
}
