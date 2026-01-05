const fs = require('fs');
let c = fs.readFileSync('src/pages/leader-dashboard.tsx', 'utf8');

// Add createdBy to Task interface
if (!c.includes('createdBy?:')) {
  c = c.replace('claimedBy?: string', 'claimedBy?: string\n  createdBy?: string');
}

// Update handleCreateTask
const oldFunc = `function handleCreateTask() {
    if (!taskForm.title || !taskForm.description || !taskForm.deadline) {
      setStatus("❌ Please fill all task fields")
      return
    }

    const newTask: Task = {
      id: \`task-\${Date.now()}\`,
      title: taskForm.title,
      description: taskForm.description,
      priority: parseInt(taskForm.priority),
      deadline: taskForm.deadline,
      reward: taskForm.reward || "Not specified",
      status: "open",
    }

    setTasks([...tasks, newTask])
    setTaskForm({ title: "", description: "", priority: "1", deadline: "", reward: "" })
    setTaskFormOpen(false)
    setStatus("✅ Task created!")
  }`;

const newFunc = `async function handleCreateTask() {
    if (!taskForm.title || !taskForm.description || !taskForm.deadline) {
      setStatus("❌ Please fill all task fields")
      return
    }

    const newTask: Task = {
      id: \`task-\${Date.now()}\`,
      title: taskForm.title,
      description: taskForm.description,
      priority: parseInt(taskForm.priority),
      deadline: taskForm.deadline,
      reward: taskForm.reward || "Not specified",
      status: "open",
      createdBy: address || "unknown",
    }

    try {
      await axios.post(\`\${API}/task/create\`, { teamId, task: newTask })
      setTasks([...tasks, newTask])
      setTaskForm({ title: "", description: "", priority: "1", deadline: "", reward: "" })
      setTaskFormOpen(false)
      setStatus("✅ Task created!")
      await fetchTasks()
    } catch (err: any) {
      setStatus("❌ " + (err.response?.data?.error || err.message))
    }
  }`;

c = c.replace(oldFunc, newFunc);

// Add useEffect
c = c.replace('  function copyToClipboard()', `  useEffect(() => {
    if (activeTab === "tasks") {
      fetchTasks()
    }
  }, [activeTab])

  function copyToClipboard()`);

fs.writeFileSync('src/pages/leader-dashboard.tsx', c);
console.log('Updated leader-dashboard.tsx');
