import { NextResponse } from 'next/server';
import { verifyJwt } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import User from '@/lib/models/User';
import Donation from '@/lib/models/Donation';
import Expense from '@/lib/models/Expense';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import * as xlsx from 'xlsx';

async function canExport(req) {
    const token = req.cookies.get('ssst_token')?.value;
    if (!token) return false;
    const decoded = verifyJwt(token);
    if (!decoded) return false;

    await connectDB();
    const user = await User.findById(decoded.userId);

    if (user && user.isActive && hasPermission(user, PERMISSIONS.REPORT_EXPORT)) {
        return user;
    }
    return false;
}

export async function GET(req) {
    try {
        const user = await canExport(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized to export data' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const reportType = searchParams.get('type') || 'combined'; // donations, expenses, combined
        const fromDateStr = searchParams.get('from');
        const toDateStr = searchParams.get('to');
        const fundFilter = searchParams.get('fund');

        await connectDB();

        // 1. Build Queries
        const donQuery = {};
        const expQuery = { status: 'approved' }; // Only export approved expenses

        if (fromDateStr || toDateStr) {
            donQuery.date = {};
            expQuery.date = {};

            if (fromDateStr) {
                const fromDate = new Date(fromDateStr);
                fromDate.setUTCHours(0, 0, 0, 0);
                donQuery.date.$gte = fromDate.toISOString();
                expQuery.date.$gte = fromDate.toISOString();
            }
            if (toDateStr) {
                const toDate = new Date(toDateStr);
                toDate.setUTCHours(23, 59, 59, 999);
                donQuery.date.$lte = toDate.toISOString();
                expQuery.date.$lte = toDate.toISOString();
            }
        }

        if (fundFilter && (reportType === 'donations' || reportType === 'combined')) {
            donQuery.fundType = fundFilter;
        }

        // 2. Fetch Data
        let donationsDocs = [];
        let expensesDocs = [];

        if (reportType === 'donations' || reportType === 'combined') {
            donationsDocs = await Donation.find(donQuery).sort({ date: 1 }).lean();
        }
        if (reportType === 'expenses' || reportType === 'combined') {
            expensesDocs = await Expense.find(expQuery).sort({ date: 1 }).lean();
        }

        // 3. Format Data for Excel
        const wb = xlsx.utils.book_new();

        if (donationsDocs.length > 0) {
            const donData = donationsDocs.map((d, i) => ({
                'S.No': i + 1,
                'Date': new Date(d.date).toLocaleDateString('en-IN'),
                'Receipt No': d.receiptNumber,
                'Donor Name': d.donorName,
                'Mobile': d.mobile || '-',
                'Address': d.address || '-',
                'Amount (₹)': d.amount,
                'Fund Type': d.fundType,
                'Payment Mode': d.paymentMode,
                'Collected By': d.createdByName || '-',
                'Notes': d.notes || '-'
            }));
            const wsDon = xlsx.utils.json_to_sheet(donData);

            // Auto size columns
            const colWidths = [{ wch: 6 }, { wch: 12 }, { wch: 15 }, { wch: 25 }, { wch: 12 }, { wch: 30 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 20 }];
            wsDon['!cols'] = colWidths;

            xlsx.utils.book_append_sheet(wb, wsDon, 'Donations');
        } else if (reportType === 'donations') {
            const wsDon = xlsx.utils.json_to_sheet([{ 'Message': 'No donations found for this period' }]);
            xlsx.utils.book_append_sheet(wb, wsDon, 'Donations');
        }

        if (expensesDocs.length > 0) {
            const expData = expensesDocs.map((e, i) => ({
                'S.No': i + 1,
                'Date': new Date(e.date).toLocaleDateString('en-IN'),
                'Vendor': e.vendor || '-',
                'Category': e.category,
                'Amount (₹)': e.amount,
                'Payment Mode': e.paymentMode,
                'Requested By': e.createdByName || '-',
                'Approved By': e.approvedByName || '-',
                'Notes': e.notes || '-'
            }));
            const wsExp = xlsx.utils.json_to_sheet(expData);

            // Auto size columns
            const colWidths = [{ wch: 6 }, { wch: 12 }, { wch: 25 }, { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 20 }];
            wsExp['!cols'] = colWidths;

            xlsx.utils.book_append_sheet(wb, wsExp, 'Expenses');
        } else if (reportType === 'expenses') {
            const wsExp = xlsx.utils.json_to_sheet([{ 'Message': 'No approved expenses found for this period' }]);
            xlsx.utils.book_append_sheet(wb, wsExp, 'Expenses');
        }

        // If 'combined' and BOTH are empty, generate an empty sheet
        if (reportType === 'combined' && donationsDocs.length === 0 && expensesDocs.length === 0) {
            xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet([{ 'Message': 'No records found' }]), 'Empty');
        }

        // 4. Generate Buffer
        const buf = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

        // 5. Build Filename
        const d1 = fromDateStr ? fromDateStr : 'All';
        const d2 = toDateStr ? toDateStr : 'All';
        const filename = `SSST_${reportType}_${d1}_to_${d2}.xlsx`;

        // 6. Return as downloadable file stream
        const response = new NextResponse(buf, {
            status: 200,
            headers: {
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            },
        });

        // Log the action (asynchronously)
        const { logAction } = await import('@/lib/logger');
        logAction({
            action: 'EXPORT',
            resource: 'Settings', // Generic resource
            details: `Exported ${reportType} data to Excel (${fromDateStr || 'Start'} to ${toDateStr || 'End'})`,
            userOverride: user
        }).catch(e => console.error('Failed to log export:', e));

        return response;

    } catch (error) {
        console.error('Excel Export Error:', error);
        return NextResponse.json({ error: 'Failed to generate Excel file' }, { status: 500 });
    }
}
