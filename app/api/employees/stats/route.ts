import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import Employee from '@/models/Employee';

// GET /api/employees/stats - Lấy thống kê về nhân viên
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

        // Lấy tổng số nhân viên
        const totalEmployees = await Employee.countDocuments();
        
        // Lấy số nhân viên đang làm việc (status = 'active')
        const activeEmployees = await Employee.countDocuments({ status: 'active' });
        
        // Lấy số nhân viên đã nghỉ việc (status = 'inactive')
        const inactiveEmployees = await Employee.countDocuments({ status: 'inactive' });

        return NextResponse.json({
            total: totalEmployees,
            active: activeEmployees,
            inactive: inactiveEmployees
        });
    } catch (error: any) {
        console.error('Error fetching employee stats:', error);
        return NextResponse.json(
            { error: 'Không thể lấy thống kê nhân viên' },
            { status: 500 }
        );
    }
}
