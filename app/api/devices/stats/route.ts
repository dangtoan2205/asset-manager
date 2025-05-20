import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import Device from '@/models/Device';

// GET /api/devices/stats - Lấy thống kê thiết bị
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

        // Tổng số thiết bị
        const totalDevices = await Device.countDocuments();

        // Thống kê theo trạng thái
        const statusStats = await Device.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);

        // Thống kê theo loại thiết bị
        const typeStats = await Device.aggregate([
            {
                $group: {
                    _id: "$type",
                    count: { $sum: 1 }
                }
            }
        ]);

        // Đếm thiết bị đã được gán
        const assignedDevices = await Device.countDocuments({ assignedTo: { $ne: null } });

        // Thiết bị không hoạt động
        const inactiveDevices = await Device.countDocuments({
            status: { $in: ['under_repair', 'disposed'] }
        });

        // Định dạng kết quả
        const formattedStatusStats = statusStats.reduce((acc: any, stat) => {
            acc[stat._id] = stat.count;
            return acc;
        }, {});

        const formattedTypeStats = typeStats.reduce((acc: any, stat) => {
            acc[stat._id] = stat.count;
            return acc;
        }, {});

        return NextResponse.json({
            total: totalDevices,
            byStatus: formattedStatusStats,
            byType: formattedTypeStats,
            assigned: assignedDevices,
            inactive: inactiveDevices
        });
    } catch (error: any) {
        console.error('Error fetching device stats:', error);
        return new NextResponse(
            JSON.stringify({ error: error.message || 'Đã xảy ra lỗi khi lấy thống kê thiết bị' }),
            { status: 500 }
        );
    }
} 