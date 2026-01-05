import { keccak256, toUtf8Bytes } from "ethers"

export function hashReceipt(data: any): string {
  const canonical = JSON.stringify(data, Object.keys(data).sort())
  return keccak256(toUtf8Bytes(canonical))
}
