import React, { useState, useEffect } from 'react'

interface NodeData {
  label: string
  load: number
}

const AIModelLoad: React.FC = () => {
  const [nodes, setNodes] = useState<NodeData[]>([
    { label: 'node-01', load: 45 },
    { label: 'node-02', load: 62 },
    { label: 'node-03', load: 38 },
    { label: 'node-04', load: 71 },
    { label: 'node-05', load: 55 },
    { label: 'node-06', load: 68 },
    { label: 'node-07', load: 49 },
    { label: 'node-08', load: 92 },
  ])

  useEffect(() => {
    const interval = setInterval(() => {
      setNodes(prev => prev.map(node => ({
        ...node,
        load: Math.max(20, Math.min(95, node.load + (Math.random() - 0.5) * 10))
      })))
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  const maxLoad = 100
  const maxBarHeight = 160

  return (
    <div className="card model-load-card">
      <div className="model-load-header">
        <div className="card-title">AI MODEL LOAD</div>
        <button className="time-selector">Last 1h</button>
      </div>
      <div className="bar-chart-container">
        {nodes.map((node, index) => {
          const barHeight = (node.load / maxLoad) * maxBarHeight
          return (
            <div key={index} className="bar-wrapper">
              <div className="bar-label">{node.label}</div>
              <div className="bar" style={{ height: `${barHeight}px` }}>
                <span className="bar-value">{Math.round(node.load)}%</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default AIModelLoad

