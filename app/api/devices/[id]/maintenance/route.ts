import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import Device from '@/models/Device';
import { Types } from 'mongoose';

// POST /api/devices/[id]/maintenance - Thêm thông tin bảo trì cho thiết bị
export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        await connectDB();
        
        // Validate ObjectId
        if (!Types.ObjectId.isValid(params.id)) {
            return NextResponse.json(
                { error: 'ID không hợp lệ' },
                { status: 400 }
            );
        }

        const device = await Device.findById(params.id);
        if (!device) {
            return NextResponse.json(
                { error: 'Không tìm thấy thiết bị' },
                { status: 404 }
            );
        }

        const { description, technician, date } = await req.json();

        if (!description || !technician || !date) {
            return NextResponse.json(
                { error: 'Thiếu thông tin bảo trì' },
                { status: 400 }
            );
        }

        // Thêm thông tin bảo trì vào lịch sử
        if (!device.maintenanceHistory) {
            device.maintenanceHistory = [];
        }
        
        device.maintenanceHistory.push({
            date: new Date(date),
            description,
            technician
        });

        // Cập nhật ngày bảo trì gần nhất
        device.lastMaintenanceDate = new Date(date);

        // Tính ngày bảo trì tiếp theo (mặc định là 6 tháng sau)
        const nextMaintenanceDate = new Date(date);
        nextMaintenanceDate.setMonth(nextMaintenanceDate.getMonth() + 6);
        device.nextMaintenanceDate = nextMaintenanceDate;

        await device.save();

        return NextResponse.json({
            message: 'Đã ghi nhận bảo trì thành công',
            device
        });
    } catch (error: any) {
        console.error('Error updating device maintenance:', error);
        return NextResponse.json(
            { error: error.message || 'Không thể cập nhật thông tin bảo trì' },
            { status: 500 }
        );
    }
}
