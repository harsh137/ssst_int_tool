import { NextResponse } from 'next/server';
import { verifyJwt } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import User from '@/lib/models/User';
import bcrypt from 'bcryptjs';

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
            return NextResponse.json({ error: 'Super Admin access required' }, { status: 403 });
        }

        await connectDB();
        const users = await User.find({}).select('-password').sort({ createdAt: -1 });

        return NextResponse.json({ success: true, users });
    } catch (error) {
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        if (!(await isSuperAdmin(req))) {
            return NextResponse.json({ error: 'Super Admin access required' }, { status: 403 });
        }

        const data = await req.json();

        // Basic Validation
        if (!data.name || !data.mobile || !data.password || !data.role) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        await connectDB();

        // Check if mobile exists
        const existingUser = await User.findOne({ mobile: data.mobile });
        if (existingUser) {
            return NextResponse.json({ error: 'Mobile number already registered' }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(data.password, 10);

        const newUser = new User({
            name: data.name,
            mobile: data.mobile,
            password: hashedPassword,
            role: data.role,
            permissions: data.permissions || [],
            isActive: true
        });

        await newUser.save();

        const { logAction } = await import('@/lib/logger');
        await logAction({
            action: 'CREATE',
            resource: 'User',
            details: `Created new user: ${data.name} (${data.role})`,
            resourceId: newUser._id,
        });

        const userObj = newUser.toObject();
        delete userObj.password;

        return NextResponse.json({ success: true, user: userObj }, { status: 201 });
    } catch (error) {
        console.error('User Creation Error:', error);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}
