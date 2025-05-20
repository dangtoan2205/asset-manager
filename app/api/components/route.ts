import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import Component from '@/models/Component';
import mongoose from 'mongoose';

// GET /api/components - Lấy danh sách linh kiện
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

        // Lấy các query params
        const url = new URL(req.url);
        const searchQuery = url.searchParams.get('search') || '';
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '20');
        const type = url.searchParams.get('type') || '';
        const status = url.searchParams.get('status') || '';
        const sortField = url.searchParams.get('sortField') || 'createdAt';
        const sortOrder = url.searchParams.get('sortOrder') || 'desc';
        const assignedTo = url.searchParams.get('assignedTo') || '';

        // Xây dựng query
        const query: any = {};

        // Thêm điều kiện tìm kiếm
        if (searchQuery) {
            query.$or = [
                { name: { $regex: searchQuery, $options: 'i' } },
                { serialNumber: { $regex: searchQuery, $options: 'i' } },
                { manufacturer: { $regex: searchQuery, $options: 'i' } },
                { model: { $regex: searchQuery, $options: 'i' } }
            ];
        }

        // Lọc theo type
        if (type) {
            query.type = type;
        }

        // Lọc theo status
        if (status) {
            query.status = status;
        }

        // Lọc theo assignedTo (nhân viên được gán)
        if (assignedTo) {
            // Chỉ lấy linh kiện mà assignedTo khớp chính xác với ID nhân viên
            query.assignedTo = { $eq: new mongoose.Types.ObjectId(assignedTo) };
        }

        // Tính toán skip và tổng số lượng
        const skip = (page - 1) * limit;
        const total = await Component.countDocuments(query);

        // Tạo sort object
        const sort: any = {};
        sort[sortField] = sortOrder === 'asc' ? 1 : -1;

        // Lấy dữ liệu linh kiện với phân trang và sắp xếp
        const components = await Component.find(query)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .populate('assignedTo', 'name employeeId email department')
            .populate('installedIn', 'name serialNumber type');

        return NextResponse.json({
            components,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error: any) {
        console.error('Error fetching components:', error);
        return new NextResponse(
            JSON.stringify({ error: error.message || 'Đã xảy ra lỗi khi lấy danh sách linh kiện' }),
            { status: 500 }
        );
    }
}

// POST /api/components - Tạo linh kiện mới
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
            name, type, serialNumber, manufacturer, model, purchaseDate,
            warrantyExpiryDate, status, location, assignedTo, installedIn, specs, notes
        } = body;

        if (!name || !type || !manufacturer || !model || !purchaseDate || !status) {
            return new NextResponse(
                JSON.stringify({ error: 'Vui lòng cung cấp đầy đủ thông tin linh kiện' }),
                { status: 400 }
            );
        }

        // Kiểm tra serialNumber có tồn tại chưa (nếu có)
        if (serialNumber) {
            const existingComponent = await Component.findOne({ serialNumber });
            if (existingComponent) {
                return new NextResponse(
                    JSON.stringify({ error: 'Số sê-ri này đã tồn tại trong hệ thống' }),
                    { status: 400 }
                );
            }
        }

        // Tạo linh kiện mới
        const componentData: any = {
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

        if (assignedTo) {
            componentData.assignedTo = assignedTo;
        }

        if (installedIn) {
            componentData.installedIn = installedIn;
        }

        const component = await Component.create(componentData);

        return new NextResponse(
            JSON.stringify(component),
            { status: 201 }
        );
    } catch (error: any) {
        console.error('Error creating component:', error);
        return new NextResponse(
            JSON.stringify({ error: error.message || 'Đã xảy ra lỗi khi tạo linh kiện mới' }),
            { status: 500 }
        );
    }
}