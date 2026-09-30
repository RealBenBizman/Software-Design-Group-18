import { useState } from "react";
import { Link } from "react-router-dom";
function Login(){
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");


    function handleSubmit(event){
        event.preventDefault();
        console.log("Login Submitted");
    }
    return (
        <div>
            <h1>Login</h1>
            <p>Sign In to QueueSmart</p>
            <form onSubmit = {handleSubmit}>
                <label>Email</label>
                <input 
                type ="email"
                value ={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                />

                <label>Password</label>
                <input type ="password"
                value = {password}
                onChange= {(event) => setPassword(event.target.value)}
                required
                />

                <button type="submit">Login</button>
            </form>
            <p>
                Don't have aan account? <Link to="/register">Register</Link>
            </p>
        </div>
    );
}

export default Login;