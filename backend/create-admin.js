require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function createAdmin() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Define User Schema inline
        const userSchema = new mongoose.Schema({
            name: { type: String, required: true },
            email: { type: String, required: true, unique: true },
            password: { type: String, required: true },
            role: { type: String, default: 'viewer' },
            permissions: [String],
            isActive: { type: Boolean, default: true },
            refreshTokens: [String]
        }, { timestamps: true });

        const User = mongoose.models.User || mongoose.model('User', userSchema);

        // Check if admin already exists
        const existing = await User.findOne({ email: 'admin@test.com' });
        if (existing) {
            console.log('ℹ️  Admin user already exists!');
            console.log('   Email: admin@test.com');
            console.log('   Password: password123');
            process.exit(0);
        }

        // Hash password
        const hashedPassword = await bcrypt.hash('password123', 10);

        // Create admin user
        await User.create({
            name: 'Admin User',
            email: 'admin@test.com',
            password: hashedPassword,
            role: 'admin',
            permissions: ['*'],
            isActive: true
        });

        console.log('✅ Admin user created successfully!');
        console.log('');
        console.log('📧 Email: admin@test.com');
        console.log('🔑 Password: password123');
        console.log('👤 Role: admin');
        console.log('');
        console.log('🚀 You can now login with these credentials!');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('');
        console.error('Troubleshooting:');
        console.error('1. Make sure MongoDB is running: net start MongoDB');
        console.error('2. Check .env has correct MONGODB_URI');
        console.error('3. Check backend terminal for errors');
        process.exit(1);
    }
}

createAdmin();
