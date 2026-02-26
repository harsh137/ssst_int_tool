import { NextResponse } from 'next/server';
import { verifyJwt } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import Donation from '@/lib/models/Donation';
import User from '@/lib/models/User';

async function getUser(req) {
    const token = req.cookies.get('ssst_token')?.value;
    if (!token) return null;
    const decoded = verifyJwt(token);
    if (!decoded) return null;

    await connectDB();
    const user = await User.findById(decoded.userId);
    return user && user.isActive ? user : null;
}

// Generate unique receipt number (e.g. REC-2026-0001)
async function generateReceiptNumber() {
    const year = new Date().getFullYear();
    const prefix = `REC-${year}-`;

    // Find the latest donation for this year to get the highest sequence
    const latestDonation = await Donation.findOne({
        receiptNumber: new RegExp(`^${prefix}`)
    }).sort({ receiptNumber: -1 });

    let nextSequence = 1;
    if (latestDonation && latestDonation.receiptNumber) {
        const lastParts = latestDonation.receiptNumber.split('-');
        const lastSeq = parseInt(lastParts[lastParts.length - 1]);
        if (!isNaN(lastSeq)) {
            nextSequence = lastSeq + 1;
        }
    }

    const sequence = nextSequence.toString().padStart(4, '0');
    return `${prefix}${sequence}`;
}

export async function GET(req) {
    try {
        const user = await getUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const utsavId = searchParams.get('utsavId');
        const fundType = searchParams.get('fundType');

        await connectDB();

        const filter = {};
        if (utsavId) filter.utsavId = utsavId;
        if (fundType) filter.fundType = fundType;

        const donations = await Donation.find(filter).sort({ createdAt: -1 });

        return NextResponse.json({ success: true, donations });
    } catch (error) {
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const user = await getUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const data = await req.json();

        // Basic Validation
        if (!data.donorName || !data.amount || !data.fundType || !data.paymentMode || !data.date) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        await connectDB();

        const receiptNumber = await generateReceiptNumber();

        const newDonation = new Donation({
            ...data,
            receiptNumber,
            createdBy: user._id.toString(),
            createdByName: user.name
        });

        await newDonation.save();

        const { logAction } = await import('@/lib/logger');
        await logAction({
            action: 'CREATE',
            resource: 'Donation',
            details: `Created donation: ₹${data.amount} from ${data.donorName} (${receiptNumber})`,
            resourceId: newDonation._id,
            userOverride: user
        });

        // TODO: In Phase 2 - generate PDF, upload to Cloudinary, and send WA message (wa.me link generation happens on client)

        return NextResponse.json({ success: true, donation: newDonation }, { status: 201 });
    } catch (error) {
        console.error('Donation Creation Error:', error);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}
