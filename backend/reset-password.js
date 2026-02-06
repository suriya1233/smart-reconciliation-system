require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function resetPassword() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }), 'users');

        // Find admin user
        const admin = await User.findOne({ email: 'admin@test.com' });

        if (!admin) {
            console.log('❌ Admin user not found!');
            process.exit(1);
        }

        console.log('✅ Found admin user');

        // Hash new password
        const hashedPassword = await bcrypt.hash('password123', 10);

        // Update password directly
        await User.updateOne(
            { email: 'admin@test.com' },
            { $set: { password: hashedPassword, isActive: true } }
        );

        console.log('✅ Password reset successfully!');
        console.log('');
        console.log('📧 Email: admin@test.com');
        console.log('🔑 Password: password123');
        console.log('');
        console.log('🚀 Try logging in now!');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

resetPassword();
