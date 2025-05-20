import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import Component from '@/models/Component';

// GET /api/components/[id] - Lấy thông tin chi tiết linh kiện
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

        const component = await Component.findById(params.id)
            .populate('assignedTo', 'name employeeId email department')
            .populate('installedIn', 'name serialNumber type model');

        if (!component) {
            return new NextResponse(
                JSON.stringify({ error: 'Không tìm thấy linh kiện' }),
                { status: 404 }
            );
        }

        return NextResponse.json(component);
    } catch (error: any) {
        console.error(`Error fetching component ${params.id}:`, error);
        return new NextResponse(
            JSON.stringify({ error: error.message || 'Đã xảy ra lỗi khi lấy thông tin linh kiện' }),
            { status: 500 }
        );
    }
}

// PUT /api/components/[id] - Cập nhật thông tin linh kiện
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
        
        // Xử lý các trường tham chiếu ObjectId khi là chuỗi rỗng
        if (body.assignedTo === "") {
            body.assignedTo = null;
        }
        
        if (body.installedIn === "") {
            body.installedIn = null;
        }

        // Kiểm tra linh kiện có tồn tại không
        const existingComponent = await Component.findById(params.id);
        if (!existingComponent) {
            return new NextResponse(
                JSON.stringify({ error: 'Không tìm thấy linh kiện' }),
                { status: 404 }
            );
        }

        // Kiểm tra serialNumber có trùng với linh kiện khác không
        if (body.serialNumber && body.serialNumber !== existingComponent.serialNumber) {
            const duplicateComponent = await Component.findOne({
                serialNumber: body.serialNumber,
                _id: { $ne: params.id }
            });

            if (duplicateComponent) {
                return new NextResponse(
                    JSON.stringify({ error: 'Số sê-ri này đã tồn tại trong hệ thống' }),
                    { status: 400 }
                );
            }
        }

        // Cập nhật linh kiện
        const updatedComponent = await Component.findByIdAndUpdate(
            params.id,
            { $set: body },
            { new: true, runValidators: true }
        )
            .populate('assignedTo', 'name employeeId email department')
            .populate('installedIn', 'name serialNumber type model');

        return NextResponse.json(updatedComponent);
    } catch (error: any) {
        console.error(`Error updating component ${params.id}:`, error);
        return new NextResponse(
            JSON.stringify({ error: error.message || 'Đã xảy ra lỗi khi cập nhật linh kiện' }),
            { status: 500 }
        );
    }
}

// DELETE /api/components/[id] - Xóa linh kiện
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

        // Kiểm tra linh kiện có tồn tại không
        const component = await Component.findById(params.id);
        if (!component) {
            return new NextResponse(
                JSON.stringify({ error: 'Không tìm thấy linh kiện' }),
                { status: 404 }
            );
        }

        // Xóa linh kiện
        await Component.findByIdAndDelete(params.id);

        return new NextResponse(null, { status: 204 });
    } catch (error: any) {
        console.error(`Error deleting component ${params.id}:`, error);
        return new NextResponse(
            JSON.stringify({ error: error.message || 'Đã xảy ra lỗi khi xóa linh kiện' }),
            { status: 500 }
        );
    }
}