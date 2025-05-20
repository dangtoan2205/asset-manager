import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import Employee from '@/models/Employee';
import Device from '@/models/Device';

// GET /api/employees/[id] - Lấy thông tin chi tiết nhân viên
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

        const employee = await Employee.findById(params.id)
            .populate('manager', 'name employeeId email department');

        if (!employee) {
            return new NextResponse(
                JSON.stringify({ error: 'Không tìm thấy nhân viên' }),
                { status: 404 }
            );
        }

        // Lấy danh sách thiết bị được gán cho nhân viên
        const assignedDevices = await Device.find({ assignedTo: params.id })
            .select('name type manufacturer model serialNumber status');

        return NextResponse.json({
            employee,
            assignedDevices
        });
    } catch (error: any) {
        console.error(`Error fetching employee ${params.id}:`, error);
        return new NextResponse(
            JSON.stringify({ error: error.message || 'Đã xảy ra lỗi khi lấy thông tin nhân viên' }),
            { status: 500 }
        );
    }
}

// PUT /api/employees/[id] - Cập nhật thông tin nhân viên
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

        // Kiểm tra nhân viên có tồn tại không
        const existingEmployee = await Employee.findById(params.id);
        if (!existingEmployee) {
            return new NextResponse(
                JSON.stringify({ error: 'Không tìm thấy nhân viên' }),
                { status: 404 }
            );
        }

        // Kiểm tra employeeId và email có trùng với nhân viên khác không
        if (body.employeeId && body.employeeId !== existingEmployee.employeeId) {
            const duplicateId = await Employee.findOne({
                employeeId: body.employeeId,
                _id: { $ne: params.id }
            });

            if (duplicateId) {
                return new NextResponse(
                    JSON.stringify({ error: 'Mã nhân viên này đã tồn tại trong hệ thống' }),
                    { status: 400 }
                );
            }
        }

        if (body.email && body.email !== existingEmployee.email) {
            const duplicateEmail = await Employee.findOne({
                email: body.email,
                _id: { $ne: params.id }
            });

            if (duplicateEmail) {
                return new NextResponse(
                    JSON.stringify({ error: 'Email này đã tồn tại trong hệ thống' }),
                    { status: 400 }
                );
            }
        }

        // Không cho phép nhân viên chọn chính mình làm quản lý
        if (body.manager === params.id) {
            return new NextResponse(
                JSON.stringify({ error: 'Nhân viên không thể chọn chính mình làm quản lý' }),
                { status: 400 }
            );
        }

        // Cập nhật nhân viên
        const updateData = { ...body };

        // Xử lý trường manager
        if (!body.manager || body.manager.trim() === '') {
            updateData.manager = undefined; // Xóa manager nếu giá trị trống
        }

        const updatedEmployee = await Employee.findByIdAndUpdate(
            params.id,
            { $set: updateData },
            { new: true, runValidators: true }
        ).populate('manager', 'name employeeId email department');

        return NextResponse.json(updatedEmployee);
    } catch (error: any) {
        console.error(`Error updating employee ${params.id}:`, error);
        return new NextResponse(
            JSON.stringify({ error: error.message || 'Đã xảy ra lỗi khi cập nhật nhân viên' }),
            { status: 500 }
        );
    }
}

// DELETE /api/employees/[id] - Xóa nhân viên
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

        // Kiểm tra nhân viên có tồn tại không
        const employee = await Employee.findById(params.id);
        if (!employee) {
            return new NextResponse(
                JSON.stringify({ error: 'Không tìm thấy nhân viên' }),
                { status: 404 }
            );
        }

        // Kiểm tra nhân viên có đang được gán thiết bị không
        const assignedDevicesCount = await Device.countDocuments({ assignedTo: params.id });
        if (assignedDevicesCount > 0) {
            return new NextResponse(
                JSON.stringify({
                    error: 'Không thể xóa nhân viên này vì họ đang được gán thiết bị. Vui lòng thu hồi tất cả thiết bị trước khi xóa.'
                }),
                { status: 400 }
            );
        }

        // Kiểm tra nhân viên có đang là quản lý của nhân viên khác không
        const managedEmployeesCount = await Employee.countDocuments({ manager: params.id });
        if (managedEmployeesCount > 0) {
            return new NextResponse(
                JSON.stringify({
                    error: 'Không thể xóa nhân viên này vì họ đang là quản lý của nhân viên khác. Vui lòng cập nhật quản lý cho các nhân viên đó trước khi xóa.'
                }),
                { status: 400 }
            );
        }

        // Xóa nhân viên
        await Employee.findByIdAndDelete(params.id);

        return new NextResponse(null, { status: 204 });
    } catch (error: any) {
        console.error(`Error deleting employee ${params.id}:`, error);
        return new NextResponse(
            JSON.stringify({ error: error.message || 'Đã xảy ra lỗi khi xóa nhân viên' }),
            { status: 500 }
        );
    }
} 