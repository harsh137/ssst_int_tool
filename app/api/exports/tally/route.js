import { NextResponse } from 'next/server';
import { verifyJwt } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import User from '@/lib/models/User';
import Donation from '@/lib/models/Donation';
import Expense from '@/lib/models/Expense';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';

async function canExport(req) {
  const token = req.cookies.get('ssst_token')?.value;
  if (!token) return false;
  const decoded = verifyJwt(token);
  if (!decoded) return false;

  await connectDB();
  const user = await User.findById(decoded.userId);
  return user && user.isActive && hasPermission(user, PERMISSIONS.REPORT_EXPORT) ? user : false;
}

// Ensure XML strings are safe
function escapeXml(unsafe) {
  if (!unsafe) return '';
  return unsafe.toString().replace(/[<>&'"]/g, function (c) {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

function generateTallyXML(donations, expenses) {
  let xml = `<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>Vouchers</REPORTNAME>
        <STATICVARIABLES>
          <SVCURRENTCOMPANY>Shri Shyam Sarnam Seva Trust</SVCURRENTCOMPANY>
        </STATICVARIABLES>
      </REQUESTDESC>
      <REQUESTDATA>
`;

  // --- Donations -> Receipt Vouchers ---
  donations.forEach(d => {
    const dateStr = new Date(d.date).toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD

    // Let's assume cash is deposited to "Cash Account", others to "Bank Account"
    const ledgerName = ['Cash', 'Cashier'].includes(d.paymentMode) ? 'Cash' : 'Bank Account';

    xml += `
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <VOUCHER VCHTYPE="Receipt" ACTION="Create">
            <DATE>${dateStr}</DATE>
            <VOUCHERTYPENAME>Receipt</VOUCHERTYPENAME>
            <VOUCHERNUMBER>${escapeXml(d.receiptNumber)}</VOUCHERNUMBER>
            <PARTYLEDGERNAME>${escapeXml(d.donorName)}</PARTYLEDGERNAME>
            <NARRATION>Donation towards ${escapeXml(d.fundType)} Fund. Mobile: ${escapeXml(d.mobile)}. Mode: ${escapeXml(d.paymentMode)}</NARRATION>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>${escapeXml(d.donorName)}</LEDGERNAME>
              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
              <AMOUNT>${d.amount.toFixed(2)}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>${ledgerName}</LEDGERNAME>
              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
              <AMOUNT>-${d.amount.toFixed(2)}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
          </VOUCHER>
        </TALLYMESSAGE>
`;
  });

  // --- Expenses -> Payment Vouchers ---
  expenses.forEach(e => {
    const dateStr = new Date(e.date).toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD
    const ledgerName = ['Cash', 'Cashier'].includes(e.paymentMode) ? 'Cash' : 'Bank Account';

    xml += `
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <VOUCHER VCHTYPE="Payment" ACTION="Create">
            <DATE>${dateStr}</DATE>
            <VOUCHERTYPENAME>Payment</VOUCHERTYPENAME>
            <VOUCHERNUMBER>${escapeXml(e._id.toString().slice(-6).toUpperCase())}</VOUCHERNUMBER>
            <PARTYLEDGERNAME>${ledgerName}</PARTYLEDGERNAME>
            <NARRATION>Expense for ${escapeXml(e.vendor)} (${escapeXml(e.category)}).</NARRATION>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>${escapeXml(e.category)}</LEDGERNAME>
              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
              <AMOUNT>-${e.amount.toFixed(2)}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>${ledgerName}</LEDGERNAME>
              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
              <AMOUNT>${e.amount.toFixed(2)}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
          </VOUCHER>
        </TALLYMESSAGE>
`;
  });

  xml += `      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;

  return xml;
}

export async function GET(req) {
  try {
    const user = await canExport(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized to export data' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const reportType = searchParams.get('type') || 'combined';
    const fromDateStr = searchParams.get('from');
    const toDateStr = searchParams.get('to');
    const fundFilter = searchParams.get('fund');

    await connectDB();

    // 1. Build Queries
    const donQuery = {};
    const expQuery = { status: 'approved' };

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

    // 3. Generate XML String
    const xmlString = generateTallyXML(donationsDocs, expensesDocs);

    // 4. Build Filename
    const d1 = fromDateStr ? fromDateStr : 'All';
    const d2 = toDateStr ? toDateStr : 'All';
    const filename = `SSST_Tally_Import_${reportType}_${d1}_to_${d2}.xml`;

    // 5. Build Response Stream
    const response = new NextResponse(xmlString, {
      status: 200,
      headers: {
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Type': 'application/xml',
      },
    });

    // Log the action
    const { logAction } = await import('@/lib/logger');
    logAction({
      action: 'EXPORT',
      resource: 'Settings',
      details: `Exported ${reportType} data to Tally XML (${fromDateStr || 'Start'} to ${toDateStr || 'End'})`,
      userOverride: user
    }).catch(e => console.error('Failed to log Tally export:', e));

    return response;

  } catch (error) {
    console.error('Tally Export Error:', error);
    return NextResponse.json({ error: 'Failed to generate Tally XML file' }, { status: 500 });
  }
}
