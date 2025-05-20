import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import Account from '@/models/Account';
import Component from '@/models/Component';
import Device from '@/models/Device';
import mongoose from 'mongoose';

// POST /api/unassign - Hủy gán tài sản (account, device, component) khỏi nhân viên
export async function POST(req: NextRequest) {
    try {
        // Kiểm tra xác thực
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Kiểm tra quyền hạn
        const userRole = session.user.role;
        if (userRole !== 'admin' && userRole !== 'manager') {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        // Lấy dữ liệu từ request body
        const data = await req.json();
        
        // Kiểm tra các thông tin cần thiết
        if (!data.type || !data.assetId || !mongoose.isValidObjectId(data.assetId)) {
            return NextResponse.json({ 
                error: 'Invalid request. Required fields: type, assetId' 
            }, { status: 400 });
        }

        // Kết nối đến database
        await connectDB();

        // Xử lý theo loại tài sản
        const { type, assetId } = data;
        
        let result;
        
        switch (type.toLowerCase()) {
            case 'account':
                // Kiểm tra tài khoản tồn tại
                const existingAccount = await Account.findById(assetId);
                if (!existingAccount) {
                    return NextResponse.json({ error: 'Account not found' }, { status: 404 });
                }

                // Kiểm tra xem tài khoản có được gán cho nhân viên không
                if (!existingAccount.assignedTo) {
                    return NextResponse.json({ error: 'Account is not assigned to any employee' }, { status: 400 });
                }

                // Hủy gán tài khoản
                result = await Account.findByIdAndUpdate(
                    assetId,
                    { 
                        $set: { 
                            assignedTo: null,
                            status: 'active', // Cập nhật trạng thái tài khoản thành active
                            assignmentStatus: 'available' // Cập nhật trạng thái gán thành available
                        } 
                    },
                    { new: true }
                );
                
                return NextResponse.json({
                    message: 'Account unassigned successfully',
                    asset: result
                });
                
            case 'component':
                // Kiểm tra component tồn tại
                const existingComponent = await Component.findById(assetId);
                if (!existingComponent) {
                    return NextResponse.json({ error: 'Component not found' }, { status: 404 });
                }

                // Kiểm tra xem component có được gán cho nhân viên không
                if (!existingComponent.assignedTo) {
                    return NextResponse.json({ error: 'Component is not assigned to any employee' }, { status: 400 });
                }

                // Hủy gán component và cập nhật trạng thái
                result = await Component.findByIdAndUpdate(
                    assetId,
                    { 
                        $set: { 
                            assignedTo: null,
                            status: 'available' // Cập nhật trạng thái component thành available
                        } 
                    },
                    { new: true }
                );
                
                return NextResponse.json({
                    message: 'Component unassigned successfully',
                    asset: result
                });
                
            case 'device':
                // Kiểm tra thiết bị tồn tại
                const existingDevice = await Device.findById(assetId);
                if (!existingDevice) {
                    return NextResponse.json({ error: 'Device not found' }, { status: 404 });
                }

                // Kiểm tra xem thiết bị có được gán cho nhân viên không
                if (!existingDevice.assignedTo) {
                    return NextResponse.json({ error: 'Device is not assigned to any employee' }, { status: 400 });
                }

                // Hủy gán thiết bị và cập nhật trạng thái
                result = await Device.findByIdAndUpdate(
                    assetId,
                    { 
                        $set: { 
                            assignedTo: null,
                            status: 'available' // Cập nhật trạng thái thiết bị thành available
                        } 
                    },
                    { new: true }
                );
                
                return NextResponse.json({
                    message: 'Device unassigned successfully',
                    asset: result
                });
                
            default:
                return NextResponse.json({ 
                    error: 'Invalid asset type. Supported types: account, component, device' 
                }, { status: 400 });
        }
    } catch (error) {
        console.error('Error unassigning asset:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}