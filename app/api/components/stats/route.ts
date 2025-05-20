import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import Component from '@/models/Component';

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

        // Tổng số linh kiện
        const total = await Component.countDocuments();

        // Thống kê theo trạng thái
        const byStatus = {
            available: await Component.countDocuments({ status: 'available' }),
            in_use: await Component.countDocuments({ status: 'in_use' }),
            under_repair: await Component.countDocuments({ status: 'under_repair' }),
            disposed: await Component.countDocuments({ status: 'disposed' }),
        };

        // Thống kê theo loại
        const byType = {
            ram: await Component.countDocuments({ type: 'ram' }),
            storage: await Component.countDocuments({ type: 'storage' }),
            cpu: await Component.countDocuments({ type: 'cpu' }),
            gpu: await Component.countDocuments({ type: 'gpu' }),
            motherboard: await Component.countDocuments({ type: 'motherboard' }),
            power_supply: await Component.countDocuments({ type: 'power_supply' }),
            cooling: await Component.countDocuments({ type: 'cooling' }),
            peripheral: await Component.countDocuments({ type: 'peripheral' }),
            cable: await Component.countDocuments({ type: 'cable' }),
            network: await Component.countDocuments({ type: 'network' }),
            other: await Component.countDocuments({ type: 'other' }),
        };

        // Số linh kiện đã được gán cho nhân viên
        const assigned = await Component.countDocuments({ assignedTo: { $ne: null } });

        // Số linh kiện đã được lắp vào thiết bị
        const installed = await Component.countDocuments({ installedIn: { $ne: null } });

        // Số linh kiện không hoạt động (đang sửa hoặc đã thanh lý)
        const inactive = byStatus.under_repair + byStatus.disposed;

        return NextResponse.json({
            total,
            byStatus,
            byType,
            assigned,
            installed,
            inactive,
        });
    } catch (error: any) {
        console.error('Error fetching component stats:', error);
        return new NextResponse(
            JSON.stringify({ error: error.message || 'Đã xảy ra lỗi khi lấy thống kê linh kiện' }),
            { status: 500 }
        );
    }
} 