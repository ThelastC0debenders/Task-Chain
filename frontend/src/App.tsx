import { BrowserRouter, Routes, Route } from "react-router-dom"
import Home from "./pages/home"
import CreateTask from "./pages/createtask"
import TaskView from "./pages/taskview"
import Receipt from "./pages/receipt"
import LeaderDashboard from "./pages/leader-dashboard"
import MemberDashboard from "./pages/member-dashboard"
import WorkDashboard from "./pages/work-dashboard"
import ChatLayout from "./pages/chat-layout"
import KanbanBoard from "./pages/kanban-board"
import CalendarLayout from "./pages/calendar"
import MeetingRoom from "./pages/meeting"
import DocsLayout from "./pages/docs-layout"
import Whiteboard from "./pages/whiteboard"
import GraphDebugger from "./pages/graph-debugger"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create" element={<CreateTask />} />
        <Route path="/task" element={<TaskView />} />
        <Route path="/receipt" element={<Receipt />} />
        <Route path="/leader" element={<LeaderDashboard />} />
        <Route path="/member" element={<MemberDashboard />} />
        <Route path="/work" element={<WorkDashboard />} />
        <Route path="/invite" element={<MemberDashboard />} />

        {/* Productivity Suite */}
        <Route path="/chat" element={<ChatLayout />} />
        <Route path="/board" element={<KanbanBoard />} />
        <Route path="/calendar" element={<CalendarLayout />} />
        <Route path="/meet" element={<MeetingRoom />} />
        <Route path="/docs" element={<DocsLayout />} />
        <Route path="/whiteboard" element={<Whiteboard />} />
        <Route path="/graph-debug" element={<GraphDebugger />} />
      </Routes>
    </BrowserRouter>
  )
}
