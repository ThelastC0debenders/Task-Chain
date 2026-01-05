import axios from 'axios'

const API_BASE = '/api'

export interface ClickUpWorkspace {
  id: string
  name: string
}

export interface ClickUpSpace {
  id: string
  name: string
}

export interface ClickUpList {
  id: string
  name: string
}

export interface ClickUpTask {
  id: string
  name: string
  status: { status: string }
  due_date: string | null
  priority: { priority: string } | null
}

export async function getClickUpAuthUrl(returnUrl?: string): Promise<string> {
  const currentUrl = returnUrl || window.location.href
  const response = await axios.get(`${API_BASE}/clickup/auth`, {
    params: { returnUrl: currentUrl }
  })
  return response.data.authUrl
}

export async function getClickUpWorkspaces(userId: string = 'default_user'): Promise<ClickUpWorkspace[]> {
  const response = await axios.get(`${API_BASE}/clickup/workspaces`, {
    params: { userId }
  })
  return response.data.workspaces
}

export async function getClickUpSpaces(teamId: string, userId: string = 'default_user'): Promise<ClickUpSpace[]> {
  const response = await axios.get(`${API_BASE}/clickup/spaces/${teamId}`, {
    params: { userId }
  })
  return response.data.spaces
}

export async function getClickUpLists(spaceId: string, userId: string = 'default_user'): Promise<ClickUpList[]> {
  const response = await axios.get(`${API_BASE}/clickup/lists/${spaceId}`, {
    params: { userId }
  })
  return response.data.lists
}

export async function getClickUpTasks(listId: string, userId: string = 'default_user'): Promise<ClickUpTask[]> {
  const response = await axios.get(`${API_BASE}/clickup/tasks/${listId}`, {
    params: { userId }
  })
  return response.data.tasks
}

export async function syncTaskToClickUp(
  listId: string,
  blockchainTask: any,
  userId: string = 'default_user'
): Promise<ClickUpTask> {
  const response = await axios.post(
    `${API_BASE}/clickup/sync/${listId}`,
    blockchainTask,
    { params: { userId } }
  )
  return response.data.task
}

export async function createClickUpTask(
  listId: string,
  taskData: {
    name: string
    description?: string
    priority?: number
    due_date?: number
  },
  userId: string = 'default_user'
): Promise<ClickUpTask> {
  const response = await axios.post(
    `${API_BASE}/clickup/tasks/${listId}`,
    taskData,
    { params: { userId } }
  )
  return response.data.task
}

