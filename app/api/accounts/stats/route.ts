import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import Account from '@/models/Account';

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

        // Tính tổng số tài khoản
        const totalAccounts = await Account.countDocuments();

        // Thống kê theo trạng thái
        const activeAccounts = await Account.countDocuments({ status: 'active' });
        const inactiveAccounts = await Account.countDocuments({ status: 'inactive' });
        const expiredAccounts = await Account.countDocuments({ status: 'expired' });

        // Thống kê theo loại
        const vpnAccounts = await Account.countDocuments({ type: 'vpn' });
        const githubAccounts = await Account.countDocuments({ type: 'github' });
        const bitbucketAccounts = await Account.countDocuments({ type: 'bitbucket' });
        const jiraAccounts = await Account.countDocuments({ type: 'jira' });
        const confluenceAccounts = await Account.countDocuments({ type: 'confluence' });
        const cloudAccounts = await Account.countDocuments({
            $or: [
                { type: 'aws' },
                { type: 'azure' },
                { type: 'gcp' }
            ]
        });
        const otherAccounts = await Account.countDocuments({ type: 'other' });

        // Trả về thống kê
        return NextResponse.json({
            totalAccounts,
            statusStats: {
                active: activeAccounts,
                inactive: inactiveAccounts,
                expired: expiredAccounts
            },
            typeStats: {
                vpn: vpnAccounts,
                github: githubAccounts,
                bitbucket: bitbucketAccounts,
                jira: jiraAccounts,
                confluence: confluenceAccounts,
                cloud: cloudAccounts,
                other: otherAccounts
            }
        });
    } catch (error) {
        console.error('Error fetching account stats:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 