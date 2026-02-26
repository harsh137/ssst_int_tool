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
    return user && user.isActive && user.role === 'super_admin' ? user : false;
}

export async function GET(req) {
    try {
        // Must be logged in to view utsavs
        const token = req.cookies.get('ssst_token')?.value;
        if (!verifyJwt(token)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const includeCompleted = searchParams.get('includeCompleted') === 'true';

        await connectDB();

        const query = includeCompleted ? {} : { status: 'active' };
        const utsavs = await Utsav.find(query).sort({ startDate: -1 });

        return NextResponse.json({ success: true, utsavs });
    } catch (error) {
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const adminUser = await isSuperAdmin(req);
        if (!adminUser) return NextResponse.json({ error: 'Super Admin access required' }, { status: 403 });

        const data = await req.json();

        if (!data.name || !data.startDate || !data.endDate) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        await connectDB();

        const newUtsav = new Utsav({
            ...data,
            createdBy: adminUser._id.toString(),
            createdByName: adminUser.name
        });

        await newUtsav.save();

        const { logAction } = await import('@/lib/logger');
        await logAction({
            action: 'CREATE',
            resource: 'Utsav',
            details: `Created new Utsav: ${data.name}`,
            resourceId: newUtsav._id,
            userOverride: adminUser
        });

        return NextResponse.json({ success: true, utsav: newUtsav }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}
