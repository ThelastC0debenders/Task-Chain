import { Server, Socket } from "socket.io"
import { Server as HttpServer } from "http"
import * as whiteboardService from "./services/whiteboard"

let io: Server

export const initSocket = (httpServer: HttpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: "*", // Adjust for production
      methods: ["GET", "POST"],
    },
  })

  io.on("connection", (socket: Socket) => {
    console.log("Client connected:", socket.id)

    // --- Chat ---
    socket.on("join_channel", (channelId: string) => {
      socket.join(channelId)
      console.log(`Socket ${socket.id} joined channel ${channelId}`)
    })

    socket.on("leave_channel", (channelId: string) => {
      socket.leave(channelId)
    })

    socket.on("send_message", (message: any) => {
      // Broadcast to everyone in channel INCLUDING sender (for simple optimistic UI update confirmation)
      // or excluding sender. Let's do excluding if UI updates immediately.
      // Usually better to broadcast to room.
      io.to(message.channelId).emit("receive_message", message)
    })

    // --- Board ---
    socket.on("join_board", (boardId: string) => {
      socket.join(boardId)
    })

    socket.on("board_update", (data: { boardId: string, action: string, payload: any }) => {
      socket.to(data.boardId).emit("board_updated", data)
    })

    // --- Meet (WebRTC Signaling) ---
    socket.on("join_room", (roomId: string) => {
      socket.join(roomId)
      socket.to(roomId).emit("user_connected", socket.id)
    })

    socket.on("offer", (data: { offer: any, roomId: string }) => {
      socket.to(data.roomId).emit("offer", { offer: data.offer, sender: socket.id })
    })

    socket.on("answer", (data: { answer: any, roomId: string }) => {
      socket.to(data.roomId).emit("answer", { answer: data.answer, sender: socket.id })
    })

    socket.on("ice_candidate", (data: { candidate: any, roomId: string }) => {
      socket.to(data.roomId).emit("ice_candidate", { candidate: data.candidate, sender: socket.id })
    })

    // --- Whiteboard ---
    socket.on("join_whiteboard", (wbId: string) => {
      socket.join(wbId)
    })

    socket.on("draw", (data: { wbId: string, elements: any }) => {
      socket.to(data.wbId).emit("draw_update", data)
    })

    // --- Docs ---
    socket.on("join_doc", (docId: string) => {
      socket.join(docId)
    })

    socket.on("doc_change", (data: { docId: string, content: any }) => {
      socket.to(data.docId).emit("doc_updated", data)
    })

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id)
      // Handle cleanup if needed
    })
  })

  return io
}
