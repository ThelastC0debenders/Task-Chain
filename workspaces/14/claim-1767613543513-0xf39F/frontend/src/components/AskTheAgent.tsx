import React from 'react'
import { useNavigate } from 'react-router-dom'

const AskTheAgent: React.FC = () => {
  const navigate = useNavigate()

  const handleClick = () => {
    navigate('/ask-the-agent')
  }

  return (
    <div className="ask-agent-container">
      <button className="ask-agent-button" onClick={handleClick}>
        <span className="ask-agent-icon">&gt;_</span>
        <span>ASK THE AGENT</span>
        <svg className="ask-agent-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  )
}

export default AskTheAgent

