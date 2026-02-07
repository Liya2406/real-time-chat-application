import "./App.css"; // MUST be first
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Home from "./pages/Home";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

import NotificationsPage from "./pages/NotificationsPage";
function App() {
  // Default theme = dark, load saved theme if exists
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");

  // Apply theme on mount & when changed
  useEffect(() => {
    document.documentElement.className = theme; // <-- change from body to html
    localStorage.setItem("theme", theme);
  }, [theme]);


  const toggleTheme = () => {
    setTheme(prev => (prev === "light" ? "dark" : "light"));
  };

  return (
    <Router>
      {/* Theme Toggle Button */}
      <button
        className="theme-toggle"
        onClick={toggleTheme}

      >
        {theme === "light" ? "🌙 Dark" : "☀️ Light"}
      </button>

      <Routes>
        <Route
          path="/"
          element={
            <div style={{ textAlign: "center", marginTop: "50px" }}>
              <h1>Welcome to Chat App</h1>
              <div style={{ marginTop: "20px" }}>
                <Link to="/signup">
                  <button>Signup</button>
                </Link>
                <Link to="/login">
                  <button style={{ marginLeft: "10px" }}>Login</button>
                </Link>
              </div>
            </div>
          }
        />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
      </Routes>
    </Router>
  );
}

export default App;
