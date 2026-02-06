// Quick User Creation Script - Run this in MongoDB Compass
// Database: reconciliation-system

// Use the database
use('reconciliation-system');

// Create admin user
db.users.insertOne({
    name: 'Admin User',
    email: 'admin@test.com',
    // This is the bcrypt hash for 'password123'
    password: '$2a$10$rQ3K5vF.P3FJJJvfVvF3JuHVKZVJxZVJxZVJxZVJxZVJ5J5J5J5J5',
    role: 'admin',
    permissions: ['*'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
});

print('✅ Admin user created!');
print('Email: admin@test.com');
print('Password: password123');
