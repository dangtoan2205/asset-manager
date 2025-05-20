import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import Device from '@/models/Device';
import mongoose from 'mongoose';

// GET /api/devices - Lấy danh sách thiết bị
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return new NextResponse(
                JSON.stringify({ error: 'Bạn cần đăng nhập để thực hiện thao tác này' }),
                { status: 401 }
            );
        }

        await connectDB();

        // Phân trang và lọc
        const searchParams = req.nextUrl.searchParams;
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('limit') || '10', 10);
        const skip = (page - 1) * limit;

        // Lọc theo các trường phân loại
        const category = searchParams.get('category');
        const type = searchParams.get('type');
        const subType = searchParams.get('subType');
        const status = searchParams.get('status');
        const assignedTo = searchParams.get('assignedTo');
        const query: any = {};

        // Thêm các điều kiện lọc theo cấp bậc phân loại mới
        if (category) query.category = category;
        if (type) query.type = type;
        if (subType) query.subType = subType;
        if (status) query.status = status;
        
        // Xử lý assignedTo đúng cách
        if (assignedTo) {
            // Chỉ lấy thiết bị mà assignedTo khớp chính xác với ID nhân viên
            query.assignedTo = { $eq: new mongoose.Types.ObjectId(assignedTo) };
        }

        // Tìm kiếm theo từ khóa
        const search = searchParams.get('search');
        if (search) {
            query.$text = { $search: search };
        }

        const devices = await Device.find(query)
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 })
            .populate('assignedTo', 'name employeeId email');

        const total = await Device.countDocuments(query);

        return NextResponse.json({
            devices,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error: any) {
        console.error('Error fetching devices:', error);
        return new NextResponse(
            JSON.stringify({ error: error.message || 'Đã xảy ra lỗi khi lấy danh sách thiết bị' }),
            { status: 500 }
        );
    }
}

// POST /api/devices - Tạo thiết bị mới
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return new NextResponse(
                JSON.stringify({ error: 'Bạn cần đăng nhập để thực hiện thao tác này' }),
                { status: 401 }
            );
        }

        // Kiểm tra quyền admin/manager
        if (session.user.role !== 'admin' && session.user.role !== 'manager') {
            return new NextResponse(
                JSON.stringify({ error: 'Bạn không có quyền thực hiện thao tác này' }),
                { status: 403 }
            );
        }

        await connectDB();

        const body = await req.json();

        // Kiểm tra dữ liệu đầu vào
        const {
            name, type, subType, category, serialNumber, manufacturer, model, purchaseDate,
            warrantyExpiryDate, status, location, assignedTo, specs, notes
        } = body;

        if (!name || !type || !serialNumber || !manufacturer || !model || !purchaseDate || !status) {
            return new NextResponse(
                JSON.stringify({ error: 'Vui lòng cung cấp đầy đủ thông tin thiết bị' }),
                { status: 400 }
            );
        }

        // Kiểm tra serialNumber có tồn tại chưa
        const existingDevice = await Device.findOne({ serialNumber });
        if (existingDevice) {
            return new NextResponse(
                JSON.stringify({ error: 'Số sê-ri này đã tồn tại trong hệ thống' }),
                { status: 400 }
            );
        }

        // Tạo thiết bị mới với cấu trúc phân loại mới
        const deviceData: any = {
            name,
            type,
            serialNumber,
            manufacturer,
            model,
            purchaseDate,
            warrantyExpiryDate,
            status,
            location,
            specs,
            notes,
        };

        // Thêm các trường phân loại mới nếu có
        if (subType) deviceData.subType = subType;
        if (category) deviceData.category = category;

        // Chỉ thêm trường assignedTo nếu có giá trị hợp lệ
        if (assignedTo && assignedTo.trim() !== '') {
            deviceData.assignedTo = assignedTo;
        }

        const device = await Device.create(deviceData);

        return NextResponse.json(device, { status: 201 });
    } catch (error: any) {
        console.error('Error creating device:', error);
        return new NextResponse(
            JSON.stringify({ error: error.message || 'Đã xảy ra lỗi khi tạo thiết bị mới' }),
            { status: 500 }
        );
    }
}