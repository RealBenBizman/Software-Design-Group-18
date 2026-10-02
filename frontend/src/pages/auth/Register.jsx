import { useState } from "react";
import { Link } from "react-router-dom";
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

    function handleSubmit(event) {
        event.preventDefault();

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setError("");
        console.log("Registration submitted");
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <h1>Register</h1>
                <p>Create your QueueSmart account</p>

                <form onSubmit={handleSubmit}>
                    <label>Account Type</label>
                    <select
                        value={userType}
                        onChange={(event) => setUserType(event.target.value)}
                        required
                    >
                        <option value="">Select account type</option>
                        <option value="student">Student</option>
                        <option value="applicant">Applicant</option>
                    </select>

                    <label>First Name</label>
                    <input
                        type="text"
                        value={firstName}
                        onChange={(event) => setFirstName(event.target.value)}
                        required
                    />

                    <label>Last Name</label>
                    <input
                        type="text"
                        value={lastName}
                        onChange={(event) => setLastName(event.target.value)}
                        required
                    />

                    <label>Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                    />

                    <label>Phone Number</label>
                    <input
                        type="tel"
                        value={phone}
                        onChange={(event) => setPhone(event.target.value)}
                        required
                    />

                    <label>Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                    />

                    <label>Confirm Password</label>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(event) =>
                            setConfirmPassword(event.target.value)
                        }
                        required
                    />

                    {error && <p className="auth-error">{error}</p>}

                    <button type="submit">Create Account</button>
                </form>

                <p>
                    Already have an account?{" "}
                    <Link to="/login">Login</Link>
                </p>
            </div>
        </div>
    );
}

export default Register;