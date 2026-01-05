
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
    const [userId] = useState("user-" + Math.floor(Math.random() * 1000)) // Mock User
    const messagesEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        loadChannels()

        socket.on("receive_message", (msg: Message) => {
            if (msg.channelId === activeChannel) {
                // Handle message reception
            }
            setMessages(prev => [...prev, msg])
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
        const list = await chatService.getMessages(channelId)
        setMessages(list)
        scrollToBottom()
    }

    const handleSend = async () => {
        if (!input.trim() || !activeChannel) return
        try {
            await chatService.sendMessage(activeChannel, userId, input)
            setInput("")
        } catch (e) {
            console.error(e)
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
                        <Cpu size={24} color="#00ff88" />
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
                        <Hash size={24} color="#00ff88" />
                        <div>
                            <div style={styles.channelTitle}>
                                {channels.find(c => c.id === activeChannel)?.name || "Select Channel"}
                            </div>
                            <div style={styles.channelTopic}>Team-wide coordination and protocol updates</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <Search size={18} color="#666" />
                        <Bell size={18} color="#666" />
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
                                            <span style={{ fontSize: 10, color: '#666' }}>10:43 AM</span>
                                        </div>
                                        <div style={{ marginBottom: 10 }}>{msg.content}</div>
                                        <div style={styles.botAction}>
                                            <span style={{ color: '#00ff88' }}>● Passed</span>
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
                            <Plus size={18} color="#666" style={{ cursor: 'pointer' }} />
                            <Code size={18} color="#666" style={{ cursor: 'pointer' }} />
                            <Smile size={18} color="#666" style={{ cursor: 'pointer' }} />

                            <button onClick={handleSend} style={styles.sendBtn}>
                                <Send size={18} color="#000" fill="#000" />
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
        backgroundColor: '#050505',
        color: '#e0e0e0',
        fontFamily: "'JetBrains Mono', monospace",
        overflow: 'hidden'
    },
    // SIDEBAR
    sidebar: {
        width: '260px',
        background: '#080808',
        borderRight: '1px solid #1a1a1a',
        display: 'flex',
        flexDirection: 'column',
    },
    workspaceHeader: {
        padding: '24px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        borderBottom: '1px solid #1a1a1a'
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
        color: '#fff',
        lineHeight: '1.2'
    },
    teamName: {
        fontSize: '11px',
        color: '#666'
    },
    statusIndicator: {
        padding: '12px 20px',
        fontSize: '10px',
        color: '#00ff88',
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
        background: '#00ff88',
        boxShadow: '0 0 8px #00ff88'
    },
    channelList: {
        flex: 1,
        padding: '20px 10px',
        overflowY: 'auto'
    },
    sectionTitle: {
        fontSize: '10px',
        color: '#444',
        marginBottom: '10px',
        paddingLeft: '10px',
        fontWeight: 'bold'
    },
    channelItem: {
        padding: '8px 12px',
        borderRadius: '6px',
        cursor: 'pointer',
        color: '#888',
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
        color: '#fff',
        border: '1px solid rgba(0, 255, 136, 0.1)'
    },
    activeIndicator: {
        position: 'absolute',
        right: '10px',
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        background: '#00ff88',
        boxShadow: '0 0 5px #00ff88'
    },
    newChannelBtn: {
        width: '100%',
        background: '#000',
        border: '1px dashed #333',
        color: '#666',
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
        background: 'radial-gradient(circle at 50% 50%, #0a0a0a 0%, #050505 100%)',
        position: 'relative'
    },
    chatHeader: {
        height: '70px',
        borderBottom: '1px solid #1a1a1a',
        padding: '0 30px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    channelTitle: {
        fontSize: '16px',
        fontWeight: 'bold',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
    },
    channelTopic: {
        fontSize: '12px',
        color: '#666',
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
        background: '#050505',
        padding: '0 15px',
        color: '#333',
        fontSize: '10px',
        fontWeight: 'bold',
        letterSpacing: '1px',
        zIndex: 1
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
        background: '#1a1a1a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#00ff88',
        fontWeight: 'bold',
        fontSize: '14px',
        border: '1px solid #333'
    },
    messageContent: {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
    },
    senderName: {
        fontSize: '12px',
        fontWeight: 'bold',
        color: '#00ff88',
        marginBottom: '2px'
    },
    timestamp: {
        fontSize: '10px',
        color: '#444',
        marginLeft: '6px',
        fontWeight: 'normal'
    },
    bubble: {
        color: '#ccc',
        fontSize: '14px',
        lineHeight: '1.5',
    },
    myBubble: {
        color: '#fff',
        fontSize: '14px',
        lineHeight: '1.5'
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
        color: '#00ff88',
        padding: '6px 16px',
        borderRadius: '20px',
        fontSize: '11px',
        display: 'flex',
        alignItems: 'center',
        boxShadow: '0 0 10px rgba(0, 255, 136, 0.05)'
    },

    // Bot Card
    botCard: {
        background: '#0a0a0a',
        border: '1px solid #1a1a1a',
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
        background: '#00ff88',
        color: '#000',
        fontSize: '9px',
        fontWeight: 'bold',
        padding: '2px 6px',
        borderRadius: '2px'
    },
    botAction: {
        background: '#050505',
        border: '1px solid #1a1a1a',
        padding: '8px 12px',
        borderRadius: '6px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '12px'
    },
    botBtn: {
        background: 'rgba(255, 255, 255, 0.1)',
        border: 'none',
        color: '#fff',
        fontSize: '10px',
        padding: '4px 8px',
        borderRadius: '4px',
        cursor: 'pointer'
    },


    // INPUT AREA
    inputArea: {
        padding: '30px',
        borderTop: '1px solid #1a1a1a',
        background: '#050505'
    },
    inputWrapper: {
        background: '#080808',
        border: '1px solid #00ff88',
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
        color: '#fff',
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
        background: '#00ff88',
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
        color: '#444',
        paddingLeft: '10px'
    }
}

export default ChatLayout
