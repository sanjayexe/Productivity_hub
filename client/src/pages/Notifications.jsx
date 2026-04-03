import { useState, useEffect } from "react";
import axios from "axios";

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const config = {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      };
      const { data } = await axios.get(
        `${API_BASE_URL}/api/notifications`,
        config,
      );
      setNotifications(data);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Optional: Poll for new notifications
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id) => {
    try {
      const config = {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      };
      await axios.put(
        `${API_BASE_URL}/api/notifications/${id}/read`,
        {},
        config,
      );
      // Update local state
      setNotifications(
        notifications.map((n) => (n._id === id ? { ...n, isRead: true } : n)),
      );
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div
      className="animate-fade-in"
      style={{ maxWidth: "800px", margin: "0 auto" }}
    >
      <h1 style={{ marginBottom: "2rem" }}>Notifications</h1>

      {loading ? (
        <p>Loading...</p>
      ) : notifications.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
          <p style={{ color: "var(--text-secondary)" }}>
            No notifications yet.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {notifications.map((notification) => (
            <div
              key={notification._id}
              className="card"
              style={{
                borderLeft: notification.isRead
                  ? "4px solid transparent"
                  : "4px solid var(--primary-color)",
                opacity: notification.isRead ? 0.7 : 1,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <p
                  style={{
                    margin: "0 0 0.5rem 0",
                    fontWeight: notification.isRead ? "normal" : "bold",
                  }}
                >
                  {notification.message}
                </p>
                <span
                  style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}
                >
                  {new Date(notification.createdAt).toLocaleString()}
                </span>
              </div>
              {!notification.isRead && (
                <button
                  onClick={() => markAsRead(notification._id)}
                  style={{
                    padding: "0.5rem 1rem",
                    fontSize: "0.8rem",
                    background: "transparent",
                    border: "1px solid var(--primary-color)",
                    color: "var(--primary-color)",
                    borderRadius: "4px",
                  }}
                >
                  Mark Read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
