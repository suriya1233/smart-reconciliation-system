require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Transaction = require('./src/models/Transaction');
const ReconciliationRule = require('./src/models/ReconciliationRule');

const seedDatabase = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Clear existing data (optional - comment out if you want to keep existing data)
        // await User.deleteMany({});
        // await Transaction.deleteMany({});
        // await ReconciliationRule.deleteMany({});
        // console.log('🗑️  Cleared existing data');

        // 1. Create Admin User
        const adminExists = await User.findOne({ email: 'admin@test.com' });
        if (!adminExists) {
            const admin = await User.create({
                name: 'Admin User',
                email: 'admin@test.com',
                password: 'password123',
                role: 'admin',
                permissions: ['*'],
                isActive: true
            });
            console.log('✅ Admin user created:', admin.email);
        } else {
            console.log('ℹ️  Admin user already exists');
        }

        // 2. Create Analyst User
        const analystExists = await User.findOne({ email: 'analyst@test.com' });
        if (!analystExists) {
            const analyst = await User.create({
                name: 'Analyst User',
                email: 'analyst@test.com',
                password: 'password123',
                role: 'analyst',
                isActive: true
            });
            console.log('✅ Analyst user created:', analyst.email);
        } else {
            console.log('ℹ️  Analyst user already exists');
        }

        // 3. Create Viewer User
        const viewerExists = await User.findOne({ email: 'viewer@test.com' });
        if (!viewerExists) {
            const viewer = await User.create({
                name: 'Viewer User',
                email: 'viewer@test.com',
                password: 'password123',
                role: 'viewer',
                isActive: true
            });
            console.log('✅ Viewer user created:', viewer.email);
        } else {
            console.log('ℹ️  Viewer user already exists');
        }

        // 4. Create Reconciliation Rules
        const rulesExist = await ReconciliationRule.countDocuments();
        if (rulesExist === 0) {
            await ReconciliationRule.insertMany([
                {
                    name: 'Exact Match',
                    type: 'exact_match',
                    description: 'Matches transactions with exact transaction ID and amount',
                    config: {
                        fields: ['transactionId', 'amount'],
                        variance: 0,
                        priority: 1
                    },
                    enabled: true,
                    order: 1
                },
                {
                    name: 'Partial Match',
                    type: 'partial_match',
                    description: 'Matches transactions by reference number with 2% variance',
                    config: {
                        fields: ['referenceNumber'],
                        variance: 0.02,
                        priority: 2
                    },
                    enabled: true,
                    order: 2
                },
                {
                    name: 'Duplicate Check',
                    type: 'duplicate_check',
                    description: 'Identifies duplicate transaction IDs',
                    config: {
                        fields: ['transactionId'],
                        priority: 3
                    },
                    enabled: true,
                    order: 3
                }
            ]);
            console.log('✅ Reconciliation rules created');
        } else {
            console.log('ℹ️  Reconciliation rules already exist');
        }

        // 5. Create Sample System Transactions
        const transactionsExist = await Transaction.countDocuments({ source: 'system' });
        if (transactionsExist === 0) {
            const sampleTransactions = [];
            const categories = ['Office Supplies', 'Software', 'Travel', 'Marketing', 'Equipment'];
            const vendors = ['Vendor A', 'Vendor B', 'Vendor C', 'Vendor D', 'Vendor E'];

            for (let i = 1; i <= 20; i++) {
                sampleTransactions.push({
                    transactionId: `TXN-${String(i).padStart(5, '0')}`,
                    amount: parseFloat((Math.random() * 5000 + 100).toFixed(2)),
                    referenceNumber: `REF-${String(i).padStart(6, '0')}`,
                    date: new Date(2026, 1, Math.floor(Math.random() * 28) + 1),
                    description: `Sample transaction ${i}`,
                    category: categories[Math.floor(Math.random() * categories.length)],
                    vendor: vendors[Math.floor(Math.random() * vendors.length)],
                    source: 'system'
                });
            }

            await Transaction.insertMany(sampleTransactions);
            console.log(`✅ ${sampleTransactions.length} system transactions created`);
        } else {
            console.log('ℹ️  System transactions already exist');
        }

        // Summary
        console.log('\n📊 Database Summary:');
        console.log(`   Users: ${await User.countDocuments()}`);
        console.log(`   Reconciliation Rules: ${await ReconciliationRule.countDocuments()}`);
        console.log(`   System Transactions: ${await Transaction.countDocuments({ source: 'system' })}`);

        console.log('\n✨ Database seeding complete!');
        console.log('\n👤 Test Users Created:');
        console.log('   Email: admin@test.com    | Password: password123 | Role: admin');
        console.log('   Email: analyst@test.com  | Password: password123 | Role: analyst');
        console.log('   Email: viewer@test.com   | Password: password123 | Role: viewer');

        console.log('\n🚀 You can now:');
        console.log('   1. Start backend: npm run dev');
        console.log('   2. Login with any test user');
        console.log('   3. Upload CSV/Excel files for reconciliation');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
};

// Run seeder
seedDatabase();
