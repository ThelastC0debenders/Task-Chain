
import { useEffect, useState, useRef } from "react"
import { socket } from "../services/socket"
import * as chatService from "../services/messaging"
import {
    Hash,
    Plus,
    Send,
    Smile,
    Code,
    Bot,
    Terminal,
    Cpu,
    Search,
    Bell
} from "lucide-react"

interface Channel {
    id: string
    name: string
    type: string
}

interface Message {
    id: string
    channelId: string
    senderId: string
    content: string
    timestamp: number
}

const ChatLayout = () => {
    const [channels, setChannels] = useState<Channel[]>([])
    const [activeChannel, setActiveChannel] = useState<string | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState("")
    const [userId] = useState(() => {
        const stored = localStorage.getItem("chat_user_id")
        if (stored) return stored
        const newId = "user-" + Math.floor(Math.random() * 1000)
        localStorage.setItem("chat_user_id", newId)
        return newId
    })
    const messagesEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        loadChannels()

        socket.on("receive_message", (msg: Message) => {
            // Check if message is already there to avoid duplicates if API also adds it on load (rare race condition)
            setMessages(prev => {
                if (prev.some(p => p.id === msg.id)) return prev
                return [...prev, msg]
            })
            scrollToBottom()
        })

        return () => {
            socket.off("receive_message")
        }
    }, [activeChannel])

    useEffect(() => {
        if (activeChannel) {
            loadMessages(activeChannel)
            socket.emit("join_channel", activeChannel)
        }
        return () => {
            if (activeChannel) socket.emit("leave_channel", activeChannel)
        }
    }, [activeChannel])

    const loadChannels = async () => {
        try {
            const list = await chatService.getChannels(userId)
            setChannels(list)
            if (list.length > 0 && !activeChannel) setActiveChannel(list[0].id)
        } catch (e) {
            console.error(e)
        }
    }

    const loadMessages = async (channelId: string) => {
        try {
            const list = await chatService.getMessages(channelId)
            setMessages(list)
            scrollToBottom()
        } catch (e) {
            console.error(e)
        }
    }

    const handleSend = async () => {
        if (!input.trim() || !activeChannel) return

        const tempId = Date.now().toString()
        const msgPayload: Message = {
            id: tempId,
            channelId: activeChannel,
            senderId: userId,
            content: input,
            timestamp: Date.now()
        }

        try {
            // 1. Emit to Socket (Real-time)
            socket.emit("send_message", msgPayload)

            // 2. Clear Input
            setInput("")

            // 3. Persist via API (Background)
            await chatService.sendMessage(activeChannel, userId, input)
        } catch (e) {
            console.error("Failed to send", e)
        }
    }

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    const createNewChannel = async () => {
        const name = prompt("Channel Name:")
        if (name) {
            await chatService.createChannel(name, 'public', [userId])
            loadChannels()
        }
    }

    return (
        <div style={styles.container}>
            {/* Sidebar */}
            <div style={styles.sidebar}>
                <div style={styles.workspaceHeader}>
                    <div style={styles.workspaceIcon}>
                        <Cpu size={24} color="var(--accent-primary)" />
                    </div>
                    <div>
                        <div style={styles.workspaceName}>Taskchain Workspace</div>
                        <div style={styles.teamName}>Team: team-123</div>
                    </div>
                </div>

                <div style={styles.statusIndicator}>
                    <div style={styles.onlineDot}></div>
                    SYSTEM ONLINE
                </div>

                <div style={styles.channelList}>
                    <div style={styles.sectionTitle}>CHANNEL LIST</div>

                    {channels.map(ch => (
                        <div
                            key={ch.id}
                            onClick={() => setActiveChannel(ch.id)}
                            style={{
                                ...styles.channelItem,
                                ...(activeChannel === ch.id ? styles.channelActive : {})
                            }}
                        >
                            <Hash size={14} style={{ opacity: 0.5 }} />
                            {ch.name}
                            {activeChannel === ch.id && <div style={styles.activeIndicator}></div>}
                        </div>
                    ))}
                </div>

                <div style={{ padding: '20px' }}>
                    <button onClick={createNewChannel} style={styles.newChannelBtn}>
                        <Plus size={14} /> New Channel
                    </button>
                </div>
            </div>

            {/* Main Chat Area */}
            <div style={styles.chatArea}>
                {/* Header */}
                <div style={styles.chatHeader}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Hash size={24} color="var(--accent-primary)" />
                        <div>
                            <div style={styles.channelTitle}>
                                {channels.find(c => c.id === activeChannel)?.name || "Select Channel"}
                            </div>
                            <div style={styles.channelTopic}>Team-wide coordination and protocol updates</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <Search size={18} color="var(--text-secondary)" />
                        <Bell size={18} color="var(--text-secondary)" />
                    </div>
                </div>

                {/* Messages */}
                <div style={styles.messagesContainer}>
                    <div style={styles.dateDivider}>
                        <span style={styles.dateLabel}>TODAY</span>
                    </div>

                    <div style={styles.systemMessage}>
                        <div style={styles.systemPill}>
                            <Terminal size={12} style={{ marginRight: 6 }} />
                            System: Connected to secure channel 0x8626...1199
                        </div>
                    </div>

                    {messages.map((msg, i) => (
                        <div key={i} style={{
                            ...styles.messageRow,
                            ...(msg.senderId === userId ? styles.myMessageRow : {})
                        }}>
                            {msg.senderId !== userId && (
                                <div style={styles.avatar}>
                                    {msg.senderId === "Taskchain Bot" ? <Bot size={16} /> : msg.senderId.slice(0, 1).toUpperCase()}
                                </div>
                            )}

                            <div style={styles.messageContent}>
                                {msg.senderId !== userId && (
                                    <div style={styles.senderName}>
                                        {msg.senderId} <span style={styles.timestamp}>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                )}

                                {/* Check if Bot Message for special styling */}
                                {msg.senderId === "Taskchain Bot" ? (
                                    <div style={styles.botCard}>
                                        <div style={styles.botHeader}>
                                            <div style={styles.botLabel}>AUTOMATED</div>
                                            <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>10:43 AM</span>
                                        </div>
                                        <div style={{ marginBottom: 10 }}>{msg.content}</div>
                                        <div style={styles.botAction}>
                                            <span style={{ color: 'var(--accent-primary)' }}>● Passed</span>
                                            <button style={styles.botBtn}>View Report</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={
                                        msg.senderId === userId ? styles.myBubble : styles.bubble
                                    }>
                                        {msg.content}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div style={styles.inputArea}>

                    {/* Floating merge alert example (static for visual) */}
                    {/* <div style={styles.mergeAlert}>
                        <div style={{display:'flex', gap:6, alignItems:'center'}}>
                            <div style={{width:6, height:6, borderRadius:'50%', background:'#00ff88'}}></div>
                            Merge conflict resolved automatically
                        </div>
                    </div> */}

                    <div style={styles.inputWrapper}>
                        <input
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSend()}
                            placeholder={`Message #${channels.find(c => c.id === activeChannel)?.name || "channel"} `}
                            style={styles.input}
                        />
                        <div style={styles.inputActions}>
                            <Plus size={18} color="var(--text-secondary)" style={{ cursor: 'pointer' }} />
                            <Code size={18} color="var(--text-secondary)" style={{ cursor: 'pointer' }} />
                            <Smile size={18} color="var(--text-secondary)" style={{ cursor: 'pointer' }} />

                            <button onClick={handleSend} style={styles.sendBtn}>
                                <Send size={18} color="var(--text-on-accent)" fill="var(--text-on-accent)" />
                            </button>
                        </div>
                    </div>
                    <div style={styles.inputFooter}>
                        Types /task /review or paste code
                    </div>
                </div>
            </div>
        </div>
    )
}

const styles: any = {
    container: {
        display: 'flex',
        height: '100vh',
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        fontFamily: "'JetBrains Mono', monospace",
        overflow: 'hidden',
        transition: "background 0.3s, color 0.3s",
    },
    // SIDEBAR
    sidebar: {
        width: '260px',
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
    },
    workspaceHeader: {
        padding: '24px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        borderBottom: '1px solid var(--border-color)'
    },
    workspaceIcon: {
        width: '36px',
        height: '36px',
        borderRadius: '8px',
        background: 'rgba(0, 255, 136, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid rgba(0, 255, 136, 0.2)'
    },
    workspaceName: {
        fontSize: '13px',
        fontWeight: 'bold',
        color: 'var(--text-primary)',
        lineHeight: '1.2'
    },
    teamName: {
        fontSize: '11px',
        color: 'var(--text-secondary)'
    },
    statusIndicator: {
        padding: '12px 20px',
        fontSize: '10px',
        color: 'var(--accent-primary)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontWeight: 'bold',
        letterSpacing: '1px'
    },
    onlineDot: {
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        background: 'var(--accent-primary)',
        boxShadow: '0 0 8px var(--accent-primary)'
    },
    channelList: {
        flex: 1,
        padding: '20px 10px',
        overflowY: 'auto'
    },
    sectionTitle: {
        fontSize: '10px',
        color: 'var(--text-tertiary)',
        marginBottom: '10px',
        paddingLeft: '10px',
        fontWeight: 'bold'
    },
    channelItem: {
        padding: '8px 12px',
        borderRadius: '6px',
        cursor: 'pointer',
        color: 'var(--text-secondary)',
        fontSize: '13px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '2px',
        position: 'relative',
        transition: 'all 0.2s'
    },
    channelActive: {
        background: 'rgba(0, 255, 136, 0.1)',
        color: 'var(--text-primary)',
        border: '1px solid rgba(0, 255, 136, 0.1)'
    },
    activeIndicator: {
        position: 'absolute',
        right: '10px',
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        background: 'var(--accent-primary)',
        boxShadow: '0 0 5px var(--accent-primary)'
    },
    newChannelBtn: {
        width: '100%',
        background: 'transparent',
        border: '1px dashed var(--border-color)',
        color: 'var(--text-secondary)',
        padding: '10px',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        transition: '0.2s',
    },

    // CHAT AREA
    chatArea: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-primary)',
        position: 'relative'
    },
    chatHeader: {
        height: '70px',
        borderBottom: '1px solid var(--border-color)',
        padding: '0 30px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    channelTitle: {
        fontSize: '16px',
        fontWeight: 'bold',
        color: 'var(--text-primary)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
    },
    channelTopic: {
        fontSize: '12px',
        color: 'var(--text-secondary)',
        marginTop: '2px'
    },
    messagesContainer: {
        flex: 1,
        padding: '30px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
    },
    dateDivider: {
        display: 'flex',
        justifyContent: 'center',
        margin: '20px 0',
        position: 'relative',
    },
    dateLabel: {
        background: 'var(--bg-tertiary)',
        padding: '0 15px',
        color: 'var(--text-secondary)',
        fontSize: '10px',
        fontWeight: 'bold',
        letterSpacing: '1px',
        zIndex: 1,
        borderRadius: '12px',
    },
    messageRow: {
        display: 'flex',
        gap: '15px',
        maxWidth: '80%'
    },
    myMessageRow: {
        flexDirection: 'row-reverse',
        alignSelf: 'flex-end',
        textAlign: 'right'
    },
    avatar: {
        width: '32px',
        height: '32px',
        borderRadius: '6px',
        background: 'var(--bg-tertiary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--accent-primary)',
        fontWeight: 'bold',
        fontSize: '14px',
        border: '1px solid var(--border-color)'
    },
    messageContent: {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
    },
    senderName: {
        fontSize: '12px',
        fontWeight: 'bold',
        color: 'var(--accent-primary)',
        marginBottom: '2px'
    },
    timestamp: {
        fontSize: '10px',
        color: 'var(--text-tertiary)',
        marginLeft: '6px',
        fontWeight: 'normal'
    },
    bubble: {
        color: 'var(--text-primary)',
        fontSize: '14px',
        lineHeight: '1.5',
        maxWidth: 'fit-content'
    },
    myBubble: {
        color: 'var(--text-primary)',
        fontSize: '14px',
        lineHeight: '1.5',
        maxWidth: 'fit-content',
        alignSelf: 'flex-end'
    },

    // System Pill
    systemMessage: {
        display: 'flex',
        justifyContent: 'center',
        margin: '10px 0'
    },
    systemPill: {
        background: 'rgba(0, 255, 136, 0.05)',
        border: '1px solid rgba(0, 255, 136, 0.2)',
        color: 'var(--accent-primary)',
        padding: '6px 16px',
        borderRadius: '20px',
        fontSize: '11px',
        display: 'flex',
        alignItems: 'center',
        boxShadow: '0 0 10px rgba(0, 255, 136, 0.05)'
    },

    // Bot Card
    botCard: {
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        padding: '15px',
        marginTop: '5px',
        minWidth: '400px'
    },
    botHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '10px'
    },
    botLabel: {
        background: 'var(--accent-primary)',
        color: 'var(--text-on-accent)',
        fontSize: '9px',
        fontWeight: 'bold',
        padding: '2px 6px',
        borderRadius: '2px'
    },
    botAction: {
        background: 'var(--bg-tertiary)',
        border: '1px solid var(--border-color)',
        padding: '8px 12px',
        borderRadius: '6px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '12px'
    },
    botBtn: {
        background: 'rgba(128, 128, 128, 0.1)',
        border: 'none',
        color: 'var(--text-primary)',
        fontSize: '10px',
        padding: '4px 8px',
        borderRadius: '4px',
        cursor: 'pointer'
    },


    // INPUT AREA
    inputArea: {
        padding: '30px',
        borderTop: '1px solid var(--border-color)',
        background: 'var(--bg-tertiary)'
    },
    inputWrapper: {
        background: 'var(--bg-secondary)',
        border: '1px solid var(--accent-primary)',
        borderRadius: '12px',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        boxShadow: '0 0 20px rgba(0, 255, 136, 0.05)',
        gap: '12px'
    },
    input: {
        flex: 1,
        background: 'transparent',
        border: 'none',
        color: 'var(--text-primary)',
        fontSize: '14px',
        fontFamily: 'inherit',
        outline: 'none'
    },
    inputActions: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
    },
    sendBtn: {
        background: 'var(--accent-primary)',
        border: 'none',
        borderRadius: '8px',
        width: '32px',
        height: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'transform 0.1s',
    },
    inputFooter: {
        paddingTop: '8px',
        fontSize: '11px',
        color: 'var(--text-tertiary)',
        paddingLeft: '10px'
    }
}

export default ChatLayout
