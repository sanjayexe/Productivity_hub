import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Link,
  useLocation,
} from "react-router-dom";
import { useContext, useState, useEffect } from "react";
import { AuthProvider } from "./context/AuthContext";
import AuthContext from "./context/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";
import CalendarPage from "./pages/Calendar"; // Loading lazy or standard
import Notes from "./pages/Notes";
import Planner from "./pages/Planner";
import "./index.css";
import Search from "./components/Search";

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div>Loading...</div>;

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
};

// Navigation Component
const Navigation = () => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();

  if (!user) return null;

  const isActive = (path) => (location.pathname === path ? "btn-primary" : "");
  const linkStyle = {
    textDecoration: "none",
    color: "var(--text-primary)",
    padding: "0.5rem 1rem",
    borderRadius: "var(--radius)",
    transition: "var(--transition)",
  };

  return (
    <nav
      style={{
        marginBottom: "2rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "1rem",
        background: "var(--card-bg)",
        borderRadius: "var(--radius)",
        border: "1px solid var(--border-color)",
      }}
    >
      <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
        <Link
          to="/"
          style={{ fontWeight: "bold", fontSize: "1.2rem", ...linkStyle }}
        >
          Hub
        </Link>
        <div
          style={{
            width: "1px",
            height: "24px",
            background: "var(--border-color)",
          }}
        ></div>
        <Link
          to="/"
          style={{
            ...linkStyle,
            background:
              location.pathname === "/"
                ? "var(--primary-color)"
                : "transparent",
          }}
        >
          Dashboard
        </Link>
        <Link
          to="/tasks"
          style={{
            ...linkStyle,
            background:
              location.pathname === "/tasks"
                ? "var(--primary-color)"
                : "transparent",
          }}
        >
          Tasks
        </Link>
        <Link
          to="/calendar"
          style={{
            ...linkStyle,
            background:
              location.pathname === "/calendar"
                ? "var(--primary-color)"
                : "transparent",
          }}
        >
          Calendar
        </Link>
        <Link
          to="/notes"
          style={{
            ...linkStyle,
            background:
              location.pathname === "/notes"
                ? "var(--primary-color)"
                : "transparent",
          }}
        >
          Notes
        </Link>
        <Link
          to="/planner"
          style={{
            ...linkStyle,
            background:
              location.pathname === "/planner"
                ? "var(--primary-color)"
                : "transparent",
          }}
        >
          AI Planner
        </Link>
        <Link
          to="/notifications"
          style={{
            ...linkStyle,
            background:
              location.pathname === "/notifications"
                ? "var(--primary-color)"
                : "transparent",
          }}
        >
          🔔
        </Link>
      </div>
      <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
        <Link
          to="/profile"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            textDecoration: "none",
          }}
        >
          {user.picture ? (
            <img
              src={user.picture}
              alt="Profile"
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                objectFit: "cover",
                border: "2px solid var(--primary-color)",
              }}
            />
          ) : (
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: "var(--primary-color)",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.9rem",
                fontWeight: "bold",
              }}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
          <span style={{ color: "var(--text-secondary)", fontWeight: "bold" }}>
            {user.name}
          </span>
        </Link>
        <button
          onClick={logout}
          style={{
            background: "transparent",
            color: "#ec4899",
            border: "1px solid #ec4899",
            padding: "0.4rem 1rem",
          }}
        >
          Logout
        </button>
      </div>
    </nav>
  );
};

// Placeholder for pages not yet created
const Placeholder = ({ title }) => (
  <div className="card animate-fade-in">
    <h1>{title}</h1>
    <p>Coming Soon...</p>
  </div>
);

function App() {
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setShowSearch((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <AuthProvider>
      <Router>
        {showSearch && <Search onClose={() => setShowSearch(false)} />}
        <div
          className="app-container"
          style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}
        >
          <Navigation />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <Notifications />
                </ProtectedRoute>
              }
            />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tasks"
              element={
                <ProtectedRoute>
                  <Tasks />
                </ProtectedRoute>
              }
            />
            <Route
              path="/calendar"
              element={
                <ProtectedRoute>
                  <CalendarPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notes"
              element={
                <ProtectedRoute>
                  <Notes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/planner"
              element={
                <ProtectedRoute>
                  <Planner />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
