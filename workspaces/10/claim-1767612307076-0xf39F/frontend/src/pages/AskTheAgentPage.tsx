import React, { useState } from 'react'
import { ThumbsUp, ThumbsDown, ArrowRight, FileText } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from "remark-gfm"
import "github-markdown-css/github-markdown.css"
import rehypeHighlight from "rehype-highlight"
import "highlight.js/styles/github-dark.css"



const AskTheAgentPage: React.FC = () => {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleExecute = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await fetch('http://localhost:8003/v1/agent/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      if (!res.ok) {
        throw new Error(`Error: ${res.statusText}`);
      }

      const data = await res.json();
      setResponse(data);
      setQuery(''); // Clear input on success
    } catch (err: any) {
      setError(err.message || 'Failed to fetch response');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container ask-agent-page">
      <div className="page-content ask-agent-content">
        <div className="agent-main-layout">
          {/* Main Content Area */}
          <div className="agent-main-content">
            {/* Generated Response Section */}
            {response ? (
              <div className="generated-response-section">
                <div className="response-header">
                  <h2 className="response-title">GENERATED_RESPONSE // ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</h2>
                  <div className="response-feedback">
                    <button className="feedback-button">
                      <ThumbsUp size={16} />
                    </button>
                    <button className="feedback-button">
                      <ThumbsDown size={16} />
                    </button>
                  </div>
                </div>

                <div className="response-content">
                  <div className="response-text">
                    {/* Render markdown as simple text for now, or use a markdown library if available later */}
                    {/* Render markdown using react-markdown */}
                   <div className="response-text markdown-body">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeHighlight]} // optional but 🔥
                        skipHtml
                      >
                        {response.explanation}
                      </ReactMarkdown>
                    </div>
                  </div>

                  {response.code && (
                    <div className="response-code">
                      <pre><code>{response.code}</code></pre>
                    </div>
                  )}

                  {response.instruction && (
                    <div className="response-instruction">
                      <p>{response.instruction}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="generated-response-section empty-state">
                <div className="response-content">
                  {loading ? <p>Thinking...</p> : <p>Enter a query to start.</p>}
                  {error && <p className="error-text" style={{ color: 'red' }}>{error}</p>}
                </div>
              </div>
            )}

            {/* Input Sequence Section */}
            <div className="input-sequence-section">
              <div className="input-header">
                <h3 className="input-title">INPUT_SEQUENCE</h3>
                <span className="input-status">{loading ? 'STATUS: PROCESSING' : 'STATUS: AWAITING_INPUT'}</span>
              </div>

              <textarea
                className="query-input"
                placeholder="// Enter system query regarding architecture or debug trace..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                rows={6}
                disabled={loading}
              />

              <div className="input-actions">
                <button className="action-button" disabled={loading}>ATTACH</button>
                <button className="action-button" disabled={loading}>HISTORY</button>
                <button className="action-button primary" onClick={handleExecute} disabled={loading}>
                  {loading ? 'EXECUTING...' : 'EXECUTE'}
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="agent-sidebar">
            {/* Confidence Score */}
            <div className="sidebar-section">
              <h3 className="sidebar-title">Confidence Score</h3>
              <div className="confidence-display">
                <div className="confidence-bar-container">
                  <div
                    className="confidence-bar"
                    style={{ width: `${(response?.confidence || 0) * 100}%` }}
                  ></div>
                </div>
                <div className="confidence-value">{((response?.confidence || 0) * 100).toFixed(1)}%</div>
              </div>
              <p className="confidence-text">{response?.confidence_level || 'N/A'}</p>
            </div>

            {/* Referenced Sources */}
            <div className="sidebar-section">
              <h3 className="sidebar-title">Referenced Sources</h3>
              <div className="sources-count">{response?.sources?.length || 0} sources</div>
              <div className="sources-list">
                {response?.sources?.map((source: any, index: number) => (
                  <div key={index} className="source-item">
                    <div className="source-header">
                      <FileText size={14} className="source-icon" />
                      <span className="source-file" title={source.file}>{source.file.split('/').pop()}</span>
                    </div>
                    <div className="source-details">
                      <span className="source-lines">{source.lines}</span>
                    </div>
                  </div>
                ))}
                {!response && <div className="source-item"><span className="source-file">No sources yet</span></div>}
              </div>
            </div>

            {/* Metrics */}
            <div className="sidebar-metrics">
              <div className="metric-item">
                <span className="metric-label">STRATEGY:</span>
                <span className="metric-value">{response?.strategy || '-'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AskTheAgentPage

