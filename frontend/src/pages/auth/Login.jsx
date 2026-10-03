import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import nebbLogo from "../../assets/QS Logo.png";
import "../../styles/Auth.css";

function Login(){
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();


    function handleSubmit(event) {
    event.preventDefault();

    navigate("/dashboard");
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
                    minLength={8}
                    required
                />

                <label>Password</label>
                <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    minLength={8}
                    required
                />

                <button type="submit">Login</button>
            </form>

            <p>
                Don't have an account? <Link to="/register">Register</Link>
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