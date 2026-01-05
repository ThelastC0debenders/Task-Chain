import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import './App.css'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import AskTheAgentPage from './pages/AskTheAgentPage'
import ChangeIntelligence from './pages/ChangeIntelligence'
import ReasoningConfidence from './pages/ReasoningConfidence'

function App() {
  const [lastUpdate, setLastUpdate] = useState(0.4)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(prev => {
        const newValue = prev + 0.1
        return newValue >= 60 ? 0.1 : newValue
      })
    }, 100)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="app">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className={`main-container ${sidebarOpen ? '' : 'sidebar-collapsed'}`}>
        <Header lastUpdate={lastUpdate} />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/ask-the-agent" element={<AskTheAgentPage />} />
          <Route path="/change-intelligence" element={<ChangeIntelligence />} />
          <Route path="/reasoning-confidence" element={<ReasoningConfidence />} />
        </Routes>
      </div>
    </div>
  )
}

export default App
