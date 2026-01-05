import React from 'react'
import TargetRepository from '../components/TargetRepository'
import FilesIndexed from '../components/FilesIndexed'
import SystemVisualization from '../components/SystemVisualization'
import SystemEventsLog from '../components/SystemEventsLog'
import IndexingThroughput from '../components/IndexingThroughput'
import AIModelLoad from '../components/AIModelLoad'
import AskTheAgent from '../components/AskTheAgent'

const Dashboard: React.FC = () => {
  return (
    <>
      <div className="content">
        <div className="left-column">
          <TargetRepository />
          <FilesIndexed />
          <SystemVisualization />
        </div>
        <div className="middle-column">
          <SystemEventsLog />
        </div>
        <div className="right-column">
          <IndexingThroughput />
          <AIModelLoad />
        </div>
      </div>
      <div className="ask-agent-wrapper">
        <AskTheAgent />
      </div>
    </>
  )
}

export default Dashboard

