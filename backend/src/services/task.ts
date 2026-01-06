// Simple in-memory task storage (replace with DB in production)
const tasks: Map<string, any[]> = new Map()

export function createTask(teamId: string, task: any) {
  if (!tasks.has(teamId)) {
    tasks.set(teamId, [])
  }
  const teamTasks = tasks.get(teamId)!
  teamTasks.push(task)
  return task
}

export function getTasks(teamId: string) {
  return tasks.get(teamId) || []
}

export function updateTask(teamId: string, taskId: string, updates: any) {
  const teamTasks = tasks.get(teamId)
  if (!teamTasks) throw new Error("Team not found")

  const taskIndex = teamTasks.findIndex(t => t.id === taskId)
  if (taskIndex === -1) throw new Error("Task not found")

  const task = teamTasks[taskIndex]

  // Prevent claiming already claimed tasks
  if (updates.status === "claimed" && task.status !== "open") {
    throw new Error("Task already claimed")
  }

  // Prevent completing tasks that aren'\''t claimed
  if (updates.status === "completed" && task.status !== "claimed") {
    throw new Error("Task must be claimed before completion")
  }

  // Prevent claiming if someone else already claimed it
  if (updates.status === "claimed" && task.claimedBy && task.claimedBy !== updates.claimedBy) {
    throw new Error("Task claimed by another user")
  }

  if (updates.status === "claimed" && task.status !== "claimed") {
    // If just claimed, set timestamp
    updates.claimedAt = new Date().toISOString()
  }

  if (updates.status === "completed" && task.status !== "completed") {
    // If just completed, set timestamp
    updates.completedAt = new Date().toISOString()
  }

  teamTasks[taskIndex] = { ...teamTasks[taskIndex], ...updates }
  return teamTasks[taskIndex]
}

export function getActiveClaims(teamId: string) {
  const teamTasks = tasks.get(teamId) || []
  return teamTasks
    .filter(t => t.status === "claimed" || t.status === "review" || t.status === "approved")
    .map(t => ({
      taskId: t.id,
      title: t.title,
      claimedBy: t.claimedBy,
      status: t.status
    }))
}
