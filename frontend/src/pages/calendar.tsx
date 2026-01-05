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
            setEvents(list || [])
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
        <div style={styles.container}>
            <div style={styles.header}>
                <div style={styles.headerLeft}>
                    <h2 style={styles.title}>{format(currentDate, 'MMMM yyyy')}</h2>
                    <div style={styles.subtitle}>PROTOCOL V2.1 // ACTIVE</div>
                </div>
                <div style={styles.controls}>
                    <button style={styles.navBtn} onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}>← PREV</button>
                    <button style={styles.navBtn} onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}>NEXT →</button>
                </div>
            </div>

            <div style={styles.grid}>
                {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => (
                    <div key={d} style={styles.dayHeader}>{d}</div>
                ))}

                {days.map((day: Date) => {
                    const isCurrentMonth = day.getMonth() === currentDate.getMonth()
                    return (
                        <div
                            key={day.toString()}
                            style={{
                                ...styles.dayCell,
                                opacity: isCurrentMonth ? 1 : 0.3,
                                background: isCurrentMonth ? "#0a0a0a" : "#050505"
                            }}
                            onClick={() => handleAddEvent(day)}
                        >
                            <div style={styles.dayNumber}>{format(day, 'd')}</div>
                            <div style={styles.eventStack}>
                                {(events || []).filter(e => isSameDay(new Date(e.start), day)).map(e => (
                                    <div key={e.id} style={styles.eventPill}>
                                        <div style={styles.eventDot}></div>
                                        {e.title}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

const styles: any = {
    container: {
        minHeight: "100vh",
        background: "#050505",
        color: "#e0e0e0",
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        display: "flex",
        flexDirection: "column",
        padding: "40px",
        boxSizing: "border-box",
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        marginBottom: "40px",
        borderBottom: "1px solid #1a1a1a",
        paddingBottom: "20px",
    },
    headerLeft: {
        display: "flex",
        flexDirection: "column",
        gap: "4px",
    },
    title: {
        fontSize: "32px",
        fontWeight: "700",
        color: "#fff",
        margin: 0,
        letterSpacing: "-1px",
        textTransform: "uppercase",
    },
    subtitle: {
        fontSize: "12px",
        color: "#00ff88",
        letterSpacing: "1px",
        opacity: 0.8,
        fontWeight: "bold",
    },
    controls: {
        display: "flex",
        gap: "10px",
    },
    navBtn: {
        background: "transparent",
        border: "1px solid #333",
        color: "#fff",
        padding: "8px 16px",
        borderRadius: "4px",
        fontSize: "12px",
        fontWeight: "600",
        cursor: "pointer",
        transition: "all 0.2s",
        fontFamily: "inherit",
    },
    grid: {
        flex: 1,
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gridAutoRows: 'minmax(120px, 1fr)',
        gap: "1px",
        background: "#1a1a1a", // Grid lines color
        border: "1px solid #1a1a1a",
    },
    dayHeader: {
        background: "#080808",
        padding: "15px",
        textAlign: "center",
        color: "#666",
        fontSize: "11px",
        fontWeight: "bold",
        letterSpacing: "1px",
    },
    dayCell: {
        background: "#0a0a0a",
        padding: "12px",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        transition: "background 0.2s",
        ':hover': {
            background: "#111",
        }
    },
    dayNumber: {
        fontSize: "14px",
        color: "#444",
        fontWeight: "600",
    },
    eventStack: {
        display: "flex",
        flexDirection: "column",
        gap: "4px",
    },
    eventPill: {
        background: "rgba(0, 255, 136, 0.1)",
        borderLeft: "2px solid #00ff88",
        color: "#00ff88",
        fontSize: "11px",
        padding: "4px 8px",
        borderRadius: "0 4px 4px 0",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        display: "flex",
        alignItems: "center",
        gap: "6px",
    },
    eventDot: {
        width: "4px",
        height: "4px",
        background: "#00ff88",
        borderRadius: "50%",
        boxShadow: "0 0 4px #00ff88",
    }
}

export default CalendarLayout
