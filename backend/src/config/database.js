const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            maxPoolSize: 10, // Maximum number of concurrent connections
            minPoolSize: 2,  // Minimum number of connections to maintain
            socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
            serverSelectionTimeoutMS: 5000, // Fail fast if can't connect to server
            heartbeatFrequencyMS: 10000 // Check server health every 10 seconds
        });

        logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);

        // Handle connection errors after initial connection
        mongoose.connection.on('error', (err) => {
            logger.error(`MongoDB connection error: ${err.message}`);
        });

        mongoose.connection.on('disconnected', () => {
            logger.warn('⚠️ MongoDB disconnected');
        });

        mongoose.connection.on('reconnected', () => {
            logger.info('🔄 MongoDB reconnected');
        });

        // Graceful shutdown
        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            logger.info('MongoDB connection closed through app termination');
            process.exit(0);
        });

    } catch (error) {
        logger.error(`❌ Error connecting to MongoDB: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
