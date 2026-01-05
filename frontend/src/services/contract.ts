import { ethers } from "ethers"
import { CONTRACT_ADDRESS } from "../config/contract"
import TaskChainArtifact from "../config/taskchain-abi.json"
import { connectWallet } from "./wallet"

export interface OnChainTask {
  id: bigint
  creator: string
  executor: string
  metadataHash: string
  category: string
  deadline: bigint
  gracePeriod: bigint
  priority: number
  commitment: number
  status: number
  claimedAt: bigint
  completedAt: bigint
  receiptHash: string
  ipfsCid: string
}

export async function getContract() {
  const { signer } = await connectWallet()
  return new ethers.Contract(CONTRACT_ADDRESS, (TaskChainArtifact as any).abi, signer)
}

export async function createTaskOnChain(
  metadataHash: string,
  category: string,
  deadline: number,
  gracePeriod: number,
  priority: number
) {
  const contract = await getContract()
  const tx = await contract.createTask(metadataHash, category, deadline, gracePeriod, priority)
  const receipt = await tx.wait()
  
  const event = receipt.logs.find((log: any) => {
    try {
      return contract.interface.parseLog(log)?.name === "TaskCreated"
    } catch {
      return false
    }
  })
  
  if (event) {
    const parsed = contract.interface.parseLog(event)
    return Number(parsed?.args[0])
  }
  
  throw new Error("TaskCreated event not found")
}

export async function claimTaskOnChain(taskId: number, commitment: number) {
  const contract = await getContract()
  const tx = await contract.claimTask(taskId, commitment)
  await tx.wait()
}

export async function completeTaskOnChain(taskId: number, receiptHash: string, ipfsCid: string) {
  const contract = await getContract()
  const tx = await contract.completeTask(taskId, receiptHash, ipfsCid)
  await tx.wait()
}

export async function getTaskFromChain(taskId: number): Promise<OnChainTask> {
  const contract = await getContract()
  return await contract.getTask(taskId)
}

export async function getUserTasks(address: string): Promise<number[]> {
  const contract = await getContract()
  const taskIds = await contract.getUserTasks(address)
  return taskIds.map((id: bigint) => Number(id))
}

export async function getTotalTasks(): Promise<number> {
  const contract = await getContract()
  const total = await contract.totalTasks()
  return Number(total)
}

export function listenToTaskEvents(
  onTaskCreated?: (taskId: number, creator: string, category: string, priority: number) => void,
  onTaskClaimed?: (taskId: number, executor: string, commitment: number) => void,
  onTaskCompleted?: (taskId: number, executor: string, creator: string) => void
) {
  ;(async () => {
    const contract = await getContract()
    
    if (onTaskCreated) {
      contract.on("TaskCreated", (taskId, creator, category, priority) => {
        onTaskCreated(Number(taskId), creator, category, priority)
      })
    }
    
    if (onTaskClaimed) {
      contract.on("TaskClaimed", (taskId, executor, commitment) => {
        onTaskClaimed(Number(taskId), executor, commitment)
      })
    }
    
    if (onTaskCompleted) {
      contract.on("TaskCompleted", (taskId, executor, creator) => {
        onTaskCompleted(Number(taskId), executor, creator)
      })
    }
  })()
}

// Legacy exports for compatibility
export async function getTask(contract: ethers.Contract, taskId: number): Promise<OnChainTask> {
  return await contract.getTask(taskId)
}

export async function completeTask(contract: ethers.Contract, taskId: number, receiptHash?: string, ipfsCid?: string) {
  const hash = receiptHash || "0x" + Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0')).join('')
  const cid = ipfsCid || "QmExample" + Date.now()
  
  const tx = await contract.completeTask(taskId, hash, cid)
  await tx.wait()
}

