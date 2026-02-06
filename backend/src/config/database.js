const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
    try {
        // Validate MONGODB_URI exists
        if (!process.env.MONGODB_URI) {
            const error = '❌ FATAL ERROR: MONGODB_URI environment variable is not set!';
            console.error(error);
            logger.error(error);
            process.exit(1);
        }

        console.log('🔄 Attempting to connect to MongoDB...');
        console.log(`   MongoDB URI: ${process.env.MONGODB_URI.substring(0, 30)}...`);

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
        const errorMessage = `❌ Error connecting to MongoDB: ${error.message}`;
        console.error(errorMessage);
        console.error('Full error:', error);
        logger.error(errorMessage);
        process.exit(1);
    }
};

module.exports = connectDB;
