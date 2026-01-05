import { BrowserRouter, Routes, Route } from "react-router-dom"
import Home from "./pages/home"
import CreateTask from "./pages/createtask"
import TaskView from "./pages/taskview"
import Receipt from "./pages/receipt"
import LeaderDashboard from "./pages/leader-dashboard"
import MemberDashboard from "./pages/member-dashboard"
import WorkDashboard from "./pages/work-dashboard"

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
      </Routes>
    </BrowserRouter>
  )
}
