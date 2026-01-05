interface CalendarEvent {
    id: string
    title: string
    start: string // ISO date string
    end: string
    type: 'meeting' | 'task' | 'reminder'
    description?: string
    participants?: string[]
}

const events: CalendarEvent[] = []

// Seed some events
const today = new Date().toISOString().split('T')[0]
events.push({
    id: 'ev1',
    title: 'Daily Standup',
    start: `${today}T09:00:00`,
    end: `${today}T09:15:00`,
    type: 'meeting',
    description: 'Team sync'
})

export function getEvents() {
    return events
}

export function createEvent(evt: any) {
    const newEvent: CalendarEvent = {
        id: Date.now().toString(36),
        ...evt
    }
    events.push(newEvent)
    return newEvent
}
