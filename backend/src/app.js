const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const path = require('path');
const fs = require('fs');

// Import logger
const logger = require('./utils/logger');

// Import routes
const authRoutes = require('./routes/auth.routes');
const reconciliationRoutes = require('./routes/reconciliation.routes');
const auditRoutes = require('./routes/audit.routes');
const settingsRoutes = require('./routes/settings.routes');

// Import middleware
const { errorHandler, notFound } = require('./middleware/error.middleware');

// Create Express app
const app = express();

// Ensure required directories exist
const dirs = ['uploads', 'logs'];
dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, curl, Postman)
        if (!origin) return callback(null, true);

        // In development, allow any localhost origin
        if (process.env.NODE_ENV === 'development' && origin.includes('localhost')) {
            return callback(null, true);
        }

        // In production, only allow configured frontend URL
        if (origin === process.env.FRONTEND_URL) {
            return callback(null, true);
        }

        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security: Sanitize data to prevent NoSQL injection
app.use(mongoSanitize());

// Security: Prevent XSS attacks
app.use(xss());

// Security: Prevent HTTP Parameter Pollution
app.use(hpp());

// Response compression
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined', { stream: logger.stream }));
}

// Request logging middleware
app.use((req, res, next) => {
    logger.info({
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.get('user-agent')
    });
    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is healthy',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
});

// API info endpoint
app.get('/api', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Smart Reconciliation System API',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            reconciliation: '/api/reconciliation',
            audit: '/api/audit',
            settings: '/api/settings'
        }
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/reconciliation', reconciliationRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/settings', settingsRoutes);

// Serve uploaded files (protected route in production)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 404 handler (must be after all routes)
app.use(notFound);

// Global error handler (must be last)
app.use(errorHandler);

module.exports = app;
