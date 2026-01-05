import type { Task } from "../types/task"

export default function TaskCard({ task }: { task: Task }) {
  return (
    <div>
      <p>{task.data}</p>
      <p>Status: {task.completed ? "Done" : "Open"}</p>
    </div>
  )
}
