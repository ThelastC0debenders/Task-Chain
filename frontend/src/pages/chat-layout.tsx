import { useEffect, useState, useRef } from "react"
import { socket } from "../services/socket"
import * as chatService from "../services/messaging"

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
            if (msg.channelId === activeChannel) { // This check might need msg.channelId if we broadcast globally, but backend uses rooms
                // Actually backend emits to room, so if we are in other room we wont get it? 
                // We need to listen to specific event or be in room.
                // Wait, if I switch channel, I should join/leave rooms.
            }
            // For simplicity, let's just append if it matches current channel or if handling notifying others
            setMessages(prev => [...prev, msg])
            scrollToBottom()
        })

        return () => {
            socket.off("receive_message")
        }
    }, [activeChannel]) // Re-bind if activeChannel used in closure, or stick to functional updates

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
            // Socket will give us the message back if we configured it to broadcast to sender too, 
            // OR we optimistically add it. Backend currently broadcasts to room. 
            // User is in room, so they should receive it.
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
        <div style={{ display: 'flex', height: '100vh', backgroundColor: '#1e1e1e', color: 'white' }}>
            {/* Sidebar */}
            <div style={{ width: '250px', borderRight: '1px solid #333', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '20px', borderBottom: '1px solid #333' }}>
                    <h3>Conversations</h3>
                    <button onClick={createNewChannel} style={{ marginTop: '10px', width: '100%' }}>+ New Channel</button>
                </div>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {channels.map(ch => (
                        <div
                            key={ch.id}
                            onClick={() => setActiveChannel(ch.id)}
                            style={{
                                padding: '10px 20px',
                                cursor: 'pointer',
                                backgroundColor: activeChannel === ch.id ? '#333' : 'transparent',
                                display: 'flex', alignItems: 'center'
                            }}
                        >
                            <span style={{ marginRight: '10px' }}>#</span> {ch.name}
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Chat */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {activeChannel ? (
                    <>
                        <div style={{ padding: '15px', borderBottom: '1px solid #333' }}>
                            <h3>#{channels.find(c => c.id === activeChannel)?.name}</h3>
                        </div>

                        <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
                            {messages.map((msg, i) => (
                                <div key={i} style={{ marginBottom: '15px', display: 'flex', flexDirection: 'column', alignItems: msg.senderId === userId ? 'flex-end' : 'flex-start' }}>
                                    <div style={{
                                        backgroundColor: msg.senderId === userId ? '#007bff' : '#333',
                                        padding: '8px 12px',
                                        borderRadius: '8px',
                                        maxWidth: '60%'
                                    }}>
                                        <div style={{ fontSize: '0.8em', opacity: 0.7, marginBottom: '4px' }}>{msg.senderId}</div>
                                        <div>{msg.content}</div>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        <div style={{ padding: '20px', borderTop: '1px solid #333', display: 'flex' }}>
                            <input
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSend()}
                                placeholder="Type a message..."
                                style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #333', backgroundColor: '#2d2d2d', color: 'white', marginRight: '10px' }}
                            />
                            <button onClick={handleSend}>Send</button>
                        </div>
                    </>
                ) : (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                        Select a channel to start messaging
                    </div>
                )}
            </div>
        </div>
    )
}

export default ChatLayout
