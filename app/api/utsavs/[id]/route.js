import { NextResponse } from 'next/server';
import { verifyJwt } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import Utsav from '@/lib/models/Utsav';
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

        const { id } = await context.params;
        const updates = await req.json();

        await connectDB();
        const updatedUtsav = await Utsav.findByIdAndUpdate(id, updates, { new: true });

        if (!updatedUtsav) {
            return NextResponse.json({ error: 'Utsav not found' }, { status: 404 });
        }

        const { logAction } = await import('@/lib/logger');
        const isStatusChange = updates.status !== undefined;
        let details = `Updated Utsav: ${updatedUtsav.name}`;
        if (isStatusChange) details = `${updatedUtsav.status === 'completed' ? 'Completed' : 'Reopened'} Utsav: ${updatedUtsav.name}`;

        // Get admin user from original check
        const adminUser = await User.findById(verifyJwt(req.cookies.get('ssst_token')?.value).userId);

        await logAction({
            action: 'UPDATE',
            resource: 'Utsav',
            details,
            resourceId: updatedUtsav._id,
            userOverride: adminUser
        });

        return NextResponse.json({ success: true, utsav: updatedUtsav });
    } catch (error) {
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}

export async function DELETE(req, context) {
    try {
        if (!(await isSuperAdmin(req))) {
            return NextResponse.json({ error: 'Super Admin access required' }, { status: 403 });
        }

        const { id } = await context.params;
        await connectDB();

        // Check if there are any donations linked to this utsav
        const Donation = (await import('@/lib/models/Donation')).default;
        const donationCount = await Donation.countDocuments({ utsavId: id });

        if (donationCount > 0) {
            return NextResponse.json({
                error: 'Cannot delete Utsav with existing donations. Please delete donations first.'
            }, { status: 400 });
        }

        const deletedUtsav = await Utsav.findByIdAndDelete(id);

        if (!deletedUtsav) {
            return NextResponse.json({ error: 'Utsav not found' }, { status: 404 });
        }

        const { logAction } = await import('@/lib/logger');
        const adminUser = await User.findById(verifyJwt(req.cookies.get('ssst_token')?.value).userId);

        await logAction({
            action: 'DELETE',
            resource: 'Utsav',
            details: `Deleted Utsav: ${deletedUtsav.name}`,
            resourceId: deletedUtsav._id,
            userOverride: adminUser
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Utsav Delete Error:', error);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}
