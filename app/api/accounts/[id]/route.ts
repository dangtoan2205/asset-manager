import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import Account from '@/models/Account';
import mongoose from 'mongoose';

// GET /api/accounts/[id] - Lấy chi tiết một tài khoản
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Kiểm tra xác thực
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Kiểm tra quyền hạn
        const userRole = session.user.role;
        if (userRole !== 'admin' && userRole !== 'manager') {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        const { id } = params;

        // Kiểm tra ID hợp lệ
        if (!mongoose.isValidObjectId(id)) {
            return NextResponse.json({ error: 'Invalid account ID' }, { status: 400 });
        }

        // Kết nối đến database
        await connectDB();

        // Tìm tài khoản theo ID
        const account = await Account.findById(id).populate('assignedTo', 'name employeeId email department');

        if (!account) {
            return NextResponse.json({ error: 'Account not found' }, { status: 404 });
        }

        return NextResponse.json(account);
    } catch (error) {
        console.error('Error fetching account:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT /api/accounts/[id] - Cập nhật thông tin tài khoản
export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Kiểm tra xác thực
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Kiểm tra quyền hạn
        const userRole = session.user.role;
        if (userRole !== 'admin' && userRole !== 'manager') {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        const { id } = params;

        // Kiểm tra ID hợp lệ
        if (!mongoose.isValidObjectId(id)) {
            return NextResponse.json({ error: 'Invalid account ID' }, { status: 400 });
        }

        // Lấy dữ liệu từ request body
        const data = await req.json();

        // Kiểm tra dữ liệu bắt buộc
        if (!data.name || !data.type || !data.username) {
            return NextResponse.json(
                { error: 'Name, type, and username are required' },
                { status: 400 }
            );
        }

        // Xử lý trường assignedTo để tránh lỗi MongoDB ObjectId
        if (data.assignedTo === "") {
            data.assignedTo = null;
            data.assignmentStatus = 'available';
        } else if (data.assignedTo) {
            data.assignmentStatus = 'assigned';
        }

        // Kết nối đến database
        await connectDB();

        // Kiểm tra tài khoản tồn tại
        const existingAccount = await Account.findById(id);
        if (!existingAccount) {
            return NextResponse.json({ error: 'Account not found' }, { status: 404 });
        }

        // Cập nhật tài khoản
        const updatedAccount = await Account.findByIdAndUpdate(
            id,
            { $set: data },
            { new: true, runValidators: true }
        ).populate('assignedTo', 'name employeeId email department');

        return NextResponse.json({
            message: 'Account updated successfully',
            account: updatedAccount
        });
    } catch (error) {
        console.error('Error updating account:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/accounts/[id] - Xóa tài khoản
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Kiểm tra xác thực
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Kiểm tra quyền hạn
        const userRole = session.user.role;
        if (userRole !== 'admin') {
            return NextResponse.json({ error: 'Insufficient permissions. Only admin can delete accounts' }, { status: 403 });
        }

        const { id } = params;

        // Kiểm tra ID hợp lệ
        if (!mongoose.isValidObjectId(id)) {
            return NextResponse.json({ error: 'Invalid account ID' }, { status: 400 });
        }

        // Kết nối đến database
        await connectDB();

        // Kiểm tra tài khoản tồn tại
        const existingAccount = await Account.findById(id);
        if (!existingAccount) {
            return NextResponse.json({ error: 'Account not found' }, { status: 404 });
        }

        // Xóa tài khoản
        await Account.findByIdAndDelete(id);

        return NextResponse.json({ message: 'Account deleted successfully' });
    } catch (error) {
        console.error('Error deleting account:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}