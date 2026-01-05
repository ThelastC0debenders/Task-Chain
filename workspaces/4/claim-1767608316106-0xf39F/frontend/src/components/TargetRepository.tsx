import React from 'react'

const TargetRepository: React.FC = () => {
  return (
    <div className="card target-repo">
      <div className="card-title">
        <svg className="card-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        TARGET REPOSITORY
      </div>
      <div className="repo-url">github.com/openai/evals</div>
      <div className="repo-branch">Branch: main</div>
      <div className="commit-info">
        <span className="commit-id">8f3a2b9</span>
        <span className="commit-time">2m ago</span>
      </div>
    </div>
  )
}

export default TargetRepository

