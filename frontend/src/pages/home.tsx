import { useState } from "react"
import axios from "axios"
import { Link } from "react-router-dom"

const API = "http://localhost:5000"

export default function Home() {
  const [taskIdClaim, setTaskIdClaim] = useState("")
  const [taskIdComplete, setTaskIdComplete] = useState("")
  const [taskIdGet, setTaskIdGet] = useState("")
  const [output, setOutput] = useState<any[]>([])

  function log(msg: any, isError = false) {
    setOutput(prev => [{ msg, isError, time: new Date().toLocaleTimeString() }, ...prev])
  }

  async function createTask() {
    try {
      const deadline = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60)
      const res = await axios.post(`${API}/task/create`, {
        metadataHash: "0x1234567890123456789012345678901234567890123456789012345678901234",
        deadline,
        gracePeriod: 86400,
        priority: 1
      })
      log(res.data)
    } catch (err: any) {
      log(err.response?.data?.error || err.message, true)
    }
  }

  async function claimTask() {
    try {
      const res = await axios.post(`${API}/task/claim`, {
        taskId: parseInt(taskIdClaim),
        commitment: 1
      })
      log(res.data)
    } catch (err: any) {
      log(err.response?.data?.error || err.message, true)
    }
  }

  async function completeTask() {
    try {
      const res = await axios.post(`${API}/receipt/anchor`, {
        taskId: parseInt(taskIdComplete),
        completedBy: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
      })
      log(res.data)
    } catch (err: any) {
      log(err.response?.data?.error || err.message, true)
    }
  }

  async function getTask() {
    try {
      const res = await axios.get(`${API}/task/${taskIdGet}`)
      log(res.data)
    } catch (err: any) {
      log(err.response?.data?.error || err.message, true)
    }
  }

  return (
    <div style={{ fontFamily: "Arial", padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h1>TaskChain API Tester</h1>
      
      <div>
        {output.map((item, i) => (
          <pre 
            key={i}
            style={{ 
              background: item.isError ? "#f8d7da" : "#d4edda", 
              padding: "10px", 
              borderRadius: "5px", 
              overflowX: "auto",
              marginBottom: "10px"
            }}
          >
            [{item.time}] {JSON.stringify(item.msg, null, 2)}
          </pre>
        ))}
      </div>
      
      <h2>1. Create Task</h2>
      <button onClick={createTask} style={{ padding: "10px 20px", margin: "5px", cursor: "pointer" }}>
        Create Task
      </button>
      
      <h2>2. Claim Task</h2>
      <input 
        id="taskIdClaim" 
        placeholder="Task ID" 
        type="number"
        value={taskIdClaim}
        onChange={e => setTaskIdClaim(e.target.value)}
        style={{ padding: "8px", marginRight: "5px" }}
      />
      <button onClick={claimTask} style={{ padding: "10px 20px", margin: "5px", cursor: "pointer" }}>
        Claim Task
      </button>
      
      <h2>3. Complete Task (Anchor Receipt)</h2>
      <input 
        id="taskIdComplete" 
        placeholder="Task ID" 
        type="number"
        value={taskIdComplete}
        onChange={e => setTaskIdComplete(e.target.value)}
        style={{ padding: "8px", marginRight: "5px" }}
      />
      <button onClick={completeTask} style={{ padding: "10px 20px", margin: "5px", cursor: "pointer" }}>
        Complete Task
      </button>
      
      <h2>4. Get Task Details</h2>
      <input 
        id="taskIdGet" 
        placeholder="Task ID" 
        type="number"
        value={taskIdGet}
        onChange={e => setTaskIdGet(e.target.value)}
        style={{ padding: "8px", marginRight: "5px" }}
      />
      <button onClick={getTask} style={{ padding: "10px 20px", margin: "5px", cursor: "pointer" }}>
        Get Task
      </button>

      <h2>Navigation</h2>
      <Link to="/another-page" style={{ padding: "10px 20px", margin: "5px", display: "inline-block", background: "#007bff", color: "white", textAlign: "center", borderRadius: "5px", textDecoration: "none" }}>
        Go to Another Page
      </Link>
    </div>
  )
}
