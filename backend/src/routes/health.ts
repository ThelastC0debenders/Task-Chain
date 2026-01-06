import { Router } from "express"
import { getTasks } from "../services/task"

const router = Router()

interface HealthMetrics {
    totalTasks: number
    completedTasks: number
    avgCompletionTimeHours: number
    burnoutRiskUsers: string[]
    topPerformers: { user: string, score: number }[]
    statusBreakdown: { name: string, value: number }[]
    workloadDistribution: { name: string, value: number }[]
    screenTime: { user: string, hours: number }[]
    trends: { day: string, completed: number, added: number }[]
    categories: { subject: string, A: number, fullMark: number }[]
}

router.get("/team/:teamId", (req, res) => {
    try {
        const { teamId } = req.params
        const tasks = getTasks(teamId) || []

        // 1. Basic Counts
        const totalTasks = tasks.length
        const completedTasks = tasks.filter(t => t.status === 'completed').length

        // 2. Efficiency (Avg Completion Time)
        let totalTimeMs = 0
        let timeCount = 0

        // 3. User Stats Accumulators
        const userStats: Record<string, {
            tasksCompleted: number,
            tasksClaimed: number,
            totalTimeMs: number,
            lastActive: number,
            lateNightWork: number // Tasks completed after 8 PM
        }> = {}

        tasks.forEach(t => {
            const user = t.claimedBy || "Unassigned"
            if (!userStats[user]) {
                userStats[user] = { tasksCompleted: 0, tasksClaimed: 0, totalTimeMs: 0, lastActive: 0, lateNightWork: 0 }
            }

            // Workload
            userStats[user].tasksClaimed++

            // Completion Metrics
            if (t.status === 'completed' && t.claimedAt && t.completedAt) {
                const claimed = new Date(t.claimedAt).getTime()
                const completed = new Date(t.completedAt).getTime()
                const duration = completed - claimed

                totalTimeMs += duration
                timeCount++

                userStats[user].tasksCompleted++
                userStats[user].totalTimeMs += duration

                // Wellbeing: Late Night Check (After 8 PM)
                const hour = new Date(t.completedAt).getHours()
                if (hour >= 20 || hour < 5) {
                    userStats[user].lateNightWork++
                }
            }
        })

        const avgCompletionTimeHours = timeCount > 0 ? (totalTimeMs / timeCount) / (1000 * 60 * 60) : 0

        // 4. Construct Charts Data
        const statusBreakdown = [
            { name: "Open", value: tasks.filter(t => t.status === 'open').length },
            { name: "Claimed", value: tasks.filter(t => t.status === 'claimed').length },
            { name: "Completed", value: completedTasks }
        ]

        const workloadDistribution = Object.keys(userStats)
            .filter(u => u !== "Unassigned")
            .map(user => ({
                name: user,
                value: userStats[user].tasksClaimed
            }))

        // 5. Power Score & Burnout & Screen Time
        const topPerformers: { user: string, score: number }[] = []
        const burnoutRiskUsers: string[] = []
        const screenTime: { user: string, hours: number }[] = []

        Object.keys(userStats).forEach(user => {
            if (user === "Unassigned") return

            const stats = userStats[user]

            // Power Score: 10 pts per task, bonus for speed (mock simple calc)
            // In real app, compare vs avg
            const score = (stats.tasksCompleted * 10) + (stats.tasksClaimed * 2)
            topPerformers.push({ user, score })

            // Burnout: > 2 late night tasks
            if (stats.lateNightWork > 2) {
                burnoutRiskUsers.push(user)
            }

            // Screen Time (Mock calculation based on task load)
            // Assumption: 1 task = 2 hours of screen time approx
            screenTime.push({
                user,
                hours: stats.tasksClaimed * 2.5
            })
        })

        topPerformers.sort((a, b) => b.score - a.score)

        console.log("Calculated Health Metrics:", { totalTasks, completedTasks })

        // 6. Trends (Activity Pulse - Last 7 Days)
        const trends = []
        for (let i = 6; i >= 0; i--) {
            const d = new Date()
            d.setDate(d.getDate() - i)
            const dateStr = d.toISOString().split('T')[0]
            const dayName = d.toLocaleDateString('en-US', { weekday: 'short' })

            // Count tasks completed/created on this day
            const completedCount = tasks.filter(t => t.completedAt && new Date(t.completedAt).toISOString().startsWith(dateStr)).length
            // Approx creation date (using ID timestamp if available, fallback to now)
            const addedCount = tasks.filter(t => {
                const created = new Date(Number(t.id)) // Assuming ID is timestamp
                return !isNaN(created.getTime()) && created.toISOString().startsWith(dateStr)
            }).length

            trends.push({ day: dayName, completed: completedCount, added: addedCount })
        }

        // 7. Categories (Skill Matrix)
        const categoryCounts: Record<string, number> = {}
        const totalCatTasks = tasks.length
        tasks.forEach(t => {
            const cat = t.category || "Uncategorized" // If category missing
            categoryCounts[cat] = (categoryCounts[cat] || 0) + 1
        })

        const categories = Object.keys(categoryCounts).map(cat => ({
            subject: cat,
            A: categoryCounts[cat] * 10, // Scale for radar chart (mock scaling)
            fullMark: 150
        }))

        // Ensure at least some default categories if empty
        if (categories.length === 0) {
            categories.push(
                { subject: 'Features', A: 0, fullMark: 150 },
                { subject: 'Bugs', A: 0, fullMark: 150 }
            )
        }

        const response: HealthMetrics = {
            totalTasks,
            completedTasks,
            avgCompletionTimeHours,
            burnoutRiskUsers,
            topPerformers,
            statusBreakdown,
            workloadDistribution,
            screenTime,
            trends,
            categories
        }

        res.json(response)

    } catch (e: any) {
        console.error("Health API Error", e)
        res.status(500).json({ error: e.message })
    }
})

export default router
