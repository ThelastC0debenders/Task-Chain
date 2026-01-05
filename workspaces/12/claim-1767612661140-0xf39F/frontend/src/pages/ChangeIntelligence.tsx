import React from 'react'
import { Bot, X, ExternalLink, GitBranch, FileText, Code2, CheckCircle, Lock } from 'lucide-react'

const ChangeIntelligence: React.FC = () => {
  const sampleData = {
    traceId: '992-AC',
    commitId: '8f3a2d1',
    commitTime: '2023-10-27 14:02 UTC',
    author: 'System (CI/CD)',
    branch: 'release/v4.2',
    version: 'v4.2.0',
    prompt: 'User: Why is the risk assessment for Project Alpha elevated despite positive cash flow?',
    previousAnswer: '...risk is calculated based purely on current cash flow projections...',
    divergedAt: 'Output diverged at token 42',
    explanation: [
      'The system now prioritizes the `user_context` object over global defaults when calculating risk scores. Previously, the model would default to a standard risk profile unless specifically overridden by an admin flag.',
      'This change was introduced to fix the edge case reported in ticket #402 where project-specific parameters were being ignored in initial assessments. The response now correctly incorporates the "elevated" risk factor derived from the supply chain volatility metrics found in the project documentation.'
    ],
    diffFile: 'src/utils/risk_calculator.py',
    diffLines: [
      { line: 142, type: 'removed', content: 'risk_score = base_calculation(financials)' },
      { line: 143, type: 'added', content: 'risk_score = weighted_calculation(financials, context=user_context)' },
      { line: 144, type: 'unchanged', content: 'return normalize(risk_score)' }
    ],
    modifiedFiles: [
      { name: 'src/utils/risk_calc.py', icon: 'file' },
      { name: 'src/models/context.py', icon: 'file' },
      { name: 'config/weights.json', icon: 'json' }
    ],
    sessionId: '49f-x09-aa2'
  }

  return (
    <div className="page-container change-intelligence-page">
      <div className="page-content change-intelligence-content">
        <div className="change-intelligence-layout">
          {/* Left Column - Response Context */}
          <div className="response-context-column">
            <div className="response-header-section">
              <div className="response-id">
                <Bot size={20} className="response-icon" />
                <div>
                  <div className="response-id-text">Response #{sampleData.traceId}</div>
                  <div className="response-time">Generated 2m ago</div>
                </div>
              </div>
            </div>

            <div className="context-section">
              <div className="context-label">Prompt Input</div>
              <div className="context-content">{sampleData.prompt}</div>
            </div>

            <div className="context-section">
              <div className="context-label">Previous Answer (Diff)</div>
              <div className="diff-container">
                <div className="diff-line removed">
                  <span className="diff-line-number">-</span>
                  <span className="diff-content">{sampleData.previousAnswer}</span>
                </div>
                <div className="diverged-info">({sampleData.divergedAt})</div>
              </div>
            </div>
          </div>

          {/* Middle Column - Change Details */}
          <div className="change-details-column">
            {/* New Logic Deployed Banner */}
            <div className="new-logic-banner">
              <div className="banner-header">
                <Code2 size={18} className="banner-icon" />
                <div className="banner-title">
                  <span>New Logic Deployed: {sampleData.version}</span>
                  <span className="latest-badge">LATEST</span>
                </div>
              </div>
              <p className="banner-description">
                This response differs from previous outputs because the underlying logic model was updated 15 minutes ago.
              </p>
              <div className="banner-actions">
                <button className="banner-button dismiss">DISMISS</button>
                <button className="banner-button view">VIEW RELEASE NOTES</button>
              </div>
            </div>

            {/* Why this answer changed */}
            <div className="explanation-section">
              <div className="section-header">
                <span className="section-icon">?</span>
                <h3 className="section-title">Why this answer changed</h3>
              </div>
              <div className="explanation-content">
                {sampleData.explanation.map((para, index) => (
                  <p key={index}>{para}</p>
                ))}
              </div>
            </div>

            {/* Logic Diff Preview */}
            <div className="diff-preview-section">
              <div className="diff-preview-header">
                <Code2 size={16} />
                <span>LOGIC DIFF PREVIEW</span>
              </div>
              <div className="diff-file-path">{sampleData.diffFile}</div>
              <div className="code-diff">
                {sampleData.diffLines.map((line, index) => (
                  <div key={index} className={`diff-line ${line.type}`}>
                    <span className="diff-line-number">{line.line}</span>
                    <span className="diff-line-marker">
                      {line.type === 'removed' ? '-' : line.type === 'added' ? '+' : ' '}
                    </span>
                    <code className="diff-code">{line.content}</code>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Commit & Files */}
          <div className="commit-column">
            {/* Commit Details */}
            <div className="commit-details-section">
              <h3 className="column-title">COMMIT DETAILS</h3>
              <div className="commit-info">
                <div className="commit-id-display">{sampleData.commitId}</div>
                <div className="commit-meta">
                  <div className="meta-item">
                    <span className="meta-label">Time:</span>
                    <span className="meta-value">{sampleData.commitTime}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-icon">S</span>
                    <span className="meta-value">{sampleData.author}</span>
                  </div>
                  <div className="meta-item">
                    <GitBranch size={14} className="meta-icon" />
                    <span className="meta-value">{sampleData.branch}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modified Files */}
            <div className="modified-files-section">
              <h3 className="column-title">
                MODIFIED FILES
                <span className="file-count">3</span>
              </h3>
              <div className="files-list">
                {sampleData.modifiedFiles.map((file, index) => (
                  <div key={index} className="file-item">
                    {file.icon === 'json' ? (
                      <Code2 size={14} className="file-icon" />
                    ) : (
                      <FileText size={14} className="file-icon" />
                    )}
                    <span className="file-name">{file.name}</span>
                  </div>
                ))}
              </div>
              <button className="view-diff-button">
                View Full Diff
                <ExternalLink size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="change-intelligence-footer">
          <div className="footer-left">
            <div className="footer-badge">
              <CheckCircle size={14} />
              <span>Audit Trail Verified</span>
            </div>
            <div className="footer-badge">
              <Lock size={14} />
              <span>Encrypted Response</span>
            </div>
          </div>
          <div className="footer-right">
            <span className="session-id">Session ID: {sampleData.sessionId}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChangeIntelligence

