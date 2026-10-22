
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const crypto = require("crypto");
const authRoutes = require("./routes/authRoutes");

const app = express();

// Allow requests from the React frontend
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));

// Parse incoming JSON requests
app.use(express.json());

// Configure server-side sessions
const isProduction = process.env.NODE_ENV === "production";

const sessionSecret = process.env.SESSION_SECRET;

if (isProduction && !sessionSecret) {
    throw new Error("SESSION_SECRET is required in production");
}

app.use(session({
    name: "nebb.sid",

    secret: sessionSecret || crypto.randomBytes(32).toString("hex"),

    resave: false,

    saveUninitialized: false,

    cookie: {
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
        maxAge: 1000 * 60 * 60 * 2
    }
}));

// Health check endpoint
app.get("/api/health", (req, res) => {
    res.status(200).json({
        message: "NEBB Queue backend is running"
    });
});

// Authentication routes
app.use("/api/auth", authRoutes);

module.exports = app;
