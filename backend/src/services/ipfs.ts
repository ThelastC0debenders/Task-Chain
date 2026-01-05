// Mock IPFS for local development
const storage = new Map<string, string>()
let counter = 0

export async function uploadJSON(data: any): Promise<string> {
  const cid = `mock-cid-${counter++}`
  storage.set(cid, JSON.stringify(data))
  console.log(`[Mock IPFS] Uploaded to ${cid}`)
  return cid
}

export async function getJSON(cid: string): Promise<any> {
  const data = storage.get(cid)
  if (!data) throw new Error(`CID ${cid} not found`)
  console.log(`[Mock IPFS] Retrieved ${cid}`)
  return JSON.parse(data)
}
