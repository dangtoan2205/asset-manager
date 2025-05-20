import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';

// This is a debugging API route to examine the raw MongoDB data
export async function GET(req: NextRequest) {
    try {
        // Kiểm tra xác thực
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Kiểm tra quyền hạn (chỉ admin mới có thể truy cập API debug)
        const userRole = session.user.role;
        if (userRole !== 'admin') {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        // Kết nối đến database
        await connectDB();

        // Truy vấn trực tiếp collection accounts bằng mongoose
        const db = mongoose.connection.db;
        const accountsCollection = db.collection('accounts');
        
        // Lấy tất cả accounts và hiển thị dữ liệu raw
        const accounts = await accountsCollection.find({}).toArray();
        
        // Log các account details để phân tích
        console.log("Total accounts in collection:", accounts.length);
        accounts.forEach((account, index) => {
            console.log(`Account ${index + 1}:`, {
                _id: account._id,
                name: account.name,
                assignedTo: account.assignedTo,
                // Show the type of assignedTo for debugging
                assignedToType: account.assignedTo ? 
                    (account.assignedTo instanceof mongoose.Types.ObjectId ? 
                        'ObjectId' : typeof account.assignedTo) 
                    : 'null'
            });
        });

        return NextResponse.json({
            success: true,
            message: "Raw account data retrieved and logged to console",
            data: accounts.map(acc => ({
                _id: acc._id,
                name: acc.name,
                type: acc.type,
                assignedTo: acc.assignedTo,
                assignedToType: acc.assignedTo ? 
                    (acc.assignedTo instanceof mongoose.Types.ObjectId ? 
                        'ObjectId' : typeof acc.assignedTo) 
                    : 'null'
            }))
        });
    } catch (error) {
        console.error('Error debugging accounts:', error);
        return NextResponse.json({ 
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}