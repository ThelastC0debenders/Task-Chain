import axios from "axios"

const API_URL = "/api/calendar"

export async function getEvents() {
    const res = await axios.get(API_URL)
    console.log("calendar api raw response:", res.data)
    return res.data.events
}


export async function createEvent(event: any) {
    const res = await axios.post(`${API_URL}`, event)
    return res.data.event
}
