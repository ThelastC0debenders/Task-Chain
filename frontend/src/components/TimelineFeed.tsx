import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Activity, CheckCircle, Clock, User, FileText } from 'lucide-react';

const API = "/api";

interface TaskEvent {
    id: string;
    taskId: number;
    type: string;
    timestamp: number;
    actor: string;
    details?: any;
    txHash: string;
}

export const TimelineFeed: React.FC = () => {
    const [events, setEvents] = useState<TaskEvent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchActivity();
        const interval = setInterval(fetchActivity, 5000); // Poll every 5s
        return () => clearInterval(interval);
    }, []);

    async function fetchActivity() {
        try {
            const res = await axios.get(`${API}/analytics/activity`);
            setEvents(res.data.activity || []);
        } catch (err) {
            console.error("Failed to fetch activity:", err);
        } finally {
            setLoading(false);
        }
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'CREATED': return <Clock size={16} color="#f9d423" />;
            case 'CLAIMED': return <User size={16} color="#00d1ff" />;
            case 'COMPLETED': return <CheckCircle size={16} color="#00ff88" />;
            default: return <Activity size={16} color="#888" />;
        }
    };

    const getMessage = (e: TaskEvent) => {
        const actor = `${e.actor.slice(0, 6)}...${e.actor.slice(-4)}`;
        switch (e.type) {
            case 'CREATED':
                return <span><strong>{actor}</strong> created Task #{e.taskId}</span>;
            case 'CLAIMED':
                return <span><strong>{actor}</strong> claimed Task #{e.taskId}</span>;
            case 'COMPLETED':
                return <span><strong>{actor}</strong> shipped Task #{e.taskId}</span>;
            default:
                return <span>Activity on Task #{e.taskId}</span>;
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <Activity size={18} color="#00ff88" />
                <h3 style={styles.title}>PROTOCOL ACTIVITY</h3>
            </div>

            <div style={styles.feed}>
                {loading && events.length === 0 && <div style={styles.loading}>Loading feed...</div>}

                {events.map(event => (
                    <div key={event.id} style={styles.item}>
                        <div style={styles.leftCol}>
                            <div style={styles.line} />
                            <div style={styles.iconBox}>
                                {getIcon(event.type)}
                            </div>
                        </div>

                        <div style={styles.content}>
                            <div style={styles.message}>{getMessage(event)}</div>
                            <div style={styles.meta}>
                                <span style={styles.time}>{new Date(event.timestamp).toLocaleTimeString()}</span>
                                <a
                                    href={`https://sepolia.etherscan.io/tx/${event.txHash}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={styles.hash}
                                >
                                    {event.txHash.slice(0, 6)}...
                                </a>
                            </div>

                            {/* Proof Info if Completed */}
                            {event.type === 'COMPLETED' && (
                                <div style={styles.proofBadge}>
                                    <FileText size={10} /> PROOF ANCHORED
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {events.length === 0 && !loading && (
                    <div style={styles.empty}>No activity recorded yet.</div>
                )}
            </div>
        </div>
    );
};

const styles: any = {
    container: {
        background: '#0a0a0a',
        border: '1px solid #222',
        borderRadius: '12px',
        padding: '20px',
        height: '100%',
        fontFamily: "'JetBrains Mono', monospace",
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '20px',
        paddingBottom: '15px',
        borderBottom: '1px solid #222',
    },
    title: {
        margin: 0,
        fontSize: '12px',
        color: '#fff',
        letterSpacing: '2px',
        fontWeight: 'bold',
    },
    feed: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0',
        overflowY: 'auto',
        maxHeight: '400px',
    },
    item: {
        display: 'flex',
        gap: '15px',
        position: 'relative',
        paddingBottom: '20px',
    },
    leftCol: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '24px',
    },
    iconBox: {
        width: '24px',
        height: '24px',
        borderRadius: '50%',
        background: '#111',
        border: '1px solid #333',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
    },
    line: {
        position: 'absolute',
        top: '24px',
        bottom: '-10px',
        left: '11px',
        width: '2px',
        background: '#1a1a1a',
        zIndex: 1,
    },
    content: {
        flex: 1,
        paddingTop: '2px',
    },
    message: {
        fontSize: '13px',
        color: '#ccc',
        marginBottom: '4px',
    },
    meta: {
        display: 'flex',
        gap: '10px',
        fontSize: '11px',
        color: '#666',
        alignItems: 'center',
    },
    time: {},
    hash: {
        color: '#444',
        textDecoration: 'none',
        fontFamily: 'monospace',
        ':hover': { color: '#00ff88' }
    },
    loading: {
        color: '#666',
        fontSize: '12px',
        textAlign: 'center',
        padding: '20px',
    },
    empty: {
        color: '#444',
        fontSize: '12px',
        textAlign: 'center',
        padding: '20px',
        fontStyle: 'italic',
    },
    proofBadge: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '10px',
        background: 'rgba(0, 255, 136, 0.1)',
        color: '#00ff88',
        padding: '2px 6px',
        borderRadius: '4px',
        marginTop: '6px'
    }
};
