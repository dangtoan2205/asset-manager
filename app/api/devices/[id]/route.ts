import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import Device from '@/models/Device';

// GET /api/devices/[id] - Lấy thông tin chi tiết thiết bị
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return new NextResponse(
                JSON.stringify({ error: 'Bạn cần đăng nhập để thực hiện thao tác này' }),
                { status: 401 }
            );
        }

        await connectDB();

        const device = await Device.findById(params.id)
            .populate('assignedTo', 'name employeeId email department');

        if (!device) {
            return new NextResponse(
                JSON.stringify({ error: 'Không tìm thấy thiết bị' }),
                { status: 404 }
            );
        }

        return NextResponse.json(device);
    } catch (error: any) {
        console.error(`Error fetching device ${params.id}:`, error);
        return new NextResponse(
            JSON.stringify({ error: error.message || 'Đã xảy ra lỗi khi lấy thông tin thiết bị' }),
            { status: 500 }
        );
    }
}

// PUT /api/devices/[id] - Cập nhật thông tin thiết bị
export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
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
        
        // Xử lý assignedTo nếu là chuỗi rỗng thì chuyển thành null
        if (body.assignedTo === "") {
            body.assignedTo = null;
        }

        // Kiểm tra thiết bị có tồn tại không
        const existingDevice = await Device.findById(params.id);
        if (!existingDevice) {
            return new NextResponse(
                JSON.stringify({ error: 'Không tìm thấy thiết bị' }),
                { status: 404 }
            );
        }

        // Kiểm tra serialNumber có trùng với thiết bị khác không
        if (body.serialNumber && body.serialNumber !== existingDevice.serialNumber) {
            const duplicateDevice = await Device.findOne({
                serialNumber: body.serialNumber,
                _id: { $ne: params.id }
            });

            if (duplicateDevice) {
                return new NextResponse(
                    JSON.stringify({ error: 'Số sê-ri này đã tồn tại trong hệ thống' }),
                    { status: 400 }
                );
            }
        }

        // Cập nhật thiết bị
        const updatedDevice = await Device.findByIdAndUpdate(
            params.id,
            { $set: body },
            { new: true, runValidators: true }
        ).populate('assignedTo', 'name employeeId email department');

        return NextResponse.json(updatedDevice);
    } catch (error: any) {
        console.error(`Error updating device ${params.id}:`, error);
        return new NextResponse(
            JSON.stringify({ error: error.message || 'Đã xảy ra lỗi khi cập nhật thiết bị' }),
            { status: 500 }
        );
    }
}

// DELETE /api/devices/[id] - Xóa thiết bị
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return new NextResponse(
                JSON.stringify({ error: 'Bạn cần đăng nhập để thực hiện thao tác này' }),
                { status: 401 }
            );
        }

        // Chỉ admin mới có quyền xóa
        if (session.user.role !== 'admin') {
            return new NextResponse(
                JSON.stringify({ error: 'Bạn không có quyền thực hiện thao tác này' }),
                { status: 403 }
            );
        }

        await connectDB();

        // Kiểm tra thiết bị có tồn tại không
        const device = await Device.findById(params.id);
        if (!device) {
            return new NextResponse(
                JSON.stringify({ error: 'Không tìm thấy thiết bị' }),
                { status: 404 }
            );
        }

        // Xóa thiết bị
        await Device.findByIdAndDelete(params.id);

        return new NextResponse(null, { status: 204 });
    } catch (error: any) {
        console.error(`Error deleting device ${params.id}:`, error);
        return new NextResponse(
            JSON.stringify({ error: error.message || 'Đã xảy ra lỗi khi xóa thiết bị' }),
            { status: 500 }
        );
    }
}