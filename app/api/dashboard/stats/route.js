import { NextResponse } from 'next/server';
import { verifyJwt } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import Donation from '@/lib/models/Donation';
import Expense from '@/lib/models/Expense';
import User from '@/lib/models/User';

export async function GET(req) {
    try {
        const token = req.cookies.get('ssst_token')?.value;
        if (!token || !verifyJwt(token)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        // 1. Calculate Donation Metrics
        const donations = await Donation.find({});
        const totalDonations = donations.reduce((sum, don) => sum + don.amount, 0);

        const fundBreakdown = {
            general: donations.filter(d => d.fundType === 'general').reduce((s, d) => s + d.amount, 0),
            utsav: donations.filter(d => d.fundType === 'utsav').reduce((s, d) => s + d.amount, 0),
        };

        // 2. Calculate Expense Metrics
        const expenses = await Expense.find({});
        const approvedExpenses = expenses.filter(e => e.status === 'approved');
        const pendingExpenses = expenses.filter(e => e.status === 'pending');

        const totalExpenses = approvedExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        const pendingCount = pendingExpenses.length;

        // 3. Recent Activity (Last 6 distinct items for dashboard)
        const recentDonations = await Donation.find({}).sort({ createdAt: -1 }).limit(6);
        const recentExpenses = await Expense.find({}).sort({ createdAt: -1 }).limit(5);

        const summary = {
            totalDonations,
            totalExpenses,
            netBalance: totalDonations - totalExpenses,
            fundBreakdown,
            pendingCount
        };

        return NextResponse.json({
            success: true,
            summary,
            recentDonations,
            recentExpenses
        });

    } catch (error) {
        console.error('Dashboard Stats Error:', error);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}
