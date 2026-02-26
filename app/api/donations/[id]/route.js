import { NextResponse } from 'next/server';
import { verifyJwt } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import Donation from '@/lib/models/Donation';
import User from '@/lib/models/User';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';

async function getUser(req) {
    const token = req.cookies.get('ssst_token')?.value;
    if (!token) return null;
    const decoded = verifyJwt(token);
    if (!decoded) return null;

    await connectDB();
    const user = await User.findById(decoded.userId);
    return user && user.isActive ? user : null;
}

export async function GET(req, context) {
    try {
        const user = await getUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await context.params;

        await connectDB();
        const donation = await Donation.findById(id);
        if (!donation) return NextResponse.json({ error: 'Donation not found' }, { status: 404 });

        return NextResponse.json({ success: true, donation });
    } catch (error) {
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}

export async function PUT(req, context) {
    try {
        const user = await getUser(req);
        if (!user || !hasPermission(user, PERMISSIONS.DONATION_EDIT)) {
            return NextResponse.json({ error: 'Unauthorized to edit donations' }, { status: 403 });
        }

        const { id } = await context.params;
        const data = await req.json();

        // Remove fields that should not be updated
        delete data._id;
        delete data.receiptNumber;
        delete data.createdBy;
        delete data.createdByName;

        await connectDB();

        const oldDonation = await Donation.findById(id);
        if (!oldDonation) return NextResponse.json({ error: 'Donation not found' }, { status: 404 });

        const updated = await Donation.findByIdAndUpdate(id, data, { new: true });

        const { logAction } = await import('@/lib/logger');
        await logAction({
            action: 'UPDATE',
            resource: 'Donation',
            resourceId: id,
            details: `Updated donation ${updated.receiptNumber} (Donor: ${updated.donorName})`,
            userOverride: user
        });

        return NextResponse.json({ success: true, donation: updated });
    } catch (error) {
        console.error('Update Donation Error:', error);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}

export async function DELETE(req, context) {
    try {
        const user = await getUser(req);
        if (!user || !hasPermission(user, PERMISSIONS.DONATION_DELETE)) {
            return NextResponse.json({ error: 'Unauthorized to delete donations' }, { status: 403 });
        }

        const { id } = await context.params;

        await connectDB();

        const deleted = await Donation.findByIdAndDelete(id);
        if (!deleted) return NextResponse.json({ error: 'Donation not found' }, { status: 404 });

        const { logAction } = await import('@/lib/logger');
        await logAction({
            action: 'DELETE',
            resource: 'Donation',
            resourceId: id,
            details: `Deleted donation ${deleted.receiptNumber} (Amount: ₹${deleted.amount})`,
            userOverride: user
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete Donation Error:', error);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}
