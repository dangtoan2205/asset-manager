import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import Employee from '@/models/Employee';

// GET /api/employees - Lấy danh sách nhân viên
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        await connectDB();

        // Lấy danh sách nhân viên, sắp xếp theo mã nhân viên
        const employees = await Employee.find({})
            .select('name employeeId email department position status joinDate')
            .sort({ employeeId: 1 })
            .lean();

        // Lấy danh sách các phòng ban duy nhất
        const departments = Array.from(new Set(employees.map(emp => emp.department))).sort();

        return NextResponse.json({
            employees,
            departments,
            total: employees.length
        });
    } catch (error: any) {
        console.error('Error fetching employees:', error);
        return NextResponse.json(
            { error: 'Không thể lấy danh sách nhân viên' },
            { status: 500 }
        );
    }
}

// POST /api/employees - Tạo nhân viên mới
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || !["admin", "manager"].includes(session.user.role as string)) {
            return NextResponse.json(
                { error: 'Unauthorized - Yêu cầu quyền Admin hoặc Manager' },
                { status: 401 }
            );
        }

        const body = await req.json();
        await connectDB();

        // Kiểm tra xem employeeId hoặc email đã tồn tại chưa
        const existingEmployee = await Employee.findOne({
            $or: [
                { employeeId: body.employeeId },
                { email: body.email }
            ]
        });

        if (existingEmployee) {
            if (existingEmployee.employeeId === body.employeeId) {
                return NextResponse.json(
                    { error: 'Mã nhân viên đã tồn tại' },
                    { status: 400 }
                );
            }
            if (existingEmployee.email === body.email) {
                return NextResponse.json(
                    { error: 'Email đã tồn tại' },
                    { status: 400 }
                );
            }
        }

        // Nếu có manager, kiểm tra xem manager có tồn tại không
        if (body.managerId) {
            const manager = await Employee.findById(body.managerId);
            if (!manager) {
                return NextResponse.json(
                    { error: 'Quản lý không tồn tại' },
                    { status: 400 }
                );
            }
        }

        // Tạo nhân viên mới
        const employee = new Employee(body);
        await employee.save();

        return NextResponse.json({
            employee,
            message: 'Tạo nhân viên thành công'
        }, { status: 201 });
    } catch (error: any) {
        console.error('Error creating employee:', error);
        return NextResponse.json(
            { error: error.message || 'Không thể tạo nhân viên' },
            { status: 500 }
        );
    }
} 