import { google } from "googleapis"

export const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
)

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
})

const calendar = google.calendar({
  version: "v3",
  auth: oauth2Client,
})

export async function createMeet(teamId: string) {
  const event = await calendar.events.insert({
    calendarId: "primary",
    conferenceDataVersion: 1,
    requestBody: {
      summary: `Team ${teamId} Sync`,
      description: "Auto-generated meeting from Taskchain",
      start: {
        dateTime: new Date().toISOString(),
      },
      end: {
        dateTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      },
      conferenceData: {
        createRequest: {
          requestId: `meet-${Date.now()}`,
        },
      },
    },
  })

  const meetLink =
    event.data.conferenceData?.entryPoints?.find(
      (e) => e.entryPointType === "video"
    )?.uri

  if (!meetLink) {
    throw new Error("Failed to generate Google Meet link")
  }

  return meetLink
}
