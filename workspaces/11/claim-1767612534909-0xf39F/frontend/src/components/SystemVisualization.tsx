import React from 'react'
import { Circle, Server, Zap, BarChart3, HardDrive, Cpu } from 'lucide-react'

const SystemVisualization: React.FC = () => {
  return (
    <div className="card system-visualization">
      <div className="card-title">SYSTEM VISUALIZATION</div>
      <div className="visualization-container">
        <div className="system-info">
          <div className="info-section">
            <div className="info-label">
              <Circle className="info-icon" size={16} fill="#00ff88" color="#00ff88" />
              System Status
            </div>
            <div className="info-value active">Operational</div>
          </div>
          <div className="info-section">
            <div className="info-label">
              <Server className="info-icon" size={16} color="#00ff88" />
              Active Nodes
            </div>
            <div className="info-value">8</div>
          </div>
          <div className="info-section">
            <div className="info-label">
              <Zap className="info-icon" size={16} color="#00ff88" />
              Network Latency
            </div>
            <div className="info-value">12ms</div>
          </div>
          <div className="info-section">
            <div className="info-label">
              <BarChart3 className="info-icon" size={16} color="#00ff88" />
              Data Throughput
            </div>
            <div className="info-value">2.4k/s</div>
          </div>
          <div className="info-section">
            <div className="info-label">
              <HardDrive className="info-icon" size={16} color="#00ff88" />
              Cache Hit Rate
            </div>
            <div className="info-value">94.2%</div>
          </div>
          <div className="info-section">
            <div className="info-label">
              <Cpu className="info-icon" size={16} color="#00ff88" />
              Memory Usage
            </div>
            <div className="info-value">67%</div>
          </div>
        </div>
        <div className="visualization-design">
          <svg viewBox="0 0 400 120" className="design-svg">
            <defs>
              <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style={{ stopColor: 'rgba(0, 255, 136, 0.3)', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: 'rgba(0, 255, 136, 0)', stopOpacity: 1 }} />
              </linearGradient>
              <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: 'rgba(0, 255, 136, 0.2)', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: 'rgba(0, 255, 136, 0)', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            {/* Wave pattern */}
            <path d="M0,60 Q100,40 200,60 T400,60 L400,120 L0,120 Z" fill="url(#grad1)" opacity="0.4" />
            <path d="M0,80 Q150,50 300,80 T400,80 L400,120 L0,120 Z" fill="url(#grad2)" opacity="0.3" />
            {/* Grid lines */}
            <line x1="0" y1="60" x2="400" y2="60" stroke="rgba(0, 255, 136, 0.1)" strokeWidth="1" />
            <line x1="0" y1="80" x2="400" y2="80" stroke="rgba(0, 255, 136, 0.1)" strokeWidth="1" />
            {/* Decorative circles */}
            <circle cx="50" cy="60" r="3" fill="rgba(0, 255, 136, 0.4)">
              <animate attributeName="opacity" values="0.4;0.8;0.4" dur="3s" repeatCount="indefinite" />
            </circle>
            <circle cx="150" cy="70" r="2" fill="rgba(0, 255, 136, 0.3)">
              <animate attributeName="opacity" values="0.3;0.7;0.3" dur="2.5s" repeatCount="indefinite" />
            </circle>
            <circle cx="250" cy="65" r="2.5" fill="rgba(0, 255, 136, 0.35)">
              <animate attributeName="opacity" values="0.35;0.75;0.35" dur="2.8s" repeatCount="indefinite" />
            </circle>
            <circle cx="350" cy="75" r="2" fill="rgba(0, 255, 136, 0.3)">
              <animate attributeName="opacity" values="0.3;0.7;0.3" dur="2.2s" repeatCount="indefinite" />
            </circle>
          </svg>
        </div>
      </div>
    </div>
  )
}

export default SystemVisualization

