import dotenv from "dotenv"
import { ethers } from "ethers"
import abi from "../config/abi.json"

dotenv.config()

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL)
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider)

const contract = new ethers.Contract(
  process.env.CONTRACT_ADDRESS!,
  abi,
  wallet
)

export async function anchorReceipt(taskId: number, receiptHash: string, ipfsCid: string) {
  const tx = await contract.completeTask(taskId, receiptHash, ipfsCid)
  await tx.wait()
  return tx.hash
}

export async function verifyTaskOffchain(taskId: number, ipfsCid: string) {
  return await contract.verifyTaskOffchain(taskId, ipfsCid)
}
