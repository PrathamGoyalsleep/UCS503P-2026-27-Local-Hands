const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        try {
            token = req.headers.authorization.split(" ")[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || "defaultsecret");

            const user = await User.findById(decoded.id).select("-password");
            if (!user) {
                return res.status(401).json({ message: "Not authorized, user not found" });
            }
            req.user = user;
            return next();
        } catch (error) {
            console.error("Auth error:", error.message);
            return res.status(401).json({ message: "Not authorized, token failed" });
        }
    }

    if (!token) {
        return res.status(401).json({ message: "Not authorized, no token" });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: "User role not authorized for this action" });
        }
        next();
    };
};

module.exports = { protect, authorize };

