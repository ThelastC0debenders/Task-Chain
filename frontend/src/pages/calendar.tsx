import { useEffect, useState } from "react"
import * as calendarService from "../services/calendar"
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from "date-fns"

const CalendarLayout = () => {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [events, setEvents] = useState<any[]>([])

    useEffect(() => {
        loadEvents()
    }, [])

    const loadEvents = async () => {
        try {
            const list = await calendarService.getEvents()
            setEvents(list)
        } catch (e) { console.error(e) }
    }

    const handleAddEvent = async (date: Date) => {
        const title = prompt("Event Title:")
        if (title) {
            await calendarService.createEvent({
                title,
                start: date.toISOString(),
                end: date.toISOString(),
                type: 'meeting'
            })
            loadEvents()
        }
    }

    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart)
    const endDate = endOfWeek(monthEnd)
    const days = eachDayOfInterval({ start: startDate, end: endDate })

    return (
        <div style={{ height: '100vh', backgroundColor: '#1e1e1e', color: 'white', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>{format(currentDate, 'MMMM yyyy')}</h2>
                <div>
                    <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}>Prev</button>
                    <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} style={{ marginLeft: 10 }}>Next</button>
                </div>
            </div>

            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: '1fr' }}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <div key={d} style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid #333', color: '#888' }}>{d}</div>
                ))}

                {days.map((day: Date) => (
                    <div
                        key={day.toString()}
                        style={{
                            borderRight: '1px solid #333',
                            borderBottom: '1px solid #333',
                            padding: '10px',
                            backgroundColor: day.getMonth() !== currentDate.getMonth() ? '#252525' : 'transparent',
                            cursor: 'pointer'
                        }}
                        onClick={() => handleAddEvent(day)}
                    >
                        <div style={{ marginBottom: '5px', opacity: 0.7 }}>{format(day, 'd')}</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            {events.filter(e => isSameDay(new Date(e.start), day)).map(e => (
                                <div key={e.id} style={{ backgroundColor: '#007bff', fontSize: '0.7em', padding: '2px 4px', borderRadius: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {e.title}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default CalendarLayout
