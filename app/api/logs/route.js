import { NextResponse } from 'next/server';
import { verifyJwt } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import User from '@/lib/models/User';
import AuditLog from '@/lib/models/AuditLog';

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
        if (!(await isSuperAdmin(req))) {
            return NextResponse.json({ error: 'Super Admin access required to view audit logs' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);

        // Pagination
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const skip = (page - 1) * limit;

        // Filters
        const query = {};

        const action = searchParams.get('action');
        if (action) query.action = action;

        const resource = searchParams.get('resource');
        if (resource) query.resource = resource;

        const userId = searchParams.get('userId');
        if (userId) query['user.id'] = userId;

        const search = searchParams.get('search');
        if (search) {
            query.details = { $regex: search, $options: 'i' };
        }

        await connectDB();

        const logs = await AuditLog.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(); // Faster for read-only

        const total = await AuditLog.countDocuments(query);
        const pages = Math.ceil(total / limit);

        return NextResponse.json({
            success: true,
            logs,
            pagination: { total, pages, current: page }
        });

    } catch (error) {
        console.error('AuditLog GET error:', error);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const token = req.cookies.get('ssst_token')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const decoded = verifyJwt(token);
        if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { action, resource, details } = body;

        if (!action || !resource || !details) {
            return NextResponse.json({ error: 'Missing log fields' }, { status: 400 });
        }

        const { logAction } = await import('@/lib/logger');

        await connectDB();
        const user = await User.findById(decoded.userId);

        if (!user || (!user.isActive && action !== 'LOGOUT')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await logAction({
            action,
            resource,
            details,
            userOverride: user
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('AuditLog POST error:', error);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}
