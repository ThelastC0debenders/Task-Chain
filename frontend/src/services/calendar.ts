import axios from "axios"

const API_URL = "http://localhost:5001/calendar"

export async function getEvents() {
    const res = await axios.get(`${API_URL}`)
    return res.data.events
}

export async function createEvent(event: any) {
    const res = await axios.post(`${API_URL}`, event)
    return res.data.event
}
