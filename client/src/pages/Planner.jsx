import { useState } from "react";
import axios from "axios";

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

const Planner = () => {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);

  const generatePlan = async () => {
    setLoading(true);
    try {
      const config = {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      };
      const { data } = await axios.post(
        `${API_BASE_URL}/api/planner/generate`,
        {},
        config,
      );
      // Artificial delay to simulate "AI Thinking"
      setTimeout(() => {
        setPlan(data);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
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
        <h1>AI Daily Planner</h1>
      </div>

      {!plan && !loading && (
        <div style={{ textAlign: "center", padding: "4rem 0" }}>
          <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🤖</div>
          <h2 style={{ marginBottom: "1rem" }}>Ready to plan your day?</h2>
          <p
            style={{
              color: "var(--text-secondary)",
              marginBottom: "2rem",
              maxWidth: "500px",
              margin: "0 auto 2rem",
            }}
          >
            Our AI rule-engine will analyze your tasks, priorities, and calendar
            events to generate an optimal schedule for you.
          </p>
          <button
            onClick={generatePlan}
            className="btn-primary"
            style={{ fontSize: "1.2rem", padding: "1rem 2rem" }}
          >
            Generate Day Plan
          </button>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: "center", padding: "4rem 0" }}>
          <div
            className="animate-pulse"
            style={{ fontSize: "2rem", color: "var(--primary-color)" }}
          >
            Analyzing schedule...
          </div>
        </div>
      )}

      {plan && (
        <div className="animate-fade-in">
          <div
            className="card"
            style={{
              marginBottom: "2rem",
              borderLeft: "4px solid var(--primary-color)",
            }}
          >
            <h3 style={{ marginTop: 0 }}>Daily Summary</h3>
            <p style={{ fontSize: "1.1rem" }}>{plan.summary}</p>
          </div>

          <div
            className="planner-layout"
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr",
              gap: "2rem",
            }}
          >
            <div>
              <h3 style={{ marginBottom: "1rem" }}>Schedule</h3>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                {plan.schedule.map((item, index) => (
                  <div
                    key={index}
                    className="card"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      border:
                        item.type === "focus_block"
                          ? "1px solid var(--secondary-color)"
                          : "1px solid var(--border-color)",
                    }}
                  >
                    <div
                      style={{
                        marginRight: "1rem",
                        color:
                          item.type === "focus_block"
                            ? "var(--secondary-color)"
                            : "var(--text-secondary)",
                      }}
                    >
                      {item.type === "focus_block" ? "⚡" : "📅"}
                    </div>
                    <div>
                      <h4 style={{ margin: 0 }}>{item.title}</h4>
                      {item.start && (
                        <span
                          style={{
                            fontSize: "0.8rem",
                            color: "var(--text-secondary)",
                          }}
                        >
                          {new Date(item.start).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          -
                          {new Date(item.end).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      )}
                      {item.duration && (
                        <span
                          style={{
                            fontSize: "0.8rem",
                            color: "var(--text-secondary)",
                          }}
                        >
                          Duration: {item.duration}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 style={{ marginBottom: "1rem" }}>Metrics</h3>
              <div className="card">
                <div style={{ marginBottom: "1rem" }}>
                  <span
                    style={{
                      display: "block",
                      fontSize: "0.9rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Total Tasks
                  </span>
                  <span style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
                    {plan.metrics.totalTasks}
                  </span>
                </div>
                <div style={{ marginBottom: "1rem" }}>
                  <span
                    style={{
                      display: "block",
                      fontSize: "0.9rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    High Priority
                  </span>
                  <span
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: "bold",
                      color: "#ef4444",
                    }}
                  >
                    {plan.metrics.pendingHighPriority}
                  </span>
                </div>
                <div>
                  <span
                    style={{
                      display: "block",
                      fontSize: "0.9rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Events
                  </span>
                  <span style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
                    {plan.metrics.eventsCount}
                  </span>
                </div>
              </div>
              <button
                onClick={generatePlan}
                style={{
                  marginTop: "1rem",
                  width: "100%",
                  padding: "0.5rem",
                  background: "transparent",
                  border: "1px solid var(--border-color)",
                  color: "var(--text-primary)",
                }}
              >
                Regenerate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Planner;
