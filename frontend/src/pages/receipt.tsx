import { useEffect, useState } from "react"
import { fetchFromIPFS } from "../services/backend"
import { Archive } from "lucide-react"


export default function Receipt() {
  const [receipt, setReceipt] = useState<any>(null)

  useEffect(() => {
    fetchFromIPFS("PASTE_CID_HERE").then(setReceipt)
  }, [])

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.iconBox}><Archive size={24} color="#00ff88" /></div>
          <div>
            <div style={styles.eyebrow}>IPFS IMMUTABLE RECORD</div>
            <h1 style={styles.title}>Receipt Viewer</h1>
          </div>
        </div>
        <div style={styles.codeArea}>
          {receipt ? (
            <pre style={styles.pre}>{JSON.stringify(receipt, null, 2)}</pre>
          ) : (
            <div style={styles.loading}>Accessing IPFS network...</div>
          )}
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
  loading: {
    color: "#666",
    textAlign: "center" as const,
    padding: "40px",
    fontStyle: "italic",
  },
}
