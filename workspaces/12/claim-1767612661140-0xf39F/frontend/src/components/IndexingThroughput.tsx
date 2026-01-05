import React, { useState, useEffect } from 'react'

const IndexingThroughput: React.FC = () => {
  const [throughput, setThroughput] = useState(2410)
  const [dataPoints, setDataPoints] = useState<number[]>([])

  useEffect(() => {
    // Generate initial data points
    const initialPoints: number[] = []
    for (let i = 0; i < 20; i++) {
      initialPoints.push(1800 + Math.random() * 600)
    }
    setDataPoints(initialPoints)

    const interval = setInterval(() => {
      const newValue = 2000 + Math.random() * 500
      setThroughput(Math.round(newValue))
      setDataPoints(prev => {
        const newPoints = [...prev.slice(1), newValue]
        return newPoints
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Normalize data points for SVG
  const maxValue = 3000
  const minValue = 0
  const width = 300
  const height = 180
  const padding = 30
  const bottomPadding = 25

  const normalizedPoints = dataPoints.map((value, index) => {
    const x = (index / (dataPoints.length - 1)) * (width - padding * 2) + padding
    const y = height - bottomPadding - ((value - minValue) / (maxValue - minValue)) * (height - padding - bottomPadding)
    return { x, y }
  })

  // Create smooth line path
  const pathData = normalizedPoints
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ')

  return (
    <div className="card throughput-card">
      <div className="throughput-header">
        <div className="card-title">INDEXING THROUGHPUT</div>
        <div className="throughput-value">
          <div className="throughput-dot"></div>
          <span className="throughput-text">{throughput.toLocaleString()} d/s</span>
        </div>
      </div>
      <div className="graph-container">
        <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#1a1a1a" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* Y-axis labels */}
          <text x="8" y={height - bottomPadding + 4} className="graph-label" fill="#666">0</text>
          <text x="8" y={height / 2 + 4} className="graph-label" fill="#666">1.5K</text>
          <text x="8" y={padding + 4} className="graph-label" fill="#666">3K</text>
          
          {/* X-axis labels */}
          <text x={padding - 5} y={height - 8} className="graph-label" fill="#666">10s</text>
          <text x={width / 2 - 8} y={height - 8} className="graph-label" fill="#666">5s</text>
          <text x={width - padding - 12} y={height - 8} className="graph-label" fill="#666">Now</text>
          
          {/* Graph line */}
          <path d={pathData} className="graph-line" />
        </svg>
      </div>
    </div>
  )
}

export default IndexingThroughput

