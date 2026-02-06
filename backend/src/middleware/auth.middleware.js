const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/env');

// Authenticate user with JWT
exports.authenticate = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Authentication token required'
            });
        }

        const token = authHeader.split(' ')[1];

        try {
            // Verify token
            const decoded = jwt.verify(token, config.jwtSecret);

            // Get user from database
            const user = await User.findById(decoded.id).select('-password -refreshToken');

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found'
                });
            }

            if (!user.isActive) {
                return res.status(401).json({
                    success: false,
                    message: 'Account is inactive'
                });
            }

            // Attach user to request
            req.user = user;
            next();
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: 'Token expired',
                    code: 'TOKEN_EXPIRED'
                });
            }

            return res.status(401).json({
                success: false,
                message: 'Invalid authentication token'
            });
        }
    } catch (error) {
        next(error);
    }
};

// Authorize user based on roles
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Insufficient permissions',
                requiredRoles: roles,
                userRole: req.user.role
            });
        }

        next();
    };
};

// Check specific permission
exports.checkPermission = (permission) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const hasPermission =
            req.user.role === 'admin' ||
            req.user.permissions.includes(permission);

        if (!hasPermission) {
            return res.status(403).json({
                success: false,
                message: `Permission denied: ${permission} required`
            });
        }

        next();
    };
};

module.exports = exports;
