import { useEffect, useState } from "react"
import * as calendarService from "../services/calendar"
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addMonths, subMonths, isSameMonth, addDays } from "date-fns"
import { ChevronLeft, ChevronRight, Search, Zap, Clock, Calendar as CalendarIcon, AlertCircle } from "lucide-react"
import Navbar from "../components/Navbar"
// import { useTheme } from "../context/ThemeContext"

const CalendarLayout = () => {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [events, setEvents] = useState<any[]>([])
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [isPopupOpen, setIsPopupOpen] = useState(false)
    const [popupEvents, setPopupEvents] = useState<any[]>([])
    const [popupDate, setPopupDate] = useState<Date | null>(null)

    useEffect(() => {
        loadEvents()
    }, [])

    const loadEvents = async () => {
        try {
            const list = await calendarService.getEvents()
            setEvents(list || [])
        } catch (e) { console.error(e) }
    }

    const handleDataNav = (direction: 'prev' | 'next') => {
        setCurrentDate(curr => direction === 'prev' ? subMonths(curr, 1) : addMonths(curr, 1))
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

    // Helpers for sidebar
    const nextMonthDate = addMonths(currentDate, 1)
    const upcomingEvents = events
        .filter(e => new Date(e.start) >= new Date())
        .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
        .slice(0, 3)

    return (
        <div style={styles.container}>
            <Navbar title="Calendar" subtitle="Event Schedule" isConnected={false} />
            <div style={styles.contentWrapper}>
            {/* Main Calendar Section (Left/Center) */}
            <div style={styles.mainSection}>
                {/* Header */}
                <div style={styles.header}>
                    <div>
                        <h1 style={styles.monthTitle}>
                            {format(currentDate, 'MMMM')} <span style={styles.yearHighlight}>{format(currentDate, 'yyyy')}</span>
                        </h1>
                        <div style={styles.subHeader}>
                            // CYCLE 245-B INITIALIZED
                        </div>
                    </div>

                    <div style={styles.controls}>
                        <button onClick={() => handleDataNav('prev')} style={styles.navBtn}>
                            <ChevronLeft size={14} /> PREV
                        </button>
                        <button onClick={() => handleDataNav('next')} style={styles.navBtnFilled}>
                            NEXT <ChevronRight size={14} />
                        </button>

                        <div style={styles.viewToggle}>
                            <div style={styles.viewOptionActive}>Month</div>
                            <div style={styles.viewOption}>Week</div>
                            <div style={styles.viewOption}>Day</div>
                        </div>
                    </div>
                </div>

                {/* Grid */}
                <div style={styles.calendarWrapper}>
                    {/* Day Headers */}
                    <div style={styles.dayHeaders}>
                        {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
                            <div key={day} style={styles.dayHeaderCell}>{day}</div>
                        ))}
                    </div>

                    {/* Calendar Grid */}
                    <div style={styles.grid}>
                        {days.map((day) => {
                            const isCurrent = isSameMonth(day, currentDate)
                            const dayEvents = events.filter(e => isSameDay(new Date(e.start), day))

                            return (
                                <div
                                    key={day.toString()}
                                    onClick={() => handleAddEvent(day)}
                                    style={{
                                        ...styles.dayCell,
                                        backgroundColor: isCurrent ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                                        opacity: isCurrent ? 1 : 0.4
                                    }}
                                >
                                    <div style={styles.dayNumber}>{format(day, 'd')}</div>
                                    <div style={styles.eventStack}>
                                        {dayEvents.slice(0, dayEvents.length > 3 ? 2 : 3).map((ev, i) => (
                                            <div key={i} style={styles.eventPill}>
                                                <div style={styles.eventDot}></div>
                                                {ev.title}
                                            </div>
                                        ))}
                                        {dayEvents.length > 3 && (
                                            <div 
                                                style={styles.moreEventsBtn}
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setPopupEvents(dayEvents)
                                                    setPopupDate(day)
                                                    setIsPopupOpen(true)
                                                }}
                                            >
                                                + {dayEvents.length - 2} more
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Sidebar (Right) */}
            <div style={styles.sidebar}>
                {/* Search */}
                <div style={styles.searchBox}>
                    <Search size={14} color="var(--text-secondary)" />
                    <input style={styles.searchInput} placeholder="Search events..." />
                </div>

                {/* Mini Calendar (Next Month) */}
                <div style={styles.miniCalendar}>
                    <div style={styles.miniHeader}>
                        {format(nextMonthDate, 'MMMM yyyy')} <span style={styles.miniTag}>Next</span>
                    </div>
                    <div style={styles.miniGrid}>
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <div key={d} style={styles.miniDayHead}>{d}</div>)}
                        {eachDayOfInterval({
                            start: startOfWeek(startOfMonth(nextMonthDate)),
                            end: endOfWeek(endOfMonth(nextMonthDate))
                        }).map(d => (
                            <div key={d.toISOString()} style={{
                                ...styles.miniDay,
                                opacity: isSameMonth(d, nextMonthDate) ? 1 : 0.2,
                                color: isSameDay(d, addDays(new Date(), 3)) ? 'var(--accent-primary)' : 'var(--text-tertiary)', // Mock highlight
                                background: isSameDay(d, addDays(new Date(), 3)) ? 'rgba(0,255,136,0.1)' : 'transparent'
                            }}>
                                {format(d, 'd')}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Upcoming Events */}
                <div style={styles.upcomingSection}>
                    <div style={styles.sectionTitle}>UPCOMING</div>

                    {upcomingEvents.length > 0 ? upcomingEvents.map(ev => (
                        <div key={ev.id} style={styles.upcomingItem}>
                            <div style={styles.dateBox}>
                                <div style={styles.dateMonth}>{format(new Date(ev.start), 'MMM')}</div>
                                <div style={styles.dateDay}>{format(new Date(ev.start), 'dd')}</div>
                            </div>
                            <div>
                                <div style={styles.upcomingTitle}>{ev.title}</div>
                                <div style={styles.upcomingTime}>
                                    {format(new Date(ev.start), 'hh:mm a')} - {format(new Date(ev.end), 'hh:mm a')}
                                </div>
                                <div style={styles.upcomingMeta}>
                                    <div style={styles.metaIcon}><div style={styles.circle}></div></div>
                                    <div style={styles.metaIcon}><div style={{ ...styles.circle, opacity: 0.5 }}></div></div>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div style={styles.emptyState}>No upcoming events</div>
                    )}

                    {/* Hardcoded Mainnet Deploy for Visual Match */}
                    <div style={styles.upcomingItem}>
                        <div style={styles.dateBox}>
                            <div style={styles.dateMonth}>JAN</div>
                            <div style={styles.dateDay}>20</div>
                        </div>
                        <div>
                            <div style={styles.upcomingTitle}>Mainnet Deploy</div>
                            <div style={styles.upcomingTime}>02:00 PM - 06:00 PM</div>
                            <div style={styles.criticalBadge}>CRITICAL</div>
                        </div>
                    </div>
                </div>
            </div>
            </div>
            
            <div style={styles.footer}>
                <div>SYSTEM STATUS: <span style={styles.statusOk}>OPTIMAL</span></div>
                <div>TASKCHAIN © 2026 // ALL RIGHTS RESERVED</div>
                <div>MEM: 45% NET: 1.2GB/s</div>
            </div>

            {/* Event Popup Modal */}
            {isPopupOpen && (
                <div style={styles.popupOverlay} onClick={() => setIsPopupOpen(false)}>
                    <div style={styles.popupCard} onClick={e => e.stopPropagation()}>
                        <div style={styles.popupHeader}>
                            <h2 style={styles.popupTitle}>
                                Events for {popupDate ? format(popupDate, 'MMMM do, yyyy') : ''}
                            </h2>
                            <button onClick={() => setIsPopupOpen(false)} style={styles.popupCloseBtn}>✕</button>
                        </div>
                        <div style={styles.popupList}>
                            {popupEvents.map((ev, i) => (
                                <div key={i} style={styles.popupEventItem}>
                                    <div style={styles.eventDotLarge}></div>
                                    <div>
                                        <div style={styles.popupEventTitle}>{ev.title}</div>
                                        <div style={styles.popupEventTime}>
                                            {format(new Date(ev.start), 'hh:mm a')} - {format(new Date(ev.end), 'hh:mm a')}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

const styles: any = {
    container: {
        minHeight: '100vh',
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        fontFamily: "'JetBrains Mono', monospace",
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'background 0.3s, color 0.3s',
    },
    contentWrapper: {
        display: 'flex',
        flex: 1,
        overflow: 'hidden',
    },
    mainSection: {
        flex: 1,
        padding: '30px',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid var(--border-color)',
    },
    sidebar: {
        width: '320px',
        padding: '30px',
        background: 'var(--bg-secondary)',
        display: 'flex',
        flexDirection: 'column',
        gap: '40px',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: '30px',
    },
    monthTitle: {
        fontSize: '48px',
        fontWeight: '800',
        margin: 0,
        color: 'var(--text-primary)',
        letterSpacing: '-2px',
        lineHeight: 1,
        textTransform: 'uppercase',
    },
    yearHighlight: {
        color: 'var(--accent-primary)',
    },
    subHeader: {
        color: '#2a9d8f', // A darker green/teal
        fontSize: '12px',
        fontWeight: 'bold',
        marginTop: '8px',
        letterSpacing: '1px',
    },
    controls: {
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
    },
    navBtn: {
        background: 'transparent',
        border: '1px solid var(--border-color)',
        color: 'var(--accent-primary)',
        padding: '8px 16px',
        borderRadius: '4px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '11px',
        fontWeight: 'bold',
        letterSpacing: '1px',
    },
    navBtnFilled: {
        background: 'var(--accent-primary)',
        border: 'none',
        color: 'var(--text-on-accent)',
        padding: '8px 16px',
        borderRadius: '4px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '11px',
        fontWeight: 'bold',
        letterSpacing: '1px',
    },
    viewToggle: {
        display: 'flex',
        background: 'var(--bg-secondary)',
        borderRadius: '4px',
        overflow: 'hidden',
        border: '1px solid var(--border-color)',
    },
    viewOption: {
        padding: '8px 16px',
        fontSize: '11px',
        color: 'var(--text-secondary)',
        cursor: 'pointer',
    },
    viewOptionActive: {
        padding: '8px 16px',
        fontSize: '11px',
        background: 'var(--border-color)',
        color: 'var(--accent-primary)',
        cursor: 'pointer',
    },
    calendarWrapper: {
        flex: 1,
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
    },
    dayHeaders: {
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        borderBottom: '1px solid var(--border-color)',
    },
    dayHeaderCell: {
        padding: '15px',
        textAlign: 'left',
        fontSize: '11px',
        color: 'var(--accent-primary)',
        fontWeight: 'bold',
        background: 'var(--bg-tertiary)',
        borderRight: '1px solid var(--border-color)',
    },
    grid: {
        flex: 1,
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gridAutoRows: '1fr',
    },
    dayCell: {
        borderRight: '1px solid var(--border-color)',
        borderBottom: '1px solid var(--border-color)',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        cursor: 'pointer',
        transition: 'background 0.2s',
        minHeight: '120px',
    },
    dayNumber: {
        fontSize: '14px',
        fontWeight: '600',
        color: 'var(--text-secondary)',
    },
    eventStack: {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
    },
    eventPill: {
        background: 'rgba(0, 255, 136, 0.1)',
        borderLeft: '2px solid var(--accent-primary)',
        padding: '4px 8px',
        fontSize: '10px',
        color: 'var(--accent-primary)',
        borderRadius: '0 2px 2px 0',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    eventDot: {
        width: '4px',
        height: '4px',
        background: 'var(--accent-primary)',
        borderRadius: '50%',
        boxShadow: '0 0 5px var(--accent-primary)',
    },
    searchBox: {
        display: 'flex',
        alignItems: 'center',
        background: 'var(--bg-tertiary)',
        border: '1px solid var(--border-color)',
        borderRadius: '6px',
        padding: '10px',
        gap: '10px',
    },
    searchInput: {
        background: 'transparent',
        border: 'none',
        color: 'var(--text-primary)',
        fontSize: '13px',
        fontFamily: 'inherit',
        outline: 'none',
        width: '100%',
    },
    miniCalendar: {
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
    },
    miniHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '14px',
        fontWeight: 'bold',
        color: 'var(--text-primary)',
    },
    miniTag: {
        background: 'rgba(0, 255, 136, 0.1)',
        color: 'var(--accent-primary)',
        fontSize: '10px',
        padding: '2px 6px',
        borderRadius: '4px',
    },
    miniGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '6px',
        textAlign: 'center',
    },
    miniDayHead: {
        fontSize: '10px',
        color: 'var(--text-secondary)',
        marginBottom: '4px',
    },
    miniDay: {
        fontSize: '11px',
        padding: '4px',
        borderRadius: '4px',
        cursor: 'default',
    },
    upcomingSection: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
    },
    sectionTitle: {
        fontSize: '12px',
        color: 'var(--text-secondary)',
        letterSpacing: '1px',
        fontWeight: 'bold',
    },
    upcomingItem: {
        display: 'flex',
        gap: '15px',
    },
    dateBox: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    },
    dateMonth: {
        fontSize: '10px',
        color: 'var(--accent-primary)',
        fontWeight: 'bold',
    },
    dateDay: {
        fontSize: '18px',
        fontWeight: '700',
        color: 'var(--text-primary)',
    },
    upcomingTitle: {
        fontSize: '14px',
        fontWeight: '600',
        color: 'var(--text-primary)',
        marginBottom: '4px',
    },
    upcomingTime: {
        fontSize: '11px',
        color: 'var(--text-secondary)',
        marginBottom: '8px',
    },
    upcomingMeta: {
        display: 'flex',
        gap: '4px',
    },
    circle: {
        width: '10px',
        height: '10px',
        background: 'var(--border-color)',
        borderRadius: '50%',
    },
    criticalBadge: {
        background: '#2a0e0e',
        color: '#ff4444',
        fontSize: '9px',
        padding: '2px 6px',
        borderRadius: '2px',
        display: 'inline-block',
        border: '1px solid #4a1e1e',
    },
    emptyState: {
        fontSize: '12px',
        color: 'var(--text-tertiary)',
        fontStyle: 'italic',
    },
    footer: {
        height: '30px',
        borderTop: '1px solid var(--border-color)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 30px',
        fontSize: '10px',
        color: 'var(--text-secondary)',
        background: 'var(--bg-primary)',
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 10,
    },
    statusOk: {
        color: 'var(--accent-primary)',
        fontWeight: 'bold',
    },
    moreEventsBtn: {
        fontSize: '10px',
        color: 'var(--text-secondary)',
        fontWeight: 'bold',
        padding: '2px 4px',
        cursor: 'pointer',
        marginTop: '2px',
        background: 'rgba(0, 0, 0, 0.05)',
        borderRadius: '2px',
        textAlign: 'center',
    },
    popupOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(8px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    popupCard: {
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        padding: '24px',
        width: '400px',
        maxHeight: '80vh',
        overflowY: 'auto',
        boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
    },
    popupHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '15px',
    },
    popupTitle: {
        fontSize: '18px',
        fontWeight: 'bold',
        color: 'var(--text-primary)',
        margin: 0,
    },
    popupCloseBtn: {
        background: 'none',
        border: 'none',
        color: 'var(--text-secondary)',
        fontSize: '20px',
        cursor: 'pointer',
    },
    popupList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
    },
    popupEventItem: {
        background: 'var(--bg-tertiary)',
        padding: '12px',
        borderRadius: '8px',
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
        border: '1px solid var(--border-color)',
    },
    eventDotLarge: {
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        background: 'var(--accent-primary)',
        boxShadow: '0 0 8px var(--accent-primary)',
    },
    popupEventTitle: {
        fontSize: '14px',
        fontWeight: 'bold',
        color: 'var(--text-primary)',
    },
    popupEventTime: {
        fontSize: '12px',
        color: 'var(--text-secondary)',
        marginTop: '2px',
    }
}

export default CalendarLayout
