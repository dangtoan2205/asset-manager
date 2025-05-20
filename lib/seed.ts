import connectDB from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

async function seedAdmin() {
    try {
        await connectDB();

        // Xóa bản ghi admin cũ nếu tồn tại
        await mongoose.connection.db.collection('users').deleteOne({ email: 'admin@example.com' });

        // Tạo mật khẩu đã hash
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);

        // Thêm trực tiếp vào collection users
        const result = await mongoose.connection.db.collection('users').insertOne({
            name: 'Admin',
            email: 'admin@example.com',
            password: hashedPassword,
            role: 'admin',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        console.log('Đã tạo tài khoản admin thành công:', result.insertedId);

        // Kiểm tra lại
        const admin = await mongoose.connection.db.collection('users').findOne({ email: 'admin@example.com' });
        console.log('Admin được tạo:', admin?.email);

        // Kiểm tra xác thực
        const testPassword = 'admin123';
        const isValid = await bcrypt.compare(testPassword, admin?.password);
        console.log('Kiểm tra mật khẩu:', isValid);
    } catch (error) {
        console.error('Lỗi khi tạo admin:', error);
    }
}

// Thực thi function nếu file được chạy trực tiếp
if (require.main === module) {
    seedAdmin()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error('Lỗi:', error);
            process.exit(1);
        });
}

export default seedAdmin; 