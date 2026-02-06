require('dotenv').config();
const mongoose = require('mongoose');

const checkDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }), 'users');

        const userCount = await User.countDocuments();
        console.log(`\n📊 Total users in database: ${userCount}`);

        if (userCount > 0) {
            const users = await User.find({}, 'email name role');
            console.log('\n👤 Users found:');
            users.forEach(user => {
                console.log(`   - ${user.email} (${user.role})`);
            });
        } else {
            console.log('\n❌ No users found in database!');
            console.log('\n💡 Solution: Run this command to create test users:');
            console.log('   npm run seed');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

checkDatabase();
