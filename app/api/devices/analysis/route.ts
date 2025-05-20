import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import Device from '@/models/Device';

// GET /api/devices/analysis - Phân tích thiết bị nâng cao
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

        // Phân tích thiết bị theo phòng ban
        const devicesByDepartment = await Device.aggregate([
            {
                $lookup: {
                    from: 'employees',
                    localField: 'assignedTo',
                    foreignField: '_id',
                    as: 'employeeData'
                }
            },
            {
                $unwind: {
                    path: '$employeeData',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $group: {
                    _id: '$employeeData.department',
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    department: { $ifNull: ['$_id', 'Không có phòng ban'] },
                    count: 1,
                    _id: 0
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);

        // Phân tích tuổi thiết bị (dựa trên ngày mua)
        const deviceAgeAnalysis = await Device.aggregate([
            {
                $project: {
                    ageInDays: {
                        $divide: [
                            { $subtract: [new Date(), '$purchaseDate'] },
                            1000 * 60 * 60 * 24
                        ]
                    }
                }
            },
            {
                $group: {
                    _id: {
                        $cond: [
                            { $lt: ['$ageInDays', 180] }, // < 6 tháng
                            'under_6_months',
                            {
                                $cond: [
                                    { $lt: ['$ageInDays', 365] }, // < 1 năm
                                    'under_1_year',
                                    {
                                        $cond: [
                                            { $lt: ['$ageInDays', 730] }, // < 2 năm
                                            'under_2_years',
                                            {
                                                $cond: [
                                                    { $lt: ['$ageInDays', 1095] }, // < 3 năm
                                                    'under_3_years',
                                                    'over_3_years'
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    },
                    count: { $sum: 1 }
                }
            }
        ]);

        // Phân tích thiết bị sắp hết hạn bảo hành
        const warrantyExpiryAnalysis = await Device.aggregate([
            {
                $match: {
                    warrantyExpiryDate: { $exists: true, $ne: null }
                }
            },
            {
                $project: {
                    daysUntilExpiry: {
                        $divide: [
                            { $subtract: ['$warrantyExpiryDate', new Date()] },
                            1000 * 60 * 60 * 24
                        ]
                    }
                }
            },
            {
                $group: {
                    _id: {
                        $cond: [
                            { $lt: ['$daysUntilExpiry', 0] },
                            'expired',
                            {
                                $cond: [
                                    { $lt: ['$daysUntilExpiry', 30] },
                                    'expiring_soon',
                                    'valid'
                                ]
                            }
                        ]
                    },
                    count: { $sum: 1 }
                }
            }
        ]);

        // Tính tỷ lệ sử dụng thiết bị
        const deviceUtilizationRate = await Device.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    inUse: {
                        $sum: {
                            $cond: [
                                { $eq: ['$status', 'in_use'] },
                                1,
                                0
                            ]
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    total: 1,
                    inUse: 1,
                    utilizationRate: {
                        $cond: [
                            { $eq: ['$total', 0] },
                            0,
                            { $multiply: [{ $divide: ['$inUse', '$total'] }, 100] }
                        ]
                    }
                }
            }
        ]);

        return NextResponse.json({
            byDepartment: devicesByDepartment,
            byAge: deviceAgeAnalysis,
            byWarranty: warrantyExpiryAnalysis,
            utilization: deviceUtilizationRate[0] || { total: 0, inUse: 0, utilizationRate: 0 }
        });
    } catch (error: any) {
        console.error('Error analyzing devices:', error);
        return new NextResponse(
            JSON.stringify({ error: error.message || 'Đã xảy ra lỗi khi phân tích thiết bị' }),
            { status: 500 }
        );
    }
} 