import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { verifyJwt } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import User from '@/lib/models/User';

async function isSuperAdmin(req) {
    const token = req.cookies.get('ssst_token')?.value;
    if (!token) return false;
    const decoded = verifyJwt(token);
    if (!decoded || decoded.role !== 'super_admin') return false;

    await connectDB();
    const user = await User.findById(decoded.userId);
    return user && user.isActive && user.role === 'super_admin';
}

export async function PATCH(req, context) {
    try {
        if (!(await isSuperAdmin(req))) {
            return NextResponse.json({ error: 'Super Admin access required' }, { status: 403 });
        }

        // Next.js 15: params must be awaited
        const { id } = await context.params;
        const updates = await req.json();

        // Handle password change via tempPassword field
        if (updates.tempPassword) {
            updates.password = await bcrypt.hash(updates.tempPassword, 10);
        }
        // Always remove these temp/frontend-only fields before saving
        delete updates.tempPassword;

        await connectDB();

        // Don't let a super admin deactivate the master account
        if (updates.isActive === false) {
            const targetUser = await User.findById(id);
            if (targetUser && targetUser.mobile === '9999999999') {
                return NextResponse.json({ error: 'Cannot deactivate master admin' }, { status: 403 });
            }
        }

        const updatedUser = await User.findByIdAndUpdate(id, updates, { new: true }).select('-password');

        if (!updatedUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const { logAction } = await import('@/lib/logger');
        const isStatusChange = updates.isActive !== undefined;
        let details = `Updated user: ${updatedUser.name}`;
        if (isStatusChange) details = `${updates.isActive ? 'Activated' : 'Deactivated'} user: ${updatedUser.name}`;

        await logAction({
            action: 'UPDATE',
            resource: 'User',
            details,
            resourceId: updatedUser._id,
            metadata: { updatesKeys: Object.keys(updates) }
        });

        return NextResponse.json({ success: true, user: updatedUser });
    } catch (error) {
        console.error('User PATCH error:', error);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}
