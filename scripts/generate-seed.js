const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

async function generateSeed() {
    const password = 'seta@2019';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const seedContent = `-- Create admin user with hashed password (seta@2019)
INSERT INTO User (id, name, email, password, role, createdAt, updatedAt)
VALUES (
    'admin-user-id',
    'Admin User',
    'admin@example.com',
    '${hashedPassword}',
    'ADMIN',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    password = VALUES(password),
    role = VALUES(role),
    updatedAt = NOW();`;

    fs.writeFileSync(path.join(__dirname, '../prisma/seed.sql'), seedContent);
    console.log('Seed file generated successfully!');
}

generateSeed().catch(console.error); 