import { useState } from "react";
import { useNavigate, Link } from "react-router-dom"; // ✅ import Link and useNavigate

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate(); // ✅ for redirect after login

    const handleLogin = async (e) => {
        e.preventDefault();

        const response = await fetch("http://localhost:5000/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();
        if (response.ok) {
            // ✅ store JWT in localStorage
            localStorage.setItem("token", data.token);

            alert(data.message || "Login successful");
            navigate("/home");  // redirect to user home page
        } else {
            alert(data.message || "Login failed");
        }
    };

    return (
        <div style={{ padding: "40px" }}>
            <h2>Login</h2>

            <form onSubmit={handleLogin}>
                <input
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <br /><br />

                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <br /><br />

                <button type="submit">Login</button>
            </form>
            {/* ✅ Forgot Password link */}
            <p>
                <Link to="/forgot-password">Forgot Password?</Link>
            </p>

            {/* ✅ Link to Signup page */}
            <p>
                Don't have an account? <Link to="/signup">Signup here</Link>
            </p>
        </div>
    );
}

export default Login;
