import React from 'react'
import { useLocation } from 'react-router-dom'

interface HeaderProps {
  lastUpdate: number
}

const Header: React.FC<HeaderProps> = ({ lastUpdate }) => {
  const location = useLocation()
  
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
      case '/dashboard':
        return 'SYSTEM DASHBOARD'
      case '/ask-the-agent':
        return 'ASK THE AGENT'
      case '/change-intelligence':
        return 'CHANGE INTELLIGENCE'
      case '/reasoning-confidence':
        return 'REASONING & CONFIDENCE'
      default:
        return 'SYSTEM DASHBOARD'
    }
  }

  return (
    <div className="header">
      <div className="header-left">
        <span className="command-icon">&gt;_</span>
        <h1 className="header-title">{getPageTitle()}</h1>
        <div className="live-status">
          <div className="live-dot"></div>
          <span className="live-text">LIVE INDEXING: ON</span>
        </div>
      </div>
      <div className="header-right">
        <svg className="notification-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        <span className="last-update">LAST UPDATE: {lastUpdate.toFixed(1)}S AGO</span>
        <div className="avatar">JD</div>
      </div>
    </div>
  )
}

export default Header

