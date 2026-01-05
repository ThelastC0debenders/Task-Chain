import crypto from "crypto"

const members = new Map<string, Set<string>>()
const INVITE_SECRET = process.env.INVITE_SECRET || ""

function base64url(input: Buffer | string) {
  return (typeof input === "string" ? Buffer.from(input) : input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
}

export function createInvite(teamId: string, ttlSeconds: number) {
  if (!INVITE_SECRET) throw new Error("INVITE_SECRET not set")
  const payload = {
    teamId,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
    nonce: crypto.randomUUID(),
  }
  const payloadStr = JSON.stringify(payload)
  const sig = crypto
    .createHmac("sha256", INVITE_SECRET)
    .update(payloadStr)
    .digest()
  const token = `${base64url(payloadStr)}.${base64url(sig)}`
  return { token, payload }
}

export function acceptInvite(token: string, wallet: string) {
  if (!INVITE_SECRET) throw new Error("INVITE_SECRET not set")
  const parts = token.split(".")
  if (parts.length !== 2) throw new Error("Invalid token")
  const [payloadB64, sigB64] = parts
  const payloadJson = Buffer.from(payloadB64.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8")
  const sig = Buffer.from(sigB64.replace(/-/g, "+").replace(/_/g, "/"), "base64")

  const expectedSig = crypto.createHmac("sha256", INVITE_SECRET).update(payloadJson).digest()
  if (!crypto.timingSafeEqual(sig, expectedSig)) throw new Error("Invalid signature")

  const payload = JSON.parse(payloadJson) as { teamId: string; exp: number; nonce: string }
  if (payload.exp < Math.floor(Date.now() / 1000)) throw new Error("Invite expired")

  const teamKey = payload.teamId
  const set = members.get(teamKey) || new Set<string>()
  set.add(wallet.toLowerCase())
  members.set(teamKey, set)

  return { teamId: payload.teamId }
}

export function listMembers(teamId: string) {
  return Array.from(members.get(teamId) || [])
}
