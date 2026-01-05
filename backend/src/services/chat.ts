
interface Channel {
    id: string
    name: string
    type: 'public' | 'private' | 'dm'
    members: string[] // User IDs
}

interface Message {
    id: string
    channelId: string
    senderId: string
    content: string
    timestamp: number
}

// Mock In-Memory DB
const channels: Map<string, Channel> = new Map()
const messages: Map<string, Message[]> = new Map()

// Seed "general" channel
channels.set('general', { id: 'general', name: 'general', type: 'public', members: [] })
messages.set('general', [])

export function createChannel(name: string, type: 'public' | 'private' | 'dm' = 'public', members: string[] = []) {
    const id = name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now().toString(36)
    const channel: Channel = { id, name, type, members }
    channels.set(id, channel)
    messages.set(id, [])
    return channel
}

export function getChannels(userId?: string) {
    // Return all public channels + private ones user is in
    const list: Channel[] = []
    for (const channel of channels.values()) {
        if (channel.type === 'public' || (userId && channel.members.includes(userId))) {
            list.push(channel)
        }
    }
    return list
}

export function saveMessage(channelId: string, senderId: string, content: string) {
    if (!messages.has(channelId)) {
        // If channel doesn't exist, maybe auto-create or error. Let's error if not found.
        if (!channels.has(channelId)) throw new Error("Channel not found")
        messages.set(channelId, [])
    }

    const msg: Message = {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2),
        channelId,
        senderId,
        content,
        timestamp: Date.now()
    }

    messages.get(channelId)!.push(msg)
    return msg
}

export function getMessages(channelId: string) {
    return messages.get(channelId) || []
}
