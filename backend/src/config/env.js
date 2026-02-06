require('dotenv').config();

const config = {
   
    nodeEnv: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 5000,
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

    mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/reconciliation-system',

    
    jwtSecret: process.env.JWT_SECRET || 'default-secret-change-this',
    jwtExpire: process.env.JWT_EXPIRE || '24h',
    jwtRefreshExpire: process.env.JWT_REFRESH_EXPIRE || '7d',

    
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760,
    uploadDir: process.env.UPLOAD_DIR || './uploads',

    
    smtp: {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    },

    
    aws: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        bucketName: process.env.AWS_BUCKET_NAME,
        region: process.env.AWS_REGION || 'us-east-1'
    },

  
    logLevel: process.env.LOG_LEVEL || 'info'
};

module.exports = config;
