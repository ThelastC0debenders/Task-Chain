import React, { useState, useEffect } from 'react'

interface LogEntry {
  time: string
  level: 'INFO' | 'DEBUG' | 'SUCCESS' | 'WARN'
  message: string
}

const SystemEventsLog: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([
    { time: '14:02:45', level: 'INFO', message: 'Worker node connected' },
    { time: '14:02:43', level: 'INFO', message: 'Vectorizing batch' },
    { time: '14:02:41', level: 'DEBUG', message: 'Cache miss' },
    { time: '14:02:40', level: 'SUCCESS', message: 'Batch committed' },
    { time: '14:02:38', level: 'INFO', message: 'Garbage collection' },
    { time: '14:02:36', level: 'INFO', message: 'Resuming queue' },
    { time: '14:02:34', level: 'SUCCESS', message: 'Model weights synced' },
    { time: '14:02:32', level: 'INFO', message: 'Updating model weights' },
    { time: '14:02:30', level: 'INFO', message: 'Processing query' },
    { time: '14:02:28', level: 'DEBUG', message: 'Reranking candidates' },
    { time: '14:02:26', level: 'INFO', message: 'Query expansion' },
    { time: '14:02:24', level: 'INFO', message: 'Awaiting next batch' },
    { time: '14:02:22', level: 'WARN', message: 'High memory usage detected' },
  ])

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date()
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
      
      const newLogs: LogEntry[] = [
        { time: timeStr, level: 'INFO', message: 'Worker node connected' },
        { time: timeStr, level: 'INFO', message: 'Vectorizing batch' },
        { time: timeStr, level: 'DEBUG', message: 'Cache miss' },
        { time: timeStr, level: 'SUCCESS', message: 'Batch committed' },
        { time: timeStr, level: 'INFO', message: 'Garbage collection' },
        { time: timeStr, level: 'INFO', message: 'Resuming queue' },
        { time: timeStr, level: 'SUCCESS', message: 'Model weights synced' },
        { time: timeStr, level: 'INFO', message: 'Updating model weights' },
        { time: timeStr, level: 'INFO', message: 'Processing query' },
        { time: timeStr, level: 'DEBUG', message: 'Reranking candidates' },
        { time: timeStr, level: 'INFO', message: 'Query expansion' },
        { time: timeStr, level: 'INFO', message: 'Awaiting next batch' },
        { time: timeStr, level: 'WARN', message: 'High memory usage detected' },
      ]
      
      const randomLog = newLogs[Math.floor(Math.random() * newLogs.length)]
      setLogs(prev => [randomLog, ...prev.slice(0, 19)])
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="card events-log">
      <div className="events-log-header">
        <div className="card-title">SYSTEM EVENTS LOG</div>
        <div className="log-dots">
          <div className="log-dot"></div>
          <div className="log-dot"></div>
          <div className="log-dot"></div>
        </div>
      </div>
      <div className="log-entries-container">
        {logs.map((log, index) => (
          <div key={index} className="log-entry">
            <span className="log-time">{log.time}</span>
            <span className={`log-level ${log.level.toLowerCase()}`}>[{log.level}]</span>
            <span className="log-message">{log.message}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default SystemEventsLog

