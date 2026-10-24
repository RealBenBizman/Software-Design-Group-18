
import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute({ allowedRoles }) {
    const [status, setStatus] = useState("loading");
    const [user, setUser] = useState(null);

    useEffect(() => {
        let active = true;

        async function checkAuthentication() {
            try {
                const response = await fetch(
                    "http://localhost:3001/api/auth/me",
                    {
                        credentials: "include"
                    }
                );

                if (!response.ok) {
                    if (active) {
                        setStatus("unauthenticated");
                    }
                    return;
                }

                const data = await response.json();

                if (active) {
                    setUser(data.user);
                    setStatus("authenticated");
                }

            } catch (error) {
                console.error("Authentication check failed:", error);

                if (active) {
                    setStatus("unauthenticated");
                }
            }
        }

        checkAuthentication();

        return () => {
            active = false;
        };
    }, []);

    if (status === "loading") {
        return <p>Checking authentication...</p>;
    }

    if (status === "unauthenticated") {
        return <Navigate to="/login" replace />;
    }

    // The user is logged in, but may not have permission.
    if (allowedRoles && !allowedRoles.includes(user?.role)) {
        return <Navigate to="/unauthorized" replace />;
    }

    return <Outlet context={{ user }} />;
}
