import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import Employee from '@/models/Employee';
import Device from '@/models/Device';
import Component from '@/models/Component';
import Account from '@/models/Account';

// POST /api/employees/[id]/assign - Gán tài sản cho nhân viên
export async function POST(
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

        // Kiểm tra nhân viên có tồn tại không
        const employee = await Employee.findById(params.id);
        if (!employee) {
            return new NextResponse(
                JSON.stringify({ error: 'Không tìm thấy nhân viên' }),
                { status: 404 }
            );
        }

        const body = await req.json();
        const { action, assetType, assetId } = body;

        if (!action || !assetType || !assetId) {
            return new NextResponse(
                JSON.stringify({ error: 'Thiếu thông tin cần thiết (action, assetType, assetId)' }),
                { status: 400 }
            );
        }

        if (action !== 'assign' && action !== 'unassign') {
            return new NextResponse(
                JSON.stringify({ error: 'Hành động không hợp lệ. Chỉ chấp nhận "assign" hoặc "unassign"' }),
                { status: 400 }
            );
        }

        let result;

        // Xử lý theo loại tài sản
        if (assetType === 'device') {
            const device = await Device.findById(assetId);
            if (!device) {
                return new NextResponse(
                    JSON.stringify({ error: 'Không tìm thấy thiết bị' }),
                    { status: 404 }
                );
            }

            if (action === 'assign') {
                // Kiểm tra thiết bị đã được gán chưa
                if (device.assignedTo) {
                    // Nếu đã được gán cho chính nhân viên này
                    if (device.assignedTo.toString() === params.id) {
                        return new NextResponse(
                            JSON.stringify({ 
                                error: `Thiết bị này đã được gán cho nhân viên này rồi` 
                            }),
                            { status: 400 }
                        );
                    }
                    
                    // Nếu đã được gán cho nhân viên khác
                    const currentAssignee = await Employee.findById(device.assignedTo);
                    return new NextResponse(
                        JSON.stringify({ 
                            error: `Thiết bị này đã được gán cho nhân viên khác: ${currentAssignee ? currentAssignee.name : 'Unknown'}` 
                        }),
                        { status: 400 }
                    );
                }

                // Cập nhật thiết bị
                device.assignedTo = params.id;
                device.status = 'in_use';
            } else { // unassign
                // Kiểm tra thiết bị có đang được gán cho nhân viên này không
                if (!device.assignedTo || device.assignedTo.toString() !== params.id) {
                    return new NextResponse(
                        JSON.stringify({ error: 'Thiết bị này không được gán cho nhân viên này' }),
                        { status: 400 }
                    );
                }

                // Cập nhật thiết bị
                device.assignedTo = null;
                device.status = 'available';
            }

            await device.save();
            result = device;
        } 
        else if (assetType === 'component') {
            const component = await Component.findById(assetId);
            if (!component) {
                return new NextResponse(
                    JSON.stringify({ error: 'Không tìm thấy linh kiện' }),
                    { status: 404 }
                );
            }

            if (action === 'assign') {
                // Kiểm tra linh kiện đã được gán chưa
                if (component.assignedTo) {
                    // Nếu đã được gán cho chính nhân viên này
                    if (component.assignedTo.toString() === params.id) {
                        return new NextResponse(
                            JSON.stringify({ 
                                error: `Linh kiện này đã được gán cho nhân viên này rồi` 
                            }),
                            { status: 400 }
                        );
                    }
                    
                    // Nếu đã được gán cho nhân viên khác
                    const currentAssignee = await Employee.findById(component.assignedTo);
                    return new NextResponse(
                        JSON.stringify({ 
                            error: `Linh kiện này đã được gán cho nhân viên khác: ${currentAssignee ? currentAssignee.name : 'Unknown'}` 
                        }),
                        { status: 400 }
                    );
                }

                // Cập nhật linh kiện
                component.assignedTo = params.id;
                component.status = 'in_use';
            } else { // unassign
                // Kiểm tra linh kiện có đang được gán cho nhân viên này không
                if (!component.assignedTo || component.assignedTo.toString() !== params.id) {
                    return new NextResponse(
                        JSON.stringify({ error: 'Linh kiện này không được gán cho nhân viên này' }),
                        { status: 400 }
                    );
                }

                // Cập nhật linh kiện
                component.assignedTo = null;
                component.status = 'available';
            }

            await component.save();
            result = component;
        }
        else if (assetType === 'account') {
            const account = await Account.findById(assetId);
            if (!account) {
                return new NextResponse(
                    JSON.stringify({ error: 'Không tìm thấy tài khoản' }),
                    { status: 404 }
                );
            }

            if (action === 'assign') {
                // Kiểm tra tài khoản đã được gán cho nhân viên khác chưa
                if (account.assignedTo) {
                    // Nếu đã được gán cho chính nhân viên này
                    if (account.assignedTo.toString() === params.id) {
                        return new NextResponse(
                            JSON.stringify({ 
                                error: `Tài khoản này đã được gán cho nhân viên này rồi` 
                            }),
                            { status: 400 }
                        );
                    }
                    
                    // Nếu đã được gán cho nhân viên khác
                    const currentAssignee = await Employee.findById(account.assignedTo);
                    return new NextResponse(
                        JSON.stringify({ 
                            error: `Tài khoản này đã được gán cho nhân viên khác: ${currentAssignee ? currentAssignee.name : 'Unknown'}` 
                        }),
                        { status: 400 }
                    );
                }

                // Cập nhật tài khoản
                account.assignedTo = params.id;
            } else { // unassign
                // Kiểm tra tài khoản có đang được gán cho nhân viên này không
                if (!account.assignedTo || account.assignedTo.toString() !== params.id) {
                    return new NextResponse(
                        JSON.stringify({ error: 'Tài khoản này không được gán cho nhân viên này' }),
                        { status: 400 }
                    );
                }

                // Cập nhật tài khoản
                account.assignedTo = null;
            }

            await account.save();
            result = account;
        } 
        else {
            return new NextResponse(
                JSON.stringify({ error: 'Loại tài sản không hợp lệ. Chỉ chấp nhận "device", "component" hoặc "account"' }),
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            message: `${action === 'assign' ? 'Gán' : 'Gỡ bỏ'} ${assetType} thành công`,
            data: result
        });
    } catch (error: any) {
        console.error(`Error in employee assignment:`, error);
        return new NextResponse(
            JSON.stringify({ error: error.message || 'Đã xảy ra lỗi khi thực hiện thao tác' }),
            { status: 500 }
        );
    }
}