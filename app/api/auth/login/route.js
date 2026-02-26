import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/db/mongodb';
import User from '@/lib/models/User';
import { signJwt } from '@/lib/auth';

export async function POST(req) {
    try {
        const { mobile, password } = await req.json();

        if (!mobile || !password) {
            return NextResponse.json({ error: 'Mobile and password are required' }, { status: 400 });
        }

        await connectDB();

        // Find user and explicitly select password
        const user = await User.findOne({ mobile }).select('+password');

        if (!user || !user.isActive) {
            return NextResponse.json({ error: 'Invalid credentials or inactive account' }, { status: 401 });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // Convert Mongoose doc to lean object and remove password
        const userObj = user.toObject();
        delete userObj.password;

        // Create JWT
        const token = signJwt({ userId: user._id, role: user.role });

        // Create Response
        const response = NextResponse.json({
            success: true,
            user: userObj
        });

        // Set Cookie natively via Next.js response.cookies
        response.cookies.set({
            name: 'ssst_token',
            value: token,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
            path: '/'
        });

        const { logAction } = await import('@/lib/logger');
        await logAction({
            action: 'LOGIN',
            resource: 'Auth',
            details: `User ${user.name} logged in`,
            userOverride: user
        });

        return response;

    } catch (error) {
        console.error('Login Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
