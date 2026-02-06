const logger = require('../utils/logger');

// Global error handler
exports.errorHandler = (err, req, res, next) => {
    // Log error
    logger.error({
        message: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip
    });

    // Default error
    let error = {
        success: false,
        message: err.message || 'Internal server error'
    };

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(e => e.message);
        error = {
            success: false,
            message: 'Validation error',
            errors: messages
        };
        return res.status(400).json(error);
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        error = {
            success: false,
            message: `${field} already exists`
        };
        return res.status(400).json(error);
    }

    // Mongoose cast error
    if (err.name === 'CastError') {
        error = {
            success: false,
            message: 'Invalid ID format'
        };
        return res.status(400).json(error);
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        error = {
            success: false,
            message: 'Invalid token'
        };
        return res.status(401).json(error);
    }

    if (err.name === 'TokenExpiredError') {
        error = {
            success: false,
            message: 'Token expired'
        };
        return res.status(401).json(error);
    }

    // Multer file upload errors
    if (err.name === 'MulterError') {
        if (err.code === 'LIMIT_FILE_SIZE') {
            error = {
                success: false,
                message: 'File size too large'
            };
            return res.status(400).json(error);
        }
    }

    // Include stack trace in development
    if (process.env.NODE_ENV === 'development') {
        error.stack = err.stack;
    }

    // Send error response
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json(error);
};

// 404 Not Found handler
exports.notFound = (req, res, next) => {
    const error = new Error(`Route not found: ${req.originalUrl}`);
    error.statusCode = 404;
    next(error);
};

// Async error wrapper
exports.asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

module.exports = exports;
