import React, { useState, useEffect } from 'react'
import { CheckCircle, AlertTriangle, Download, Bug, ChevronDown, ChevronUp, FileJson } from 'lucide-react'

interface TraceStep {
  id: string
  name: string
  status: 'completed' | 'warning' | 'pending'
  time: string
  confidence: number
  details: string
  output?: string
  warning?: string
  resolution?: string
}

const ReasoningConfidence: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0)
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set())
  const [showAllExpanded, setShowAllExpanded] = useState(false)

  const traceSteps: TraceStep[] = [
    {
      id: 'intent',
      name: 'Intent Recognition',
      status: 'completed',
      time: '12ms',
      confidence: 99,
      details: 'Detected Intent: `"SQL Generation"`',
      output: 'Input: `"Show me users who signed up last week"`'
    },
    {
      id: 'schema',
      name: 'Schema Lookup',
      status: 'warning',
      time: '105ms',
      confidence: 75,
      details: 'Matches: 2 tables found (`public.users`, `analytics.users`).',
      warning: 'Ambiguity detected in table `users`',
      resolution: 'Defaulting to `public.users` based on query context.'
    },
    {
      id: 'logic',
      name: 'Logic Formulation',
      status: 'completed',
      time: '220ms',
      confidence: 92,
      details: 'Generated SQL query',
      output: `SELECT * FROM public.users WHERE created_at >= NOW() - INTERVAL '1 week';`
    },
    {
      id: 'synthesis',
      name: 'Final Synthesis',
      status: 'completed',
      time: '80ms',
      confidence: 98,
      details: 'Response successfully formatted and validated against output schema.'
    }
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev < traceSteps.length - 1) {
          return prev + 1
        }
        return prev
      })
    }, 1500)

    return () => clearInterval(interval)
  }, [])

  const toggleStep = (index: number) => {
    const newExpanded = new Set(expandedSteps)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedSteps(newExpanded)
  }

  const toggleAll = () => {
    if (showAllExpanded) {
      setExpandedSteps(new Set())
    } else {
      setExpandedSteps(new Set(traceSteps.map((_, i) => i)))
    }
    setShowAllExpanded(!showAllExpanded)
  }

  const overallConfidence = 87
  const metrics = {
    latency: '450 ms',
    tokens: '1,240',
    model: 'GPT-4-Turbo',
    cost: '$0.042'
  }

  return (
    <div className="page-container reasoning-confidence-page">
      <div className="page-content reasoning-confidence-content">
        {/* Header */}
        <div className="reasoning-header">
          <div className="header-left">
            <h1 className="reasoning-title">Reasoning Trace #8823-XJ</h1>
            <span className="live-badge">LIVE</span>
          </div>
          <div className="header-actions">
            <button className="action-btn">
              <Bug size={16} />
              Debug
            </button>
            <button className="action-btn">
              <Download size={16} />
              Export Log
            </button>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="reasoning-metrics">
          <div className="metric-card-small">
            <div className="metric-label-small">LATENCY</div>
            <div className="metric-value-small">{metrics.latency}</div>
          </div>
          <div className="metric-card-small">
            <div className="metric-label-small">TOKEN USAGE</div>
            <div className="metric-value-small">{metrics.tokens}</div>
          </div>
          <div className="metric-card-small">
            <div className="metric-label-small">MODEL VERSION</div>
            <div className="metric-value-small">{metrics.model}</div>
          </div>
          <div className="metric-card-small">
            <div className="metric-label-small">COST EST.</div>
            <div className="metric-value-small">{metrics.cost}</div>
          </div>
        </div>

        <div className="reasoning-main-layout">
          {/* Main Content - Execution Path */}
          <div className="execution-path-column">
            <div className="section-header-row">
              <h2 className="section-title">Execution Path</h2>
              <button className="expand-all-btn" onClick={toggleAll}>
                {showAllExpanded ? '[Collapse All]' : '[Expand All]'}
              </button>
            </div>

            <div className="execution-timeline">
              {traceSteps.map((step, index) => {
                const isActive = index <= currentStep
                const isExpanded = expandedSteps.has(index)
                const isCompleted = step.status === 'completed'
                const isWarning = step.status === 'warning'

                return (
                  <div
                    key={step.id}
                    className={`timeline-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''} ${isWarning ? 'warning' : ''}`}
                  >
                    <div className="step-indicator">
                      {isCompleted && <CheckCircle size={20} className="step-icon completed" />}
                      {isWarning && <AlertTriangle size={20} className="step-icon warning" />}
                      {!isActive && <div className="step-icon pending" />}
                      {index < traceSteps.length - 1 && <div className="step-connector" />}
                    </div>

                    <div className="step-content">
                      <div className="step-header" onClick={() => toggleStep(index)}>
                        <div className="step-title-row">
                          <h3 className="step-name">{step.name}</h3>
                          <div className="step-meta">
                            <span className="step-time">{step.time}</span>
                            <span className="step-confidence">{step.confidence}% CONFIDENCE</span>
                          </div>
                        </div>
                        <button className="expand-toggle">
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="step-details">
                          <div className="step-detail-item">
                            <span className="detail-label">Classification time:</span>
                            <span className="detail-value">{step.time}</span>
                          </div>
                          <div className="step-detail-item">
                            <span className="detail-label">Confidence:</span>
                            <span className="detail-value">{step.confidence}% CONFIDENCE</span>
                          </div>
                          {step.details && (
                            <div className="step-detail-text">{step.details}</div>
                          )}
                          {step.output && (
                            <div className="step-output">
                              <code>{step.output}</code>
                            </div>
                          )}
                          {step.warning && (
                            <div className="step-warning-box">
                              <AlertTriangle size={16} />
                              <div>
                                <div className="warning-title">{step.warning}</div>
                                {step.resolution && (
                                  <div className="warning-resolution">Resolution: {step.resolution}</div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right Sidebar - Analysis */}
          <div className="analysis-sidebar">
            {/* Confidence Analysis */}
            <div className="analysis-section">
              <h3 className="analysis-title">CONFIDENCE ANALYSIS</h3>
              <div className="certainty-display">
                <div className="certainty-score">{overallConfidence}%</div>
                <div className="certainty-label">
                  CERTAINTY SCORE
                  <span className="confidence-badge high">HIGH CONFIDENCE</span>
                </div>
                <div className="certainty-bar-container">
                  <div className="certainty-bar" style={{ width: `${overallConfidence}%` }}></div>
                </div>
              </div>

              <div className="rationale-section">
                <div className="rationale-label">RATIONALE:</div>
                <p className="rationale-text">
                  Exact schema match found for 90% of query tokens. Logic aligns with standard SQL patterns.
                </p>
              </div>

              <div className="risk-factor">
                <div className="risk-label">RISK FACTOR:</div>
                <div className="risk-text">
                  Ambiguous table name 'users' resolved via heuristic default.
                </div>
              </div>
            </div>

            {/* Context Sources */}
            <div className="analysis-section">
              <h3 className="analysis-title">CONTEXT SOURCES</h3>
              <div className="sources-list-analysis">
                <div className="source-item-analysis">
                  <FileJson size={14} className="source-icon-analysis" />
                  <span className="source-name-analysis">PostgreSQL Schema v4</span>
                  <span className="source-file-analysis">(`db_schema_prod.json`)</span>
                </div>
                <div className="source-item-analysis">
                  <FileJson size={14} className="source-icon-analysis" />
                  <span className="source-name-analysis">User Query History</span>
                  <span className="source-file-analysis">(`session_8823_logs`)</span>
                </div>
              </div>
            </div>

            {/* Raw Output JSON */}
            <div className="analysis-section">
              <h3 className="analysis-title">RAW OUTPUT JSON</h3>
              <div className="json-output">
                <pre>
{`{
  "trace_id": "8823-XJ",
  "status": "completed",
  "confidence": 87,
  "steps": [
    {
      "step": "intent_recognition",
      "time_ms": 12,
      "confidence": 99
    },
    {
      "step": "schema_lookup",
      "time_ms": 105,
      "confidence": 75,
      "warning": "Ambiguity detected"
    }
  ]
}`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReasoningConfidence

