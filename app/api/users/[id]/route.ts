import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { Types } from 'mongoose';

// GET /api/users/[id] - Lấy thông tin chi tiết người dùng
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json(
                { error: 'Không có quyền truy cập' },
                { status: 403 }
            );
        }

        await connectDB();
        
        // Validate ObjectId
        if (!Types.ObjectId.isValid(params.id)) {
            return NextResponse.json(
                { error: 'ID người dùng không hợp lệ' },
                { status: 400 }
            );
        }

        const user = await User.findById(params.id)
            .select('-password')
            .populate('employee', 'name employeeId department position email');
        
        if (!user) {
            return NextResponse.json(
                { error: 'Không tìm thấy người dùng' },
                { status: 404 }
            );
        }
        
        return NextResponse.json({ user });
    } catch (error: any) {
        console.error('Error fetching user:', error);
        return NextResponse.json(
            { error: 'Không thể lấy thông tin người dùng' },
            { status: 500 }
        );
    }
}

// PUT /api/users/[id] - Cập nhật thông tin người dùng
export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json(
                { error: 'Không có quyền truy cập' },
                { status: 403 }
            );
        }

        await connectDB();
        
        // Validate ObjectId
        if (!Types.ObjectId.isValid(params.id)) {
            return NextResponse.json(
                { error: 'ID người dùng không hợp lệ' },
                { status: 400 }
            );
        }
        
        const user = await User.findById(params.id);
        if (!user) {
            return NextResponse.json(
                { error: 'Không tìm thấy người dùng' },
                { status: 404 }
            );
        }
        
        const { name, email, password, role, employee } = await req.json();
        
        // Validate basic fields
        if (!name || !email) {
            return NextResponse.json(
                { error: 'Tên và email là bắt buộc' },
                { status: 400 }
            );
        }
        
        // Check if trying to change email to one that already exists
        if (email !== user.email) {
            const existingUser = await User.findOne({ email });
            if (existingUser && existingUser._id.toString() !== params.id) {
                return NextResponse.json(
                    { error: 'Email đã được sử dụng cho tài khoản khác' },
                    { status: 400 }
                );
            }
        }
        
        // Prevent changing your own role if you're an admin
        if (params.id === session.user.id && role !== user.role) {
            return NextResponse.json(
                { error: 'Bạn không thể thay đổi vai trò của chính mình' },
                { status: 400 }
            );
        }
        
        // Update fields
        user.name = name;
        user.email = email;
        
        // Only update password if provided
        if (password) {
            // Additional password validation if needed
            if (password.length < 8) {
                return NextResponse.json(
                    { error: 'Mật khẩu phải có ít nhất 8 ký tự' },
                    { status: 400 }
                );
            }
            user.password = password;
        }
        
        // Update role if not changing own role
        if (params.id !== session.user.id) {
            user.role = role || user.role;
        }
        
        // Update employee association
        user.employee = employee || undefined;
        
        await user.save();
        
        // Return updated user without password
        const updatedUser = await User.findById(params.id)
            .select('-password')
            .populate('employee', 'name employeeId department position email');
        
        return NextResponse.json({ 
            message: 'Thông tin người dùng đã được cập nhật thành công', 
            user: updatedUser 
        });
    } catch (error: any) {
        console.error('Error updating user:', error);
        return NextResponse.json(
            { error: error.message || 'Không thể cập nhật thông tin người dùng' },
            { status: 500 }
        );
    }
}

// DELETE /api/users/[id] - Xóa người dùng
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json(
                { error: 'Không có quyền truy cập' },
                { status: 403 }
            );
        }

        await connectDB();
        
        // Validate ObjectId
        if (!Types.ObjectId.isValid(params.id)) {
            return NextResponse.json(
                { error: 'ID người dùng không hợp lệ' },
                { status: 400 }
            );
        }
        
        // Prevent deleting your own account
        if (params.id === session.user.id) {
            return NextResponse.json(
                { error: 'Bạn không thể xóa tài khoản của chính mình' },
                { status: 400 }
            );
        }
        
        const user = await User.findById(params.id);
        if (!user) {
            return NextResponse.json(
                { error: 'Không tìm thấy người dùng' },
                { status: 404 }
            );
        }
        
        await User.findByIdAndDelete(params.id);
        
        return NextResponse.json({ 
            message: 'Người dùng đã được xóa thành công' 
        });
    } catch (error: any) {
        console.error('Error deleting user:', error);
        return NextResponse.json(
            { error: error.message || 'Không thể xóa người dùng' },
            { status: 500 }
        );
    }
}

// PATCH /api/users/[id] - Cập nhật trạng thái người dùng (kích hoạt/vô hiệu hóa)
export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json(
                { error: 'Không có quyền truy cập' },
                { status: 403 }
            );
        }

        await connectDB();
        
        // Validate ObjectId
        if (!Types.ObjectId.isValid(params.id)) {
            return NextResponse.json(
                { error: 'ID người dùng không hợp lệ' },
                { status: 400 }
            );
        }
        
        // Prevent disabling your own account
        if (params.id === session.user.id) {
            return NextResponse.json(
                { error: 'Bạn không thể vô hiệu hóa tài khoản của chính mình' },
                { status: 400 }
            );
        }
        
        const user = await User.findById(params.id);
        if (!user) {
            return NextResponse.json(
                { error: 'Không tìm thấy người dùng' },
                { status: 404 }
            );
        }
        
        const { isActive } = await req.json();
        
        if (typeof isActive !== 'boolean') {
            return NextResponse.json(
                { error: 'Giá trị trạng thái không hợp lệ' },
                { status: 400 }
            );
        }
        
        user.isActive = isActive;
        await user.save();
        
        return NextResponse.json({ 
            message: `Người dùng đã được ${isActive ? 'kích hoạt' : 'vô hiệu hóa'} thành công`,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isActive: user.isActive
            }
        });
    } catch (error: any) {
        console.error('Error updating user status:', error);
        return NextResponse.json(
            { error: error.message || 'Không thể cập nhật trạng thái người dùng' },
            { status: 500 }
        );
    }
}
