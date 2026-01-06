import { useEffect, useState } from "react"
import axios from "axios"
import { Download, Users, CheckCircle, AlertTriangle, TrendingUp, Search, ExternalLink } from "lucide-react"

const API = "/api"

interface ContributionReport {
    totalTasks: number;
    completedTasks: number;
    totalContributors: number;
    recentActivity: any[];
    velocity: { date: string, count: number }[];
    disputes: any[];
}

export default function LeaderReports({ teamId = "team-123" }: { teamId?: string }) {
    const [report, setReport] = useState<ContributionReport | null>(null)
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    useEffect(() => {
        fetchReport()
    }, [teamId])

    async function fetchReport() {
        try {
            const res = await axios.get(`${API}/business/report/${teamId}`)
            setReport(res.data.report)
        } catch (err) {
            console.error("Failed to fetch report:", err)
        } finally {
            setLoading(false)
        }
    }

    async function handleExport() {
        window.open(`${API}/business/export/csv/${teamId}`, "_blank")
    }

    if (loading) return <div style={styles.loading}>Loading Institutional Reports...</div>
    if (!report) return <div style={styles.error}>Failed to load reporting data.</div>

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <div>
                    <div style={styles.eyebrow}>ORGANIZER PORTAL</div>
                    <h1 style={styles.title}>Contribution Intelligence</h1>
                </div>
                <button onClick={handleExport} style={styles.exportBtn}>
                    <Download size={16} /> EXPORT CSV
                </button>
            </div>

            {/* Quick Stats */}
            <div style={styles.statsGrid}>
                <div style={styles.statCard}>
                    <Users size={20} color="#00ff88" />
                    <div style={styles.statLabel}>CONTRIBUTORS</div>
                    <div style={styles.statValue}>{report.totalContributors}</div>
                </div>
                <div style={styles.statCard}>
                    <CheckCircle size={20} color="#00d1ff" />
                    <div style={styles.statLabel}>VELOCITY</div>
                    <div style={styles.statValue}>{report.completedTasks} SHIPPED</div>
                </div>
                <div style={styles.statCard}>
                    <TrendingUp size={20} color="#f9d423" />
                    <div style={styles.statLabel}>EFFICIENCY</div>
                    <div style={styles.statValue}>{Math.round((report.completedTasks / (report.totalTasks || 1)) * 100)}%</div>
                </div>
                <div style={styles.statCard}>
                    <AlertTriangle size={20} color="#ff3333" />
                    <div style={styles.statLabel}>DISPUTES</div>
                    <div style={styles.statValue}>{report.disputes.length} PENDING</div>
                </div>
            </div>

            {/* Velocity Chart Simulation */}
            <div style={styles.section}>
                <div style={styles.sectionHeader}>
                    <TrendingUp size={18} color="#00ff88" />
                    <h2 style={styles.sectionTitle}>SHIPPING VELOCITY (LAST 7 DAYS)</h2>
                </div>
                <div style={styles.chartArea}>
                    {report.velocity.map((v) => (
                        <div key={v.date} style={styles.barGroup}>
                            <div
                                style={{
                                    ...styles.bar,
                                    height: `${(v.count / (Math.max(...report.velocity.map(x => x.count)) || 1)) * 100}%`,
                                    minHeight: v.count > 0 ? '4px' : '0px'
                                }}
                            />
                            <div style={styles.barLabel}>{v.date.split('-')[2]}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Detailed Table */}
            <div style={styles.section}>
                <div style={styles.tableControls}>
                    <div style={styles.searchWrapper}>
                        <Search size={16} color="#666" />
                        <input
                            type="text"
                            placeholder="Filter by hash or executor..."
                            style={styles.searchInput}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>TASK</th>
                            <th style={styles.th}>EXECUTOR</th>
                            <th style={styles.th}>PROOF STATUS</th>
                            <th style={styles.th}>TX HASH</th>
                        </tr>
                    </thead>
                    <tbody>
                        {report.recentActivity.filter(e => e.actor.includes(searchTerm) || e.txHash.includes(searchTerm)).map(event => (
                            <tr key={event.id} style={styles.tr}>
                                <td style={styles.td}>Task #{event.taskId}</td>
                                <td style={styles.td}>{event.actor.slice(0, 6)}...{event.actor.slice(-4)}</td>
                                <td style={styles.td}>
                                    <div style={styles.statusBadge}>
                                        <div style={{ ...styles.statusDot, background: event.type === 'COMPLETED' ? '#00ff88' : '#f9d423' }} />
                                        {event.type}
                                    </div>
                                </td>
                                <td style={styles.td}>
                                    <a href={`https://sepolia.etherscan.io/tx/${event.txHash}`} target="_blank" rel="noreferrer" style={styles.txLink}>
                                        {event.txHash.slice(0, 10)}... <ExternalLink size={10} />
                                    </a>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

const styles: any = {
    container: {
        background: "#0a0a0a",
        minHeight: "100%",
        fontFamily: "'JetBrains Mono', monospace",
        color: "#fff",
        padding: "30px"
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "40px"
    },
    eyebrow: {
        fontSize: "11px",
        color: "#666",
        letterSpacing: "2px",
        fontWeight: "bold",
        marginBottom: "8px"
    },
    title: {
        fontSize: "24px",
        margin: 0,
        fontWeight: "900"
    },
    exportBtn: {
        background: "#fff",
        color: "#000",
        border: "none",
        padding: "10px 20px",
        fontSize: "12px",
        fontWeight: "bold",
        borderRadius: "4px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "8px"
    },
    statsGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "20px",
        marginBottom: "40px"
    },
    statCard: {
        background: "#111",
        border: "1px solid #222",
        padding: "24px",
        borderRadius: "12px",
        display: "flex",
        flexDirection: "column",
        gap: "10px"
    },
    statLabel: {
        fontSize: "10px",
        color: "#666",
        letterSpacing: "1px"
    },
    statValue: {
        fontSize: "20px",
        fontWeight: "bold"
    },
    section: {
        background: "#111",
        border: "1px solid #222",
        borderRadius: "12px",
        marginBottom: "20px",
        overflow: "hidden"
    },
    sectionHeader: {
        padding: "20px",
        borderBottom: "1px solid #222",
        display: "flex",
        alignItems: "center",
        gap: "10px"
    },
    sectionTitle: {
        fontSize: "12px",
        margin: 0,
        letterSpacing: "1px",
        color: "#888"
    },
    chartArea: {
        height: "200px",
        padding: "40px 20px 20px",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        gap: "10px"
    },
    barGroup: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "10px",
        height: "100%"
    },
    bar: {
        width: "100%",
        maxWidth: "50px",
        background: "linear-gradient(to top, #00ff88, #00d1ff)",
        borderRadius: "4px 4px 0 0",
        transition: "height 0.3s"
    },
    barLabel: {
        fontSize: "10px",
        color: "#444"
    },
    tableControls: {
        padding: "20px",
        borderBottom: "1px solid #222"
    },
    searchWrapper: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
        background: "#0a0a0a",
        padding: "10px 16px",
        borderRadius: "6px",
        border: "1px solid #333",
        width: "300px"
    },
    searchInput: {
        background: "transparent",
        border: "none",
        color: "#fff",
        fontSize: "13px",
        width: "100%",
        outline: "none"
    },
    table: {
        width: "100%",
        borderCollapse: "collapse"
    },
    th: {
        textAlign: "left",
        fontSize: "10px",
        color: "#666",
        padding: "15px 20px",
        borderBottom: "1px solid #222",
        textTransform: "uppercase"
    },
    tr: {
        borderBottom: "1px solid #222"
    },
    td: {
        padding: "15px 20px",
        fontSize: "13px"
    },
    statusBadge: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        fontSize: "11px",
        color: "#aaa"
    },
    statusDot: {
        width: "6px",
        height: "6px",
        borderRadius: "50%"
    },
    txLink: {
        color: "#00d1ff",
        textDecoration: "none",
        display: "flex",
        alignItems: "center",
        gap: "4px"
    },
    loading: {
        padding: "60px",
        textAlign: "center",
        color: "#666"
    },
    error: {
        padding: "60px",
        textAlign: "center",
        color: "#ff3333"
    }
}
