import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Employee from '@/models/Employee';

// GET /api/users - Lấy danh sách người dùng
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json(
                { error: 'Không có quyền truy cập' },
                { status: 403 }
            );
        }

        await connectDB();
        
        const users = await User.find()
            .select('-password')
            .populate('employee', 'name employeeId')
            .sort({ createdAt: -1 });
        
        return NextResponse.json({ users });
    } catch (error: any) {
        console.error('Error fetching users:', error);
        return NextResponse.json(
            { error: 'Không thể lấy danh sách người dùng' },
            { status: 500 }
        );
    }
}

// POST /api/users - Tạo người dùng mới
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json(
                { error: 'Không có quyền truy cập' },
                { status: 403 }
            );
        }

        await connectDB();
        
        const { name, email, password, role, employee } = await req.json();
        
        // Validate required fields
        if (!name || !email || !password) {
            return NextResponse.json(
                { error: 'Vui lòng điền đầy đủ thông tin bắt buộc' },
                { status: 400 }
            );
        }
        
        // Check if email is already in use
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return NextResponse.json(
                { error: 'Email đã được sử dụng cho tài khoản khác' },
                { status: 400 }
            );
        }
        
        // Validate password
        if (password.length < 8) {
            return NextResponse.json(
                { error: 'Mật khẩu phải có ít nhất 8 ký tự' },
                { status: 400 }
            );
        }

        // If employee ID is provided, confirm it exists
        if (employee) {
            const employeeExists = await Employee.findById(employee);
            if (!employeeExists) {
                return NextResponse.json(
                    { error: 'Nhân viên được chọn không tồn tại' },
                    { status: 400 }
                );
            }
        }
        
        // Create new user
        const user = new User({
            name,
            email,
            password,
            role: role || 'user',
            employee: employee || undefined,
            provider: 'credentials',
            isActive: true
        });
        
        await user.save();
        
        // Return user without password
        const userWithoutPassword = {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            employee: user.employee,
            isActive: user.isActive,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        };
        
        return NextResponse.json({ 
            message: 'Người dùng đã được tạo thành công', 
            user: userWithoutPassword 
        }, { status: 201 });
    } catch (error: any) {
        console.error('Error creating user:', error);
        return NextResponse.json(
            { error: error.message || 'Không thể tạo người dùng' },
            { status: 500 }
        );
    }
}
