import React from 'react'

const FilesIndexed: React.FC = () => {
  const count = 1418000
  const progress = 85

  const formattedCount = count.toLocaleString()

  return (
    <div className="card files-indexed">
      <div className="card-title">FILES INDEXED</div>
      <div className="files-count">{formattedCount}</div>
      <div className="files-trend">
        <svg className="trend-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
        <span className="trend-text">+2.4k / sec</span>
      </div>
      <div className="progress-bar-container">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }}></div>
        </div>
        <div className="progress-text">{progress}% Complete</div>
      </div>
    </div>
  )
}

export default FilesIndexed

