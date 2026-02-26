import { NextResponse } from 'next/server';
import { verifyJwt } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import Settings from '@/lib/models/Settings';
import User from '@/lib/models/User';

// Helper to check Super Admin access
async function isSuperAdmin(req) {
    const token = req.cookies.get('ssst_token')?.value;
    if (!token) return false;

    const decoded = verifyJwt(token);
    if (!decoded || decoded.role !== 'super_admin') return false;

    await connectDB();
    const user = await User.findById(decoded.userId);
    return user && user.isActive && user.role === 'super_admin' ? user : false;
}

export async function GET() {
    try {
        await connectDB();
        const settingsDocs = await Settings.find({});

        // Convert array of docs to a key-value object
        const settings = {};
        settingsDocs.forEach(doc => {
            settings[doc.key] = doc.value;
        });

        // Ensure defaults if missing
        if (!settings.upiQrUrl) settings.upiQrUrl = '';

        return NextResponse.json({ success: true, settings });
    } catch (error) {
        console.error('Settings GET Error:', error);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}

export async function PUT(req) {
    try {
        const adminUser = await isSuperAdmin(req);
        if (!adminUser) {
            return NextResponse.json({ error: 'Unauthorized: Super Admin access required' }, { status: 403 });
        }

        const updates = await req.json(); // e.g., { upiQrUrl: 'https://...' }
        await connectDB();

        for (const [key, value] of Object.entries(updates)) {
            await Settings.findOneAndUpdate(
                { key },
                {
                    value,
                    updatedBy: adminUser._id.toString(),
                    updatedByName: adminUser.name
                },
                { upsert: true, new: true }
            );
        }

        const { logAction } = await import('@/lib/logger');
        await logAction({
            action: 'UPDATE',
            resource: 'Settings',
            details: `Updated trust settings: ${Object.keys(updates).join(', ')}`,
            userOverride: adminUser
        });

        return NextResponse.json({ success: true, message: 'Settings updated' });
    } catch (error) {
        console.error('Settings PUT Error:', error);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}
