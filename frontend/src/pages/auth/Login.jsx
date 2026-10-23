
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import nebbLogo from "../../assets/QS Logo.png";
import "../../styles/Auth.css";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    async function handleSubmit(event) {
        event.preventDefault();

        setError("");
        setLoading(true);

        try {
            // Send login credentials to the backend
            const response = await fetch(
                "http://localhost:3001/api/auth/login",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    credentials: "include",
                    body: JSON.stringify({
                        email,
                        password
                    })
                }
            );

            // Read the backend response
            const data = await response.json();

            // Handle incorrect credentials
            if (!response.ok) {
                setError(data.error || "Login failed");
                return;
            }

            // Login credentials verified successfully
            console.log("Login successful:", data.user);

            // Navigate to the student dashboard
            navigate("/dashboard");

        } catch (error) {
            console.error("Login error:", error);
            setError("Unable to connect to the server");

        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <img
                    src={nebbLogo}
                    alt="NEBB Queue"
                    className="auth-logo"
                />

                <h1>Welcome Back</h1>
                <p>Sign in to your account</p>

                <form onSubmit={handleSubmit}>
                    <label>Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                    />

                    <label>Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                    />

                    {error && (
                        <p className="auth-error">{error}</p>
                    )}

                    <button type="submit" disabled={loading}>
                        {loading ? "Signing In..." : "Login"}
                    </button>
                </form>

                <p>
                    Don't have an account?{" "}
                    <Link to="/register">Register</Link>
                </p>

                <p>
                    Staff member?{" "}
                    <Link to="/staff-login">Staff Sign In</Link>
                </p>
            </div>
        </div>
    );
}

export default Login;
