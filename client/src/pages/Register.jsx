import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import { GoogleLogin } from "@react-oauth/google";
import axios from "axios";

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1); // 1: Register, 2: Verify OTP

  const { register, verifyOtp, googleSignIn } = useContext(AuthContext);
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  // Password validation regex
  const PASSWORD_REGEX =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  const getPasswordStrength = () => {
    if (!password) return { level: 0, text: "", color: "" };
    const checks = {
      length: password.length >= 8,
      upper: /[A-Z]/.test(password),
      lower: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[@$!%*?&]/.test(password),
    };
    const count = Object.values(checks).filter(Boolean).length;

    if (count < 2) return { level: 1, text: "Weak", color: "#ef4444" };
    if (count < 4) return { level: 2, text: "Fair", color: "#f59e0b" };
    if (count < 5) return { level: 3, text: "Good", color: "#eab308" };
    return { level: 4, text: "Strong", color: "#10b981" };
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      await googleSignIn(credentialResponse.credential);
      navigate("/");
    } catch (err) {
      setError("Google Login Failed");
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!PASSWORD_REGEX.test(password)) {
      setError(
        "Password must be at least 8 characters with uppercase, lowercase, number, and special character (@$!%*?&)",
      );
      return;
    }

    try {
      setLoading(true);
      setError("");
      await register(name, email, password);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerification = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");
      await verifyOtp(email, otp);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      setResendLoading(true);
      setError("");
      const response = await axios.post(
        `${API_BASE_URL}/api/users/resend-otp`,
        {
          email,
        },
      );
      setError("");
      alert(response.data.message);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend OTP");
    } finally {
      setResendLoading(false);
    }
  };

  const strength = getPasswordStrength();

  return (
    <div
      className="animate-fade-in"
      style={{ maxWidth: "400px", margin: "4rem auto" }}
    >
      <div className="card">
        <h2 style={{ textAlign: "center", marginBottom: "2rem" }}>
          {step === 1 ? "Create Account" : "Verify Email"}
        </h2>
        {error && (
          <div
            style={{
              color: "#ec4899",
              marginBottom: "1rem",
              textAlign: "center",
              fontSize: "0.9rem",
            }}
          >
            {error}
          </div>
        )}

        {step === 1 && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: "1.5rem",
            }}
          >
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError("Google Login Failed")}
            />
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleRegister}>
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem" }}>
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem" }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div style={{ marginBottom: "0.5rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem" }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Min 8 chars, 1 uppercase, 1 number, 1 special (@$!%*?&)"
              />
            </div>
            {password && (
              <div style={{ marginBottom: "1rem" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "0.5rem",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.85rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Strength:
                  </span>
                  <span
                    style={{
                      fontSize: "0.85rem",
                      color: strength.color,
                      fontWeight: "bold",
                    }}
                  >
                    {strength.text}
                  </span>
                </div>
                <div style={{ display: "flex", gap: "0.25rem", height: "4px" }}>
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        backgroundColor:
                          i <= strength.level ? strength.color : "#e5e7eb",
                        borderRadius: "2px",
                        transition: "background-color 0.3s",
                      }}
                    />
                  ))}
                </div>
                <ul
                  style={{
                    fontSize: "0.8rem",
                    marginTop: "0.5rem",
                    paddingLeft: "1.5rem",
                    color: "var(--text-secondary)",
                  }}
                >
                  <li
                    style={{
                      color: /[A-Z]/.test(password) ? "#10b981" : "inherit",
                    }}
                  >
                    {/[A-Z]/.test(password) ? "✓" : "○"} Uppercase letter
                  </li>
                  <li
                    style={{
                      color: /[a-z]/.test(password) ? "#10b981" : "inherit",
                    }}
                  >
                    {/[a-z]/.test(password) ? "✓" : "○"} Lowercase letter
                  </li>
                  <li
                    style={{
                      color: /\d/.test(password) ? "#10b981" : "inherit",
                    }}
                  >
                    {/\d/.test(password) ? "✓" : "○"} Number
                  </li>
                  <li
                    style={{
                      color: /[@$!%*?&]/.test(password) ? "#10b981" : "inherit",
                    }}
                  >
                    {/[@$!%*?&]/.test(password) ? "✓" : "○"} Special character
                    (@$!%*?&)
                  </li>
                </ul>
              </div>
            )}
            <div style={{ marginBottom: "2rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem" }}>
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              {confirmPassword && password !== confirmPassword && (
                <p
                  style={{
                    color: "#ef4444",
                    fontSize: "0.85rem",
                    marginTop: "0.5rem",
                  }}
                >
                  Passwords don't match
                </p>
              )}
            </div>
            <button
              type="submit"
              className="btn-primary"
              style={{ width: "100%", opacity: loading ? 0.5 : 1 }}
              disabled={loading}
            >
              {loading ? "Signing Up..." : "Sign Up"}
            </button>
            <p
              style={{
                marginTop: "1rem",
                textAlign: "center",
                color: "var(--text-secondary)",
              }}
            >
              Already have an account?{" "}
              <Link to="/login" style={{ color: "var(--primary-color)" }}>
                Login
              </Link>
            </p>
          </form>
        ) : (
          <form onSubmit={handleOtpVerification}>
            <p
              style={{
                textAlign: "center",
                marginBottom: "1rem",
                color: "var(--text-secondary)",
              }}
            >
              We sent a 6-digit code to
              <br />
              <strong>{email}</strong>
            </p>
            <div style={{ marginBottom: "2rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem" }}>
                Enter OTP
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                required
                maxLength="6"
                style={{
                  letterSpacing: "0.5rem",
                  textAlign: "center",
                  fontSize: "1.5rem",
                }}
              />
            </div>
            <button
              type="submit"
              className="btn-primary"
              style={{ width: "100%", opacity: loading ? 0.5 : 1 }}
              disabled={loading}
            >
              {loading ? "Verifying..." : "Verify & Login"}
            </button>
            <button
              type="button"
              onClick={handleResendOTP}
              disabled={resendLoading}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--primary-color)",
                width: "100%",
                marginTop: "1rem",
                cursor: "pointer",
                opacity: resendLoading ? 0.5 : 1,
              }}
            >
              {resendLoading ? "Sending..." : "Didn't receive? Resend OTP"}
            </button>
            <button
              type="button"
              onClick={() => setStep(1)}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--text-secondary)",
                width: "100%",
                marginTop: "0.5rem",
                cursor: "pointer",
              }}
            >
              Use different email
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Register;
