import axios from "axios"

const API_URL = "/api/docs"

export async function getDocs() {
    const res = await axios.get(`${API_URL}`)
    return res.data.docs
}

export async function getDoc(id: string) {
    const res = await axios.get(`${API_URL}/${id}`)
    return res.data.doc
}

export async function createDoc(title: string) {
    const res = await axios.post(`${API_URL}`, { title })
    return res.data.doc
}

export async function updateDoc(id: string, content: string) {
    const res = await axios.put(`${API_URL}/${id}`, { content })
    return res.data.doc
}

