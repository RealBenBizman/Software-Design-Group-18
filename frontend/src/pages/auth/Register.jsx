
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import nebbLogo from "../../assets/QS Logo.png";
import "../../styles/Auth.css";

function Register() {
    const [userType, setUserType] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    async function handleSubmit(event) {
        event.preventDefault();

        // Check that passwords match
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        // Validate password length
        if (password.length < 8) {
            setError("Password must be at least 8 characters");
            return;
        }

        setError("");
        setLoading(true);

        try {
            // Send registration details to the backend
            const response = await fetch(
                "http://localhost:3001/api/auth/register",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        userType,
                        firstName,
                        lastName,
                        email,
                        phone,
                        password
                    })
                }
            );

            // Read the backend response
            const data = await response.json();

            // Handle registration errors
            if (!response.ok) {
                setError(data.error || "Registration failed");
                return;
            }

            // Registration succeeded
            console.log("Registration successful:", data.user);

            // Redirect the user to the login page
            navigate("/login");

        } catch (error) {
            console.error("Registration error:", error);
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

                <h1>Create Account</h1>
                <p>Join NEBB Queue and get started</p>

                <form
                    onSubmit={handleSubmit}
                    autoComplete="on"
                >
                    <label htmlFor="register-user-type">
                        Account Type
                    </label>
                    <select
                        id="register-user-type"
                        name="userType"
                        value={userType}
                        onChange={(event) =>
                            setUserType(event.target.value)
                        }
                        required
                    >
                        <option value="">
                            Select account type
                        </option>
                        <option value="student">
                            Student
                        </option>
                        <option value="applicant">
                            Applicant
                        </option>
                    </select>

                    <label htmlFor="register-first-name">
                        First Name
                    </label>
                    <input
                        id="register-first-name"
                        name="given-name"
                        type="text"
                        autoComplete="given-name"
                        value={firstName}
                        onChange={(event) =>
                            setFirstName(event.target.value)
                        }
                        required
                    />

                    <label htmlFor="register-last-name">
                        Last Name
                    </label>
                    <input
                        id="register-last-name"
                        name="family-name"
                        type="text"
                        autoComplete="family-name"
                        value={lastName}
                        onChange={(event) =>
                            setLastName(event.target.value)
                        }
                        required
                    />

                    <label htmlFor="register-email">
                        Email
                    </label>
                    <input
                        id="register-email"
                        name="email"
                        type="email"
                        autoComplete="username"
                        value={email}
                        onChange={(event) =>
                            setEmail(event.target.value)
                        }
                        required
                    />

                    <label htmlFor="register-phone">
                        Phone Number
                    </label>
                    <input
                        id="register-phone"
                        name="phone"
                        type="tel"
                        autoComplete="tel"
                        value={phone}
                        onChange={(event) =>
                            setPhone(event.target.value)
                        }
                        required
                    />

                    <label htmlFor="register-password">
                        Password
                    </label>
                    <input
                        id="register-password"
                        name="password"
                        type="password"
                        autoComplete="new-password"
                        value={password}
                        onChange={(event) =>
                            setPassword(event.target.value)
                        }
                        minLength={8}
                        required
                    />

                    <label htmlFor="register-confirm-password">
                        Confirm Password
                    </label>
                    <input
                        id="register-confirm-password"
                        name="confirmPassword"
                        type="password"
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(event) =>
                            setConfirmPassword(event.target.value)
                        }
                        minLength={8}
                        required
                    />

                    {error && (
                        <p className="auth-error">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                    >
                        {loading
                            ? "Creating Account..."
                            : "Create Account"}
                    </button>
                </form>

                <p>
                    Already have an account?{" "}
                    <Link to="/login">
                        Login
                    </Link>
                </p>
            </div>
        </div>
    );
}

export default Register;
