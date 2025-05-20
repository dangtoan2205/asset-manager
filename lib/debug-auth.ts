import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function debugAuth() {
    try {
        await connectDB();

        console.log('========= DEBUG AUTH =========');

        // 1. Tìm user admin
        const admin = await User.findOne({ email: 'admin@example.com' });
        if (!admin) {
            console.log('Không tìm thấy tài khoản admin!');
            return;
        }

        console.log('Admin ID:', admin._id);
        console.log('Admin email:', admin.email);
        console.log('Admin password hash:', admin.password);

        // 2. Test comparePassword
        const testPassword = 'admin123';
        console.log('Test password:', testPassword);

        // 2.1. Test comparePassword trực tiếp
        try {
            const isMatch = await admin.comparePassword(testPassword);
            console.log('Password match (method):', isMatch);
        } catch (error) {
            console.error('Lỗi khi so sánh password (method):', error);
        }

        // 2.2. Test bcrypt.compare trực tiếp
        try {
            const isMatch = await bcrypt.compare(testPassword, admin.password);
            console.log('Password match (bcrypt):', isMatch);
        } catch (error) {
            console.error('Lỗi khi so sánh password (bcrypt):', error);
        }

        console.log('==============================');
    } catch (error) {
        console.error('Debug error:', error);
    }
}

// Chạy debug function nếu được gọi trực tiếp
if (require.main === module) {
    debugAuth()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error('Error:', error);
            process.exit(1);
        });
}

export default debugAuth; 