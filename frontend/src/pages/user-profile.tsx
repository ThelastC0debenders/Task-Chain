import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import axios from "axios"
import { User, CheckCircle, Clock, Shield, Award, ExternalLink } from "lucide-react"

const API = "/api"

interface TaskEvent {
    id: string
    taskId: number
    type: string
    timestamp: number
    actor: string
    details?: any
    txHash: string
}

export default function UserProfile() {
    const { address } = useParams<{ address: string }>()
    const [history, setHistory] = useState<TaskEvent[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (address) {
            fetchHistory(address)
        }
    }, [address])

    async function fetchHistory(addr: string) {
        try {
            const res = await axios.get(`${API}/analytics/history/${addr}`)
            setHistory(res.data.history || [])
        } catch (err) {
            console.error("Failed to fetch history:", err)
        } finally {
            setLoading(false)
        }
    }

    const completedCount = history.filter(e => e.type === "COMPLETED").length
    const reputationScore = completedCount * 100 // Mock score logic

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <div style={styles.avatar}>
                    <User size={40} color="#000" />
                </div>
                <div>
                    <div style={styles.eyebrow}>CONTRIBUTOR PROFILE</div>
                    <h1 style={styles.address}>{address}</h1>
                    <div style={styles.tags}>
                        <span style={styles.tag}>LVL {Math.floor(completedCount / 5) + 1}</span>
                        <span style={styles.tag}>ENGINEER</span>
                    </div>
                </div>
            </header>

            <div style={styles.statsGrid}>
                <div style={styles.statCard}>
                    <div style={styles.statLabel}>TASKS COMPLETED</div>
                    <div style={styles.statValue}>{completedCount}</div>
                    <CheckCircle size={20} color="#00ff88" style={{ position: 'absolute', top: 20, right: 20, opacity: 0.5 }} />
                </div>
                <div style={styles.statCard}>
                    <div style={styles.statLabel}>REPUTATION SCORE</div>
                    <div style={styles.statValue}>{reputationScore}</div>
                    <Award size={20} color="#f9d423" style={{ position: 'absolute', top: 20, right: 20, opacity: 0.5 }} />
                </div>
                <div style={styles.statCard}>
                    <div style={styles.statLabel}>LAST ACTIVE</div>
                    <div style={styles.statValue}>
                        {history[0] ? new Date(history[0].timestamp).toLocaleDateString() : "-"}
                    </div>
                    <Clock size={20} color="#00d1ff" style={{ position: 'absolute', top: 20, right: 20, opacity: 0.5 }} />
                </div>
            </div>

            <div style={styles.sectionHeader}>
                <Shield size={18} color="#00ff88" />
                <h2 style={styles.sectionTitle}>ON-CHAIN HISTORY</h2>
            </div>

            <div style={styles.historyList}>
                {loading && <div style={styles.loading}>Syncing chain data...</div>}

                {history.length === 0 && !loading && (
                    <div style={styles.empty}>No contributions found for this address.</div>
                )}

                {history.map(event => (
                    <div key={event.id} style={styles.historyItem}>
                        <div style={styles.eventIcon}>
                            {event.type === 'COMPLETED' ? <CheckCircle size={14} color="#00ff88" /> : <Clock size={14} color="#888" />}
                        </div>
                        <div style={styles.eventContent}>
                            <div style={styles.eventTitle}>
                                {event.type === 'COMPLETED' ? 'Completed Task' : 'Action Performed'} #{event.taskId}
                            </div>
                            <div style={styles.eventMeta}>
                                {new Date(event.timestamp).toLocaleString()} • {event.type}
                            </div>
                            {event.details?.creator && (
                                <div style={styles.detail}>Creator: {event.details.creator}</div>
                            )}
                        </div>
                        <a href={`https://sepolia.etherscan.io/tx/${event.txHash}`} target="_blank" rel="noreferrer" style={styles.txLink}>
                            {event.txHash.slice(0, 6)}... <ExternalLink size={10} />
                        </a>
                    </div>
                ))}
            </div>
        </div>
    )
}

const styles: any = {
    container: {
        minHeight: "100vh",
        fontFamily: "'JetBrains Mono', monospace",
        background: "#050505",
        color: "#fff",
        padding: "60px 40px"
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        gap: '24px',
        marginBottom: '60px'
    },
    avatar: {
        width: '80px',
        height: '80px',
        background: '#fff',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    eyebrow: {
        fontSize: '12px',
        color: '#666',
        letterSpacing: '2px',
        marginBottom: '8px',
        fontWeight: 'bold'
    },
    address: {
        fontSize: '24px',
        margin: '0 0 10px 0',
        fontFamily: 'monospace'
    },
    tags: {
        display: 'flex',
        gap: '10px'
    },
    tag: {
        background: '#222',
        color: '#888',
        fontSize: '10px',
        padding: '4px 8px',
        borderRadius: '4px',
        fontWeight: 'bold'
    },
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '60px'
    },
    statCard: {
        background: '#0a0a0a',
        border: '1px solid #222',
        padding: '24px',
        borderRadius: '12px',
        position: 'relative'
    },
    statLabel: {
        fontSize: '10px',
        color: '#666',
        marginBottom: '10px',
        letterSpacing: '1px'
    },
    statValue: {
        fontSize: '32px',
        fontWeight: 'bold'
    },
    sectionHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '20px',
        borderBottom: '1px solid #222',
        paddingBottom: '15px'
    },
    sectionTitle: {
        fontSize: '14px',
        margin: 0,
        letterSpacing: '1px'
    },
    historyList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
    },
    historyItem: {
        background: '#0a0a0a',
        border: '1px solid #222',
        padding: '20px',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '20px'
    },
    eventIcon: {
        width: '32px',
        height: '32px',
        background: '#111',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid #333'
    },
    eventContent: {
        flex: 1
    },
    eventTitle: {
        fontSize: '14px',
        fontWeight: 'bold',
        marginBottom: '4px'
    },
    eventMeta: {
        fontSize: '12px',
        color: '#666'
    },
    detail: {
        fontSize: '11px',
        color: '#444',
        marginTop: '4px',
        fontFamily: 'monospace'
    },
    txLink: {
        color: '#444',
        textDecoration: 'none',
        fontSize: '12px',
        fontFamily: 'monospace',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
    },
    loading: {
        color: '#666',
        padding: '20px'
    },
    empty: {
        color: '#444',
        fontStyle: 'italic',
        padding: '20px'
    }
}
