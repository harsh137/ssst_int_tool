import { NextResponse } from 'next/server';
import { verifyJwt } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import User from '@/lib/models/User';

export async function GET(req) {
    try {
        const token = req.cookies.get('ssst_token')?.value;

        if (!token) {
            return NextResponse.json({ authenticated: false }, { status: 401 });
        }

        const decoded = verifyJwt(token);
        if (!decoded) {
            return NextResponse.json({ authenticated: false }, { status: 401 });
        }

        await connectDB();
        const user = await User.findById(decoded.userId);

        if (!user || !user.isActive) {
            return NextResponse.json({ authenticated: false }, { status: 401 });
        }

        return NextResponse.json({ authenticated: true, user });
    } catch (error) {
        return NextResponse.json({ authenticated: false, error: 'Server Error' }, { status: 500 });
    }
}
