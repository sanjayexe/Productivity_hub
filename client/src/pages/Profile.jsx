import { useState, useContext, useEffect, useRef } from "react";
import axios from "axios";
import AuthContext from "../context/AuthContext";

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

const Profile = () => {
  const { user, login } = useContext(AuthContext);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState(null);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      // Create preview URL
      setPreview(URL.createObjectURL(file));
    }
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage("Passwords do not match");
    } else {
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "multipart/form-data",
          },
        };

        const formData = new FormData();
        formData.append("name", name);
        formData.append("email", email);
        if (password) {
          formData.append("password", password);
        }
        if (image) {
          formData.append("image", image);
        }

        const { data } = await axios.put(
          `${API_BASE_URL}/api/users/profile`,
          formData,
          config,
        );

        setMessage("Profile Updated Successfully");
        localStorage.setItem("user", JSON.stringify(data));
        localStorage.setItem("token", data.token);
        // Clear state
        setImage(null);
        setPreview(null);
        window.location.reload();
      } catch (error) {
        setMessage(error.response?.data?.message || "Error updating profile");
      }
    }
  };

  return (
    <div
      className="animate-fade-in"
      style={{ maxWidth: "500px", margin: "0 auto" }}
    >
      <div className="card">
        <h1 style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          User Profile
        </h1>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginBottom: "2rem",
          }}
        >
          <div
            style={{ position: "relative", cursor: "pointer" }}
            onClick={() => fileInputRef.current.click()}
          >
            {preview ? (
              <img
                src={preview}
                alt="Profile Preview"
                style={{
                  width: "100px",
                  height: "100px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "3px solid var(--primary-color)",
                }}
              />
            ) : user?.picture ? (
              <img
                src={user.picture}
                alt="Profile"
                style={{
                  width: "100px",
                  height: "100px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "3px solid var(--primary-color)",
                }}
              />
            ) : (
              <div
                style={{
                  width: "100px",
                  height: "100px",
                  borderRadius: "50%",
                  background: "var(--primary-color)",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "2.5rem",
                  fontWeight: "bold",
                }}
              >
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            )}
            <div
              style={{
                position: "absolute",
                bottom: "0",
                right: "0",
                background: "var(--bg-secondary)",
                borderRadius: "50%",
                padding: "5px",
                boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                viewBox="0 0 16 16"
              >
                <path d="M10.5 8.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z" />
                <path d="M2 4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1.172a2 2 0 0 1-1.414-.586l-.828-.828A2 2 0 0 0 9.172 2H6.828a2 2 0 0 0-1.414.586l-.828.828A2 2 0 0 1 3.172 4H2zm.5 2a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1zm9 2.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0z" />
              </svg>
            </div>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageChange}
            style={{ display: "none" }}
            accept="image/*"
          />
          <small
            style={{ marginTop: "0.5rem", color: "var(--text-secondary)" }}
          >
            Click image to update
          </small>
        </div>

        {message && (
          <div
            style={{
              padding: "0.5rem",
              marginBottom: "1rem",
              borderRadius: "4px",
              background: message.includes("Success")
                ? "rgba(16, 185, 129, 0.2)"
                : "rgba(239, 68, 68, 0.2)",
              color: message.includes("Success") ? "#10b981" : "#ef4444",
              textAlign: "center",
            }}
          >
            {message}
          </div>
        )}

        <form onSubmit={submitHandler}>
          <div style={{ marginBottom: "1rem" }}>
            <label>Name</label>
            <input
              type="text"
              placeholder="Enter name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <label>Email Address</label>
            <input
              type="email"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <small style={{ color: "var(--text-secondary)" }}>
              Leave blank to keep same
            </small>
          </div>
          <div style={{ marginBottom: "1.5rem" }}>
            <label>Confirm Password</label>
            <input
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="btn-primary"
            style={{ width: "100%" }}
          >
            Update Profile
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
