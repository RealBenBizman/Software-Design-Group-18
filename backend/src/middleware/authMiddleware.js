
import { findUserById } from "../data/userRepository.js";

// Check whether the request belongs to a logged-in user.
function requireAuth(req, res, next) {
    if (!req.session?.userId) {
        return res.status(401).json({
            error: "Authentication required"
        });
    }

    // Retrieve the authenticated user from SQLite.
    const user = findUserById(req.session.userId);

    if (!user) {
        return res.status(401).json({
            error: "User not found"
        });
    }

    // Make the authenticated user available to later middleware.
    req.user = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        userType: user.userType,
        role: user.role,
        employeeId: user.employeeId
    };

    next();
}

// Restrict an endpoint to specific user roles.
function requireRole(...allowedRoles) {
    return function (req, res, next) {
        if (!req.user) {
            return res.status(401).json({
                error: "Authentication required"
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                error: "Access denied: insufficient permissions"
            });
        }

        next();
    };
}

export { requireAuth, requireRole };
