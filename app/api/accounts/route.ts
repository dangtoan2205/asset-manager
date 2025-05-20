import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import Account from '@/models/Account';
import mongoose from 'mongoose';

// GET /api/accounts - Lấy danh sách tài khoản
export async function GET(req: NextRequest) {
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

        // Kết nối đến database
        await connectDB();

        // Lấy query parameters
        const searchParams = req.nextUrl.searchParams;
        const category = searchParams.get('category');
        const type = searchParams.get('type');
        const subType = searchParams.get('subType');
        const status = searchParams.get('status');
        const search = searchParams.get('search');
        const assignedTo = searchParams.get('assignedTo');
        const unassigned = searchParams.get('unassigned');
        const limit = parseInt(searchParams.get('limit') || '10');
        const page = parseInt(searchParams.get('page') || '1');
        const skip = (page - 1) * limit;

        // Truy vấn trực tiếp collection accounts để tránh abstraction bugs
        const db = mongoose.connection.db;
        const accountsCollection = db.collection('accounts');
        
        // Xây dựng query
        const query: any = {};
        if (category) query.category = category;
        if (type) query.type = type;
        if (subType) query.subType = subType;
        if (status) query.status = status;
        
        // Xử lý trường hợp đặc biệt: tìm tài khoản chưa được gán
        if (unassigned === 'true') {
            // Tìm tài khoản với assignedTo là null hoặc không có field assignedTo
            query.$or = [
                { assignedTo: null },
                { assignedTo: { $exists: false } }
            ];
            console.log("Searching for unassigned accounts with query:", JSON.stringify(query));
        } 
        // Xử lý assignedTo đúng cách (chỉ khi unassigned không được chỉ định)
        else if (assignedTo) {
            try {
                // Chuyển đổi assignedTo thành ObjectId
                const employeeId = new mongoose.Types.ObjectId(assignedTo);
                query.assignedTo = employeeId;
                
                console.log(`Searching for accounts with assignedTo: ${assignedTo}, converted to ObjectId: ${employeeId}`);
            } catch (error) {
                console.error("Error processing assignedTo parameter:", error);
                return NextResponse.json({ error: 'Invalid employee ID format' }, { status: 400 });
            }
        }
        
        if (search) {
            const searchQuery = { $regex: search, $options: 'i' };
            const searchConditions = [
                { name: searchQuery },
                { username: searchQuery }
            ];
            
            // Optional fields
            if (query.$or) {
                // Nếu đã có $or (từ unassigned query), thì sử dụng $and để kết hợp
                query.$and = [
                    { $or: query.$or },
                    { $or: searchConditions }
                ];
                delete query.$or;
            } else {
                query.$or = searchConditions;
            }
        }

        console.log("Final MongoDB query:", JSON.stringify(query));

        // Đếm tổng số records phù hợp với query
        const totalAccounts = await accountsCollection.countDocuments(query);
        
        // Lấy accounts từ collection trực tiếp
        const rawAccounts = await accountsCollection.find(query)
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(limit)
            .toArray();
            
        // Dùng aggregation để lấy thông tin nhân viên
        const accounts = await Promise.all(rawAccounts.map(async (account) => {
            let employeeData = null;
            
            // Chỉ tìm thông tin nhân viên nếu có assignedTo và là ObjectId
            if (account.assignedTo && 
                (account.assignedTo instanceof mongoose.Types.ObjectId || 
                 mongoose.Types.ObjectId.isValid(account.assignedTo))) {
                try {
                    const employeesCollection = db.collection('employees');
                    employeeData = await employeesCollection.findOne({ 
                        _id: new mongoose.Types.ObjectId(account.assignedTo) 
                    });
                } catch (e) {
                    console.error(`Error fetching employee data for account ${account._id}:`, e);
                }
            }
            
            // Trả về account với thông tin nhân viên được gán
            return {
                ...account,
                assignedTo: employeeData ? {
                    _id: employeeData._id,
                    name: employeeData.name,
                    employeeId: employeeData.employeeId,
                    email: employeeData.email,
                    department: employeeData.department
                } : null
            };
        }));

        console.log(`Found ${accounts.length} accounts`);
        if (accounts.length > 0) {
            console.log("First account sample:", {
                _id: accounts[0]._id,
                name: accounts[0].name,
                assignedTo: accounts[0].assignedTo ? {
                    _id: accounts[0].assignedTo._id,
                    name: accounts[0].assignedTo.name
                } : null
            });
        }

        return NextResponse.json({
            accounts,
            pagination: {
                total: totalAccounts,
                page,
                limit,
                pages: Math.ceil(totalAccounts / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching accounts:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/accounts - Tạo tài khoản mới
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

        // Kiểm tra dữ liệu bắt buộc
        if (!data.name || !data.type || !data.username) {
            return NextResponse.json(
                { error: 'Name, type, and username are required' },
                { status: 400 }
            );
        }

        // Xử lý trường assignedTo để tránh lỗi MongoDB ObjectId
        if (data.assignedTo === "") {
            delete data.assignedTo;
            data.assignmentStatus = 'available';
        } else if (data.assignedTo) {
            data.assignmentStatus = 'assigned';
        } else {
            // Mặc định là available nếu không có assignedTo
            data.assignmentStatus = 'available';
        }

        // Đảm bảo lưu trữ thông tin phân loại nếu có
        if (data.subType === "") {
            delete data.subType;
        }
        
        if (data.category === "") {
            delete data.category;
        }

        // Kết nối đến database
        await connectDB();

        // Tạo tài khoản mới
        const newAccount = new Account(data);
        await newAccount.save();

        return NextResponse.json(
            { message: 'Account created successfully', account: newAccount },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error creating account:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}