require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');

async function recreateAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Delete existing admin
        const deleted = await User.deleteOne({ email: 'admin@test.com' });
        console.log('🗑️  Deleted existing admin:', deleted.deletedCount > 0 ? 'Yes' : 'No');

        // Create fresh admin with the User model (triggers password hashing)
        const admin = await User.create({
            name: 'Admin User',
            email: 'admin@test.com',
            password: 'password123', // Will be auto-hashed by pre-save hook
            role: 'admin',
            permissions: ['*'],
            isActive: true
        });

        console.log('✅ Fresh admin user created!\n');
        console.log('📧 Email:', admin.email);
        console.log('🔑 Password: password123');
        console.log('👤 Role:', admin.role);
        console.log('✨ Active:', admin.isActive);

        // Test password verification
        const testUser = await User.findOne({ email: 'admin@test.com' }).select('+password');
        const isValid = await testUser.comparePassword('password123');
        console.log('\n🧪 Password Test:', isValid ? '✅ VALID' : '❌ INVALID');

        if (!isValid) {
            console.log('\n⚠️  WARNING: Password verification failed!');
        } else {
            console.log('\n🎉 SUCCESS! Login should work now!');
        }

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
}

recreateAdmin();
