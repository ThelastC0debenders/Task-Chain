import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Activity, Clock, Zap, AlertTriangle } from 'lucide-react'

// Theme Colors
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8']
const MOCK_TEAM_ID = "1" // Matching existing hardcoded teamId

interface HealthMetrics {
    totalTasks: number
    completedTasks: number
    avgCompletionTimeHours: number
    burnoutRiskUsers: string[]
    topPerformers: { user: string, score: number }[]
    statusBreakdown: { name: string, value: number }[]
    workloadDistribution: { name: string, value: number }[]
    screenTime: { user: string, hours: number }[]
}

const HealthDashboard = () => {
    const [metrics, setMetrics] = useState<HealthMetrics | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchMetrics()
        const interval = setInterval(fetchMetrics, 5000) // Poll every 5s
        return () => clearInterval(interval)
    }, [])

    const fetchMetrics = async () => {
        try {
            const res = await axios.get(`/api/health/team/${MOCK_TEAM_ID}`)
            setMetrics(res.data)
            setLoading(false)
        } catch (e) {
            console.error("Failed to fetch health metrics", e)
            setLoading(false)
        }
    }

    if (loading) return <div style={{ color: 'white', padding: 20 }}>Initializing Biometrics...</div>
    if (!metrics) return <div style={{ color: 'white', padding: 20 }}>No Data Available</div>

    return (
        <div style={{
            minHeight: '100vh',
            background: '#0d1117',
            color: '#c9d1d9',
            fontFamily: 'monospace',
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 24
        }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #30363d', paddingBottom: 16 }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: 24, color: '#00ff88', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Activity /> TEAM HEALTH PROTOCOL
                    </h1>
                    <span style={{ fontSize: 12, color: '#8b949e' }}>REAL-TIME PERFORMANCE & WELLBEING ANALYTICS</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 32, fontWeight: 'bold' }}>{metrics.totalTasks}</div>
                    <div style={{ fontSize: 12, color: '#8b949e' }}>TOTAL OPERAIONS</div>
                </div>
            </div>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 24 }}>
                <KpiCard icon={Clock} title="AVG VELOCITY" value={`${metrics.avgCompletionTimeHours.toFixed(1)}h`} sub="Completion Time" color="#00C49F" />
                <KpiCard icon={Zap} title="EFFICIENCY" value={`${((metrics.completedTasks / (metrics.totalTasks || 1)) * 100).toFixed(0)}%`} sub="Completion Rate" color="#FFBB28" />
                <KpiCard
                    icon={AlertTriangle}
                    title="BURNOUT RISK"
                    value={metrics.burnoutRiskUsers.length.toString()}
                    sub={metrics.burnoutRiskUsers.length > 0 ? "Users at Risk!" : "Stable"}
                    color={metrics.burnoutRiskUsers.length > 0 ? "#FF8042" : "#0088FE"}
                    isAlert={metrics.burnoutRiskUsers.length > 0}
                />
            </div>

            {/* Charts Row 1 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                {/* Workload Distribution */}
                <ChartContainer title="WORKLOAD DISTRIBUTION">
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={metrics.workloadDistribution}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                fill="#8884d8"
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {metrics.workloadDistribution.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ background: '#161b22', border: '1px solid #30363d' }} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartContainer>

                {/* Status Breakdown */}
                <ChartContainer title="TASK STATUS">
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={metrics.statusBreakdown}>
                            <XAxis dataKey="name" stroke="#8b949e" />
                            <YAxis stroke="#8b949e" />
                            <Tooltip contentStyle={{ background: '#161b22', border: '1px solid #30363d' }} />
                            <Bar dataKey="value" fill="#00ff88" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </div>

            {/* Charts Row 2: Wellbeing */}
            <ChartContainer title="DIGITAL WELLBEING (ESTIMATED SCREEN TIME)">
                <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={metrics.screenTime} layout="vertical">
                        <XAxis type="number" stroke="#8b949e" />
                        <YAxis dataKey="user" type="category" stroke="#8b949e" width={100} />
                        <Tooltip contentStyle={{ background: '#161b22', border: '1px solid #30363d' }} />
                        <Bar dataKey="hours" fill="#8884d8" radius={[0, 4, 4, 0]}>
                            {metrics.screenTime.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={metrics.burnoutRiskUsers.includes(entry.user) ? '#FF8042' : '#8884d8'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </ChartContainer>

            {/* Top Performers */}
            <div style={{ background: '#161b22', padding: 20, borderRadius: 8, border: '1px solid #30363d' }}>
                <h3 style={{ margin: '0 0 16px', color: '#8b949e', fontSize: 14 }}>TOP PERFORMERS (POWER SCORE) 🏆</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {metrics.topPerformers.map((p, i) => (
                        <div key={p.user} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: 4 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <span style={{ fontWeight: 'bold', color: i === 0 ? '#FFBB28' : '#c9d1d9' }}>#{i + 1}</span>
                                <span>{p.user}</span>
                            </div>
                            <div style={{ fontWeight: 'bold', color: '#00ff88' }}>{p.score} pts</div>
                        </div>
                    ))}
                    {metrics.topPerformers.length === 0 && <div style={{ color: '#8b949e', fontStyle: 'italic' }}>No data yet</div>}
                </div>
            </div>

        </div>
    )
}

// Helpers
const KpiCard = ({ icon: Icon, title, value, sub, color, isAlert }: any) => (
    <div style={{
        background: '#161b22',
        padding: 20,
        borderRadius: 8,
        border: isAlert ? `1px solid ${color}` : '1px solid #30363d',
        display: 'flex',
        flexDirection: 'column',
        gap: 8
    }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#8b949e', fontSize: 12 }}>
            {title}
            <Icon size={16} color={color} />
        </div>
        <div style={{ fontSize: 24, fontWeight: 'bold', color: isAlert ? color : '#c9d1d9' }}>{value}</div>
        <div style={{ fontSize: 12, color: isAlert ? color : '#8b949e' }}>{sub}</div>
    </div>
)

const ChartContainer = ({ title, children }: any) => (
    <div style={{ background: '#161b22', padding: 20, borderRadius: 8, border: '1px solid #30363d' }}>
        <h3 style={{ margin: '0 0 16px', color: '#8b949e', fontSize: 14 }}>{title}</h3>
        {children}
    </div>
)

export default HealthDashboard
