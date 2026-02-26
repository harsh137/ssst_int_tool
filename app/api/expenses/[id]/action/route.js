import { NextResponse } from 'next/server';
import { verifyJwt } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import Expense from '@/lib/models/Expense';
import User from '@/lib/models/User';

async function isSuperAdmin(req) {
    const token = req.cookies.get('ssst_token')?.value;
    if (!token) return false;
    const decoded = verifyJwt(token);
    if (!decoded || decoded.role !== 'super_admin') return false;

    await connectDB();
    const user = await User.findById(decoded.userId);
    return user && user.isActive && user.role === 'super_admin' ? user : false;
}

export async function PATCH(req, context) {
    try {
        const adminUser = await isSuperAdmin(req);
        if (!adminUser) {
            return NextResponse.json({ error: 'Super Admin access required to approve/reject expenses' }, { status: 403 });
        }

        const { id } = await context.params;
        const { action, rejectionReason } = await req.json(); // action: 'approve' | 'reject'

        if (!['approve', 'reject'].includes(action)) {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        if (action === 'reject' && !rejectionReason) {
            return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });
        }

        await connectDB();

        const expense = await Expense.findById(id);
        if (!expense) {
            return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
        }

        if (expense.status !== 'pending') {
            return NextResponse.json({ error: 'Only pending expenses can be approved or rejected' }, { status: 400 });
        }

        expense.status = action === 'approve' ? 'approved' : 'rejected';
        expense.approvedBy = adminUser._id.toString();
        expense.approvedByName = adminUser.name;

        if (action === 'reject') {
            expense.rejectionReason = rejectionReason;
        }

        await expense.save();

        const { logAction } = await import('@/lib/logger');
        const actionStr = action === 'approve' ? 'APPROVE' : 'REJECT';
        await logAction({
            action: actionStr,
            resource: 'Expense',
            details: `${action === 'approve' ? 'Approved' : 'Rejected'} expense: ₹${expense.amount} for ${expense.category}`,
            resourceId: expense._id,
            userOverride: adminUser
        });

        return NextResponse.json({ success: true, expense });
    } catch (error) {
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}

export async function DELETE(req, context) {
    try {
        const adminUser = await isSuperAdmin(req);
        if (!adminUser) {
            return NextResponse.json({ error: 'Super Admin access required to delete expenses' }, { status: 403 });
        }

        const { id } = await context.params;
        await connectDB();

        const deleted = await Expense.findByIdAndDelete(id);

        if (!deleted) {
            return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
        }

        const { logAction } = await import('@/lib/logger');
        await logAction({
            action: 'DELETE',
            resource: 'Expense',
            details: `Deleted expense: ₹${deleted.amount} for ${deleted.category}`,
            resourceId: deleted._id,
            userOverride: adminUser
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}
