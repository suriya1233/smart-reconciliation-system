// MongoDB Playground - Initial Data Setup for Reconciliation System

// Select the database
use('reconciliation-system');

// 1. Create Admin User
// Note: Password will be hashed by the backend when you use the API
// For direct insertion, you'd need to hash it manually
// RECOMMENDED: Use the API endpoint instead (see below)

// 2. Create Default Reconciliation Rules
db.reconciliationrules.insertMany([
    {
        name: 'Exact Match',
        type: 'exact_match',
        description: 'Matches transactions with exact transaction ID and amount',
        config: {
            fields: ['transactionId', 'amount'],
            variance: 0
        },
        enabled: true,
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        name: 'Partial Match',
        type: 'partial_match',
        description: 'Matches transactions by reference number with 2% variance',
        config: {
            fields: ['referenceNumber'],
            variance: 0.02
        },
        enabled: true,
        order: 2,
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        name: 'Duplicate Check',
        type: 'duplicate_check',
        description: 'Identifies duplicate transaction IDs',
        config: {
            fields: ['transactionId']
        },
        enabled: true,
        order: 3,
        createdAt: new Date(),
        updatedAt: new Date()
    }
]);

// 3. Create Sample System Transactions
db.transactions.insertMany([
    {
        transactionId: 'TXN-00001',
        amount: 1250.00,
        referenceNumber: 'REF-000001',
        date: new Date('2026-02-01'),
        description: 'Office Supplies Purchase',
        category: 'Office Supplies',
        vendor: 'Vendor A',
        source: 'system',
        createdAt: new Date()
    },
    {
        transactionId: 'TXN-00002',
        amount: 3500.50,
        referenceNumber: 'REF-000002',
        date: new Date('2026-02-02'),
        description: 'Software License',
        category: 'Software',
        vendor: 'Vendor B',
        source: 'system',
        createdAt: new Date()
    },
    {
        transactionId: 'TXN-00003',
        amount: 875.25,
        referenceNumber: 'REF-000003',
        date: new Date('2026-02-03'),
        description: 'Travel Expenses',
        category: 'Travel',
        vendor: 'Vendor C',
        source: 'system',
        createdAt: new Date()
    },
    {
        transactionId: 'TXN-00004',
        amount: 2100.00,
        referenceNumber: 'REF-000004',
        date: new Date('2026-02-04'),
        description: 'Marketing Campaign',
        category: 'Marketing',
        vendor: 'Vendor D',
        source: 'system',
        createdAt: new Date()
    },
    {
        transactionId: 'TXN-00005',
        amount: 5250.75,
        referenceNumber: 'REF-000005',
        date: new Date('2026-02-05'),
        description: 'Equipment Purchase',
        category: 'Equipment',
        vendor: 'Vendor E',
        source: 'system',
        createdAt: new Date()
    }
]);

// 4. Verify the data was inserted
print('✅ Reconciliation Rules created:', db.reconciliationrules.countDocuments());
print('✅ System Transactions created:', db.transactions.countDocuments({ source: 'system' }));

// 5. View the data
print('\n📊 Reconciliation Rules:');
db.reconciliationrules.find().forEach(rule => {
    print(`  - ${rule.name} (${rule.type}) - Enabled: ${rule.enabled}`);
});

print('\n💰 System Transactions:');
db.transactions.find({ source: 'system' }).forEach(txn => {
    print(`  - ${txn.transactionId}: $${txn.amount} - ${txn.description}`);
});

print('\n✨ Initial data setup complete!');
print('📝 Next step: Create admin user via API:');
print('   curl -X POST http://localhost:5000/api/auth/register \\');
print('     -H "Content-Type: application/json" \\');
print('     -d "{\\"name\\":\\"Admin User\\",\\"email\\":\\"admin@test.com\\",\\"password\\":\\"password123\\",\\"role\\":\\"admin\\"}"');
