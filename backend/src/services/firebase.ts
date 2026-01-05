import { initializeApp, cert } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"

const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  }),
})

const db = getFirestore(app)

export async function publishCallState(
  teamId: string,
  payload: {
    status: "requested" | "active" | "ended"
    requestedBy: string
    meetLink: string
    createdAt: number
    expiresAt: number
  }
) {
  await db
    .collection("teams")
    .doc(teamId)
    .collection("meta")
    .doc("call")
    .set(payload)
}
