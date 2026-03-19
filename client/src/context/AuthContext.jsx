import { createContext, useState, useEffect } from "react";
import axios from "axios";

// Enable credentials globally for all axios requests (for cookie handling)
axios.defaults.withCredentials = true;

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserLoggedIn = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const config = {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          };
          const { data } = await axios.get(
            "http://localhost:5000/api/users/me",
            config,
          );
          setUser(data);
        } catch (error) {
          localStorage.removeItem("token");
        }
      }
      setLoading(false);
    };
    checkUserLoggedIn();
  }, []);

  const login = async (email, password) => {
    const { data } = await axios.post("http://localhost:5000/api/users/login", {
      email,
      password,
    });
    localStorage.setItem("token", data.token);
    setUser(data);
  };

  const register = async (name, email, password) => {
    // Just sends OTP now, no token returned
    await axios.post("http://localhost:5000/api/users", {
      name,
      email,
      password,
    });
  };

  const verifyOtp = async (email, otp) => {
    const { data } = await axios.post(
      "http://localhost:5000/api/users/verify-otp",
      { email, otp },
    );
    localStorage.setItem("token", data.token);
    setUser(data);
  };

  const googleSignIn = async (token) => {
    const { data } = await axios.post(
      "http://localhost:5000/api/users/google-login",
      { token },
    );
    localStorage.setItem("token", data.token);
    setUser(data);
  };

  const logout = async () => {
    try {
      await axios.post("http://localhost:5000/api/users/logout");
    } catch (e) {
      console.warn("logout request failed", e);
    }
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        verifyOtp,
        googleSignIn,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
