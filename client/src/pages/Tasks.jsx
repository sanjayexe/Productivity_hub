import { useState, useEffect, useContext } from "react";
import axios from "axios";
import AuthContext from "../context/AuthContext";

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("medium");
  const [subtasks, setSubtasks] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [nlInput, setNlInput] = useState("");
  const [isAddingNL, setIsAddingNL] = useState(false);
  const { user } = useContext(AuthContext);

  const fetchTasks = async () => {
    try {
      const config = {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      };
      const { data } = await axios.get(
        "http://localhost:5000/api/tasks",
        config,
      );
      setTasks(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const generateBreakdown = async () => {
    if (!title) {
        alert("Please enter a Title to generate a smart breakdown.");
        return;
    }
    setIsGenerating(true);
    try {
        const config = {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        };
        const { data } = await axios.post(
            "http://localhost:5000/api/tasks/smart-breakdown",
            { title, description },
            config
        );
        // Default to selected
        setSubtasks(data.map(st => ({ ...st, selected: true })));
    } catch (error) {
        console.error("Smart breakdown failed", error);
        alert("Failed to generate smart breakdown. Please try again.");
    } finally {
        setIsGenerating(false);
    }
  };

  const addTask = async (e) => {
    e.preventDefault();
    try {
      let dueDateISO = null;
      if (dueDate) {
        const now = new Date();
        const [hours, minutes] = dueDate.split(":");
        now.setHours(hours, minutes, 0, 0);
        dueDateISO = now.toISOString();
      }

      const config = {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      };
      
      const { data: newTask } = await axios.post(
        "http://localhost:5000/api/tasks",
        { title, description, priority, dueDate: dueDateISO, status: "pending" },
        config,
      );
      
      let newTasks = [newTask];
      
      const selectedSubtasks = subtasks.filter(st => st.selected);
      for (const st of selectedSubtasks) {
          const { data: subTaskData } = await axios.post(
            "http://localhost:5000/api/tasks",
            { title: st.title, description: `Dependency of: ${title}. Est. Duration: ${st.duration}`, priority: st.priority, dueDate: dueDateISO, status: "pending" },
            config,
          );
          newTasks.push(subTaskData);
      }

      setTasks((prev) => [...newTasks, ...prev]);
      setTitle("");
      setDescription("");
      setDueDate("");
      setSubtasks([]);
    } catch (error) {
      console.error(error);
    }
  };

  const addNLTask = async (e) => {
    e.preventDefault();
    if (!nlInput) return;
    setIsAddingNL(true);
    try {
      const config = {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      };
      const { data: newTask } = await axios.post(
        "http://localhost:5000/api/tasks/nl",
        { text: nlInput },
        config
      );
      setTasks((prev) => [newTask, ...prev]);
      setNlInput("");
    } catch (error) {
      console.error(error);
      alert("Failed to parse and add AI task. Please try again.");
    } finally {
      setIsAddingNL(false);
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      const config = {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      };
      // optimistic state update
      setTasks((prev) =>
        prev.map((t) => (t._id === id ? { ...t, status: newStatus } : t)),
      );
      await axios.put(
        `http://localhost:5000/api/tasks/${id}`,
        { status: newStatus },
        config,
      );
    } catch (error) {
      console.error(error);
      // rollback if needed: refetch
      fetchTasks();
    }
  };

  const getPriorityColor = (p) => {
    if (p === "high") return "#ef4444";
    if (p === "medium") return "#f59e0b";
    return "#10b981";
  };

  return (
    <div className="animate-fade-in">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
        }}
      >
        <h1>Tasks</h1>
      </div>

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "2rem" }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Quick Add with AI Card */}
          <div className="card" style={{ height: "fit-content", border: "1px solid var(--primary-color)", background: "linear-gradient(135deg, var(--card-bg), rgba(99, 102, 241, 0.05))" }}>
            <h3>✨ Quick Add with AI</h3>
            <form onSubmit={addNLTask}>
              <div style={{ marginBottom: "1rem" }}>
                <textarea
                  value={nlInput}
                  onChange={(e) => setNlInput(e.target.value)}
                  placeholder="e.g. Remind me to follow up with John next Tuesday, it's high priority"
                  style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid var(--border-color)", background: "var(--bg-secondary)", color: "var(--text-primary)", resize: "vertical", minHeight: "80px" }}
                  required
                />
              </div>
              <button
                type="submit"
                className="btn-primary"
                style={{ width: "100%" }}
                disabled={isAddingNL}
              >
                {isAddingNL ? "Parsing & Adding..." : "Create Task ✨"}
              </button>
            </form>
          </div>

          {/* Add Task Form */}
          <div className="card" style={{ height: "fit-content" }}>
            <h3>Add New Task</h3>
          <form onSubmit={addTask}>
            <div style={{ marginBottom: "1rem" }}>
              <label>Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What needs to be done?"
                required
              />
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <label>Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Details help the AI generate a better breakdown..."
                style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid var(--border-color)", background: "var(--bg-secondary)", color: "var(--text-primary)", resize: "vertical", minHeight: "80px" }}
              />
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <label>Due Time (Today)</label>
              <input
                type="time"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div style={{ marginBottom: "1.5rem" }}>
              <label>Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
              <button
                type="button"
                onClick={generateBreakdown}
                disabled={isGenerating}
                className="btn-secondary"
                style={{ width: "100%", marginBottom: "1rem", background: "transparent", border: "1px solid var(--primary-color)", color: "var(--primary-color)" }}
              >
                {isGenerating ? "Analyzing..." : "Smart Breakdown 🪄"}
              </button>

              {subtasks.length > 0 && (
                  <div style={{ marginBottom: "1.5rem", padding: "1rem", background: "rgba(0,0,0,0.2)", borderRadius: "8px" }}>
                      <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "0.9rem", color: "var(--text-secondary)" }}>Suggested Subtasks:</h4>
                      {subtasks.map((st, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", marginBottom: "0.5rem", gap: "0.5rem" }}>
                              <input 
                                  type="checkbox" 
                                  checked={st.selected} 
                                  onChange={(e) => {
                                      const updated = [...subtasks];
                                      updated[i].selected = e.target.checked;
                                      setSubtasks(updated);
                                  }}
                              />
                              <div style={{ fontSize: "0.85rem", flex: 1 }}>
                                  <strong>{st.title}</strong> <span style={{color: "var(--text-secondary)"}}>({st.duration})</span>
                              </div>
                          </div>
                      ))}
                  </div>
              )}

            <button
              type="submit"
              className="btn-primary"
              style={{ width: "100%" }}
            >
              Add Task
            </button>
          </form>
        </div>
        </div>

        {/* Task List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {tasks.map((task) => (
            <div
              key={task._id}
              className="card"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h4 style={{ margin: "0 0 0.5rem 0" }}>{task.title}</h4>
                {task.dueDate && (
                  <div
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--text-secondary)",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Due:{" "}
                    {new Date(task.dueDate).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                )}
                <select
                  value={task.status}
                  onChange={(e) => updateStatus(task._id, e.target.value)}
                  style={{
                    background: "rgba(255, 255, 255, 0.1)",
                    border: "1px solid var(--border-color)",
                    color: "var(--text-secondary)",
                    padding: "0.25rem 0.5rem",
                    fontSize: "0.8rem",
                    borderRadius: "4px",
                    width: "auto",
                  }}
                >
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <span
                style={{
                  padding: "0.25rem 0.75rem",
                  borderRadius: "20px",
                  background: `${getPriorityColor(task.priority)}20`,
                  color: getPriorityColor(task.priority),
                  fontSize: "0.8rem",
                  fontWeight: "bold",
                }}
              >
                {task.priority.toUpperCase()}
              </span>
            </div>
          ))}
          {tasks.length === 0 && (
            <p style={{ color: "var(--text-secondary)", textAlign: "center" }}>
              No tasks found. Add one!
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Tasks;
