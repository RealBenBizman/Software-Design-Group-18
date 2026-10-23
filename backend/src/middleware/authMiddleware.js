import users from "../data/users.js";

// Check whether the request belongs to a logged-in user.
function requireAuth(req, res, next) {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({
            error: "Authentication required"
        });
    }

    const user = users.find(
        (user) => user.id === req.session.userId
    );

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
        userType: user.userType,
        role: user.role
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