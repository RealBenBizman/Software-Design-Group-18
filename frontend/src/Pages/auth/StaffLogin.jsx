
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import nebbLogo from "../../assets/QS Logo.png";
import "../../styles/Auth.css";

function StaffLogin() {
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

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error || "Unable to sign in"
                );
            }

            // The backend determines the user's role.
            if (data.user.role === "admin") {
                navigate("/admin", { replace: true });
            } else if (data.user.role === "employee") {
                navigate("/employee", { replace: true });
            } else {
                // A student account cannot access the staff portal.
                await fetch(
                    "http://localhost:3001/api/auth/logout",
                    {
                        method: "POST",
                        credentials: "include"
                    }
                );

                setError(
                    "This account does not have staff access."
                );
            }

        } catch (error) {
            console.error("Staff login error:", error);
            setError(error.message);

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

                <h1>Staff Login</h1>
                <p>Sign in to access the staff portal</p>

                <form onSubmit={handleSubmit}>
                    <label>Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(event) =>
                            setEmail(event.target.value)
                        }
                        required
                    />

                    <label>Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(event) =>
                            setPassword(event.target.value)
                        }
                        minLength={8}
                        required
                    />

                    {error && (
                        <p
                            role="alert"
                            style={{ color: "red" }}
                        >
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? "Signing In..." : "Sign In"}
                    </button>
                </form>

                <p>
                    <Link to="/login">
                        ← Back to student login
                    </Link>
                </p>
            </div>
        </div>
    );
}

export default StaffLogin;
