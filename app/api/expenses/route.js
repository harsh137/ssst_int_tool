import { NextResponse } from 'next/server';
import { verifyJwt } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import Expense from '@/lib/models/Expense';
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

export async function GET(req) {
    try {
        const user = await getUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await connectDB();
        const expenses = await Expense.find({}).sort({ date: -1, createdAt: -1 });

        return NextResponse.json({ success: true, expenses });
    } catch (error) {
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const user = await getUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Note: Real RBAC check should happen here (does user have EXPENSE_CREATE?)
        // For now, assuming logged in user can submit.

        const data = await req.json();

        if (!data.category || !data.vendor || !data.amount || !data.date || !data.paymentMode) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        await connectDB();

        const newExpense = new Expense({
            ...data,
            status: 'pending', // strict override
            createdBy: user._id.toString(),
            createdByName: user.name
        });

        await newExpense.save();

        const { logAction } = await import('@/lib/logger');
        await logAction({
            action: 'CREATE',
            resource: 'Expense',
            details: `Submitted expense: ₹${data.amount} for ${data.category} (${data.vendor})`,
            resourceId: newExpense._id,
            userOverride: user
        });

        return NextResponse.json({ success: true, expense: newExpense }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}
