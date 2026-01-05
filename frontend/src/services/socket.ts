import { io } from "socket.io-client"

// Assuming backend runs on same host/port during dev or configure it
const URL = "/"

export const socket = io(URL)
