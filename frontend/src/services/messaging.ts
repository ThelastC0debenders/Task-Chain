import axios from "axios"

const API_URL = "http://localhost:5001/chat"

export async function getChannels(userId: string) {
    const res = await axios.get(`${API_URL}/channels?userId=${userId}`)
    return res.data.channels
}

export async function createChannel(name: string, type: 'public' | 'private' | 'dm', members: string[]) {
    const res = await axios.post(`${API_URL}/channels`, { name, type, members })
    return res.data.channel
}

export async function getMessages(channelId: string) {
    const res = await axios.get(`${API_URL}/messages/${channelId}`)
    return res.data.messages
}

export async function sendMessage(channelId: string, senderId: string, content: string) {
    const res = await axios.post(`${API_URL}/messages/${channelId}`, { senderId, content })
    return res.data.message
}
