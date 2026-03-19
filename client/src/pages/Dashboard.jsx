import { useState, useEffect, useContext } from "react";
import axios from "axios";
import AuthContext from "../context/AuthContext";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({
    pendingTasks: 0,
    upcomingEvents: 0,
  });
  const [quote, setQuote] = useState(null);
  const [pendingTasksList, setPendingTasksList] = useState([]);
  const [upcomingEventsList, setUpcomingEventsList] = useState([]);

  useEffect(() => {
    const fetchQuote = async () => {
      try {
        const { data } = await axios.get("http://localhost:5000/api/quote");
        setQuote(data);
      } catch (error) {
        console.error("Error fetching quote:", error);
      }
    };
    fetchQuote();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const config = {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        };

        // Fetch Tasks
        const tasksRes = await axios.get(
          "http://localhost:5000/api/tasks",
          config,
        );
        const pending = tasksRes.data.filter((t) => t.status !== "completed");
        setPendingTasksList(pending.slice(0, 5)); // Top 5

        // Fetch Events
        const eventsRes = await axios.get(
          "http://localhost:5000/api/events",
          config,
        );
        const now = new Date();
        const upcoming = eventsRes.data
          .filter((e) => new Date(e.start) >= now)
          .sort((a, b) => new Date(a.start) - new Date(b.start));
        setUpcomingEventsList(upcoming.slice(0, 5)); // Next 5

        setStats({
          pendingTasks: pending.length,
          upcomingEvents: upcoming.length,
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="animate-fade-in">
      <header style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>
          Good Day, {user.name}
        </h1>
        <p style={{ color: "var(--text-secondary)" }}>
          You have {stats.pendingTasks} pending tasks and {stats.upcomingEvents}{" "}
          upcoming events.
        </p>
      </header>

      {quote && (
        <div
          className="card"
          style={{
            background:
              "linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(168, 85, 247, 0.15))",
            borderLeft: "4px solid var(--primary-color)",
            marginBottom: "2rem",
            padding: "1.5rem",
          }}
        >
          <p
            style={{
              fontSize: "1.1rem",
              fontStyle: "italic",
              marginBottom: "0.5rem",
              color: "var(--text-primary)",
            }}
          >
            "{quote.text}"
          </p>
          <p style={{ color: "var(--text-secondary)", marginRight: "0" }}>
            — {quote.author}
          </p>
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "2rem",
          marginBottom: "2rem",
        }}
      >
        <Link
          to="/planner"
          style={{ textDecoration: "none", color: "inherit" }}
        >
          <div
            className="card"
            style={{
              background:
                "linear-gradient(135deg, var(--card-bg), rgba(99, 102, 241, 0.1))",
              border: "1px solid var(--primary-color)",
            }}
          >
            <h3>📋 AI Daily Plan</h3>
            <p style={{ color: "var(--text-secondary)" }}>
              Generate your focus plan for today.
            </p>
            <span style={{ color: "var(--primary-color)", fontWeight: "bold" }}>
              Generate Now &rarr;
            </span>
          </div>
        </Link>

        <div className="card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1rem",
            }}
          >
            <h3 style={{ margin: 0 }}>✅ Pending Tasks</h3>
            <Link
              to="/tasks"
              style={{ fontSize: "0.9rem", color: "var(--primary-color)" }}
            >
              View All
            </Link>
          </div>
          {pendingTasksList.length === 0 ? (
            <p style={{ color: "var(--text-secondary)" }}>No pending tasks.</p>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              {pendingTasksList.map((task) => (
                <div
                  key={task._id}
                  style={{
                    padding: "0.5rem",
                    background: "rgba(255,255,255,0.05)",
                    borderRadius: "4px",
                    fontSize: "0.9rem",
                  }}
                >
                  {task.title}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1rem",
            }}
          >
            <h3 style={{ margin: 0 }}>📅 Upcoming</h3>
            <Link
              to="/calendar"
              style={{ fontSize: "0.9rem", color: "var(--primary-color)" }}
            >
              View Calendar
            </Link>
          </div>
          {upcomingEventsList.length === 0 ? (
            <p style={{ color: "var(--text-secondary)" }}>
              No upcoming events.
            </p>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              {upcomingEventsList.map((ev) => (
                <div
                  key={ev._id}
                  style={{
                    padding: "0.5rem",
                    background: "rgba(255,255,255,0.05)",
                    borderRadius: "4px",
                  }}
                >
                  <div style={{ fontWeight: "bold", fontSize: "0.9rem" }}>
                    {ev.title}
                  </div>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {new Date(ev.start).toLocaleDateString()} at{" "}
                    {new Date(ev.start).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
