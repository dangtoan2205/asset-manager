-- Create admin user with hashed password (seta@2019)
INSERT INTO User (id, name, email, password, role, createdAt, updatedAt)
VALUES (
    'admin-user-id',
    'Admin User',
    'admin@example.com',
    '$2a$10$Wp9rrFodZ/YHCOwdGFbhYORJKZIOT8J7lh7l7gc3aU9WcbB/vY.vy',
    'ADMIN',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    password = VALUES(password),
    role = VALUES(role),
    updatedAt = NOW();