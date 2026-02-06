require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/database');
const logger = require('./utils/logger');

// Connect to database
connectDB();

// Get port from environment
const PORT = process.env.PORT || 5000;

// Start server
const server = app.listen(PORT, () => {
    logger.info(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    logger.info(`📡 Frontend URL: ${process.env.FRONTEND_URL}`);
    logger.info(`💾 Database: ${process.env.MONGODB_URI}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    logger.error(`Unhandled Promise Rejection: ${err.message}`);
    console.error(err);

    // Close server & exit process
    server.close(() => {
        logger.error('💥 Server closed due to unhandled promise rejection');
        process.exit(1);
    });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    logger.error(`Uncaught Exception: ${err.message}`);
    console.error(err);

    // Close server & exit process
    server.close(() => {
        logger.error('💥 Server closed due to uncaught exception');
        process.exit(1);
    });
});

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('👋 SIGTERM signal received: closing HTTP server');
    server.close(() => {
        logger.info('✅ HTTP server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    logger.info('👋 SIGINT signal received: closing HTTP server');
    server.close(() => {
        logger.info('✅ HTTP server closed');
        process.exit(0);
    });
});

module.exports = server;
