import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import Account from '@/models/Account';

export async function updateAccountStatuses() {
  await connectDB();
  
  // Find all accounts
  const accounts = await Account.find({});
  console.log(`Found ${accounts.length} accounts to update`);
  
  // Update each account's assignmentStatus based on assignedTo
  let updated = 0;
  for (const account of accounts) {
    const assignmentStatus = account.assignedTo ? 'assigned' : 'available';
    
    // Only update if assignment status is missing or incorrect
    if (account.assignmentStatus !== assignmentStatus) {
      await Account.updateOne(
        { _id: account._id },
        { $set: { assignmentStatus } }
      );
      updated++;
    }
  }
  
  console.log(`Updated ${updated} accounts with assignment status`);
  return { total: accounts.length, updated };
}

// GET /api/accounts/update-statuses - Cập nhật trạng thái gán cho tất cả tài khoản
export async function GET(req: NextRequest) {
  try {
    // Kiểm tra xác thực
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Kiểm tra quyền hạn
    const userRole = session.user.role;
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const result = await updateAccountStatuses();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating accounts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}