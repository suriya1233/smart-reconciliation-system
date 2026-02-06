require('dotenv').config();
const mongoose = require('mongoose');

async function checkUser() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Define User Schema inline
        const userSchema = new mongoose.Schema({
            name: { type: String, required: true },
            email: { type: String, required: true, unique: true },
            password: { type: String, required: true, select: false },
            role: { type: String, default: 'viewer' },
            permissions: [String],
            isActive: { type: Boolean, default: true },
            refreshToken: String,
            lastLogin: Date
        }, { timestamps: true });

        // Add comparePassword method
        userSchema.methods.comparePassword = async function (candidatePassword) {
            const bcrypt = require('bcryptjs');
            return await bcrypt.compare(candidatePassword, this.password);
        };

        const User = mongoose.models.User || mongoose.model('User', userSchema);

        // Find admin user with password field
        const adminUser = await User.findOne({ email: 'admin@test.com' }).select('+password');

        if (!adminUser) {
            console.log('❌ Admin user not found!');
            console.log('Run: node create-admin.js');
            process.exit(1);
        }

        console.log('\n✅ Admin user found!');
        console.log('📧 Email:', adminUser.email);
        console.log('👤 Name:', adminUser.name);
        console.log('🔑 Role:', adminUser.role);
        console.log('✔️  Active:', adminUser.isActive);
        console.log('📅 Created:', adminUser.createdAt);

        // Test password
        const bcrypt = require('bcryptjs');
        const testPassword = 'password123';
        const isMatch = await bcrypt.compare(testPassword, adminUser.password);

        console.log('\n🔐 Password Test:');
        console.log('   Testing with: "password123"');
        console.log('   Result:', isMatch ? '✅ MATCH' : '❌ NO MATCH');

        if (!isMatch) {
            console.log('\n⚠️  WARNING: Password does not match!');
            console.log('   The password may have been changed or corrupted.');
            console.log('   Run: node recreate-admin.js to create a fresh admin user');
        } else {
            console.log('\n✅ Everything looks good! You should be able to login with:');
            console.log('   Email: admin@test.com');
            console.log('   Password: password123');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

checkUser();
