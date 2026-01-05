import { google } from "googleapis"
import { oauth2Client } from "./meet"

const calendar = google.calendar({
  version: "v3",
  auth: oauth2Client,
})

export interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
  type: "meeting" | "task" | "reminder"
  description?: string
  participants?: string[]
}

export async function getEvents(): Promise<CalendarEvent[]> {
  const res = await calendar.events.list({
    calendarId: "primary",
    singleEvents: true,
    orderBy: "startTime",
    timeMin: new Date(0).toISOString(),
  })

  return (res.data.items ?? []).map(e => ({
    id: e.id!,
    title: e.summary ?? "Untitled",
    start: e.start?.dateTime ?? e.start?.date!,
    end: e.end?.dateTime ?? e.end?.date!,
    type: "meeting",
    description: e.description,
    participants: e.attendees?.map(a => a.email!) ?? [],
  }))
}

export async function createEvent(evt: any): Promise<CalendarEvent> {
  const res = await calendar.events.insert({
    calendarId: "primary",
    requestBody: {
      summary: evt.title,
      description: evt.description,
      start: { dateTime: evt.start },
      end: { dateTime: evt.end },
      attendees: evt.participants?.map((email: string) => ({ email })),
    },
  })

  const e = res.data

  return {
    id: e.id!,
    title: e.summary!,
    start: e.start!.dateTime!,
    end: e.end!.dateTime!,
    type: "meeting",
    description: e.description,
    participants: e.attendees?.map(a => a.email!) ?? [],
  }
}
