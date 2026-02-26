import { formatINR, formatDate } from '@/lib/data/mockData';

export const generatePDFReceipt = async (donation) => {
    // Dynamically import html2pdf only on the client side
    const html2pdf = (await import('html2pdf.js')).default;

    // 1. Create a container for the PDF
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px'; // Hide off-screen
    container.style.top = '-9999px';
    container.innerHTML = `
        <div id="pdf-content" style="
            width: 800px;
            padding: 40px;
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #333;
            background-color: #fff;
            position: relative;
        ">
            <!-- Header -->
            <div style="text-align: center; border-bottom: 2px solid #FF6B00; padding-bottom: 20px; margin-bottom: 30px;">
                <h1 style="color: #FF6B00; margin: 0; font-size: 28px;">Shri Shyam Sarnam Seva Trust</h1>
                <p style="margin: 5px 0 0; font-size: 14px; color: #666;">
                    Reg. No: S/1234/2026 | New Delhi, India
                </p>
                <p style="margin: 5px 0 0; font-size: 14px; color: #666;">
                    Email: info@shrishyamsarnam.org | Phone: +91 98765 43210
                </p>
            </div>

            <div style="text-align: center; margin-bottom: 30px;">
                <h2 style="margin: 0; font-size: 20px; text-transform: uppercase; letter-spacing: 2px;">Donation Receipt</h2>
            </div>

            <!-- Receipt Info Grid -->
            <div style="display: flex; justify-content: space-between; margin-bottom: 30px; font-size: 14px;">
                <div>
                    <p style="margin: 5px 0;"><strong>Receipt No:</strong> <span style="color: #FF6B00;">${donation.receiptNumber}</span></p>
                    <p style="margin: 5px 0;"><strong>Date:</strong> ${formatDate(donation.date)}</p>
                </div>
                <div style="text-align: right;">
                    <p style="margin: 5px 0;"><strong>Payment Mode:</strong> <span style="text-transform: capitalize;">${donation.paymentMode}</span></p>
                    ${donation.upiRefNo ? `<p style="margin: 5px 0;"><strong>UPI Ref:</strong> ${donation.upiRefNo}</p>` : ''}
                </div>
            </div>

            <!-- Donor Details -->
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                <h3 style="margin: 0 0 15px; font-size: 16px; border-bottom: 1px solid #ddd; padding-bottom: 10px;">Donor Information</h3>
                <table style="width: 100%; font-size: 14px;">
                    <tr>
                        <td style="padding: 5px 0; width: 120px; color: #666;">Name:</td>
                        <td style="padding: 5px 0; font-weight: bold;">${donation.donorName}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px 0; color: #666;">Mobile:</td>
                        <td style="padding: 5px 0;">${donation.mobile}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px 0; color: #666;">Address:</td>
                        <td style="padding: 5px 0;">${donation.address || 'N/A'}</td>
                    </tr>
                </table>
            </div>

            <!-- Donation Details -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px;">
                <thead>
                    <tr style="background-color: #FF6B00; color: white;">
                        <th style="padding: 12px; text-align: left; border: 1px solid #FF6B00;">Description</th>
                        <th style="padding: 12px; text-align: right; border: 1px solid #FF6B00;">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="padding: 12px; border: 1px solid #ddd; text-transform: capitalize;">
                            Donation towards ${donation.fundType} Fund
                            ${donation.notes ? `<br><small style="color: #666;">Note: ${donation.notes}</small>` : ''}
                            ${donation.utsavName ? `<br><small style="color: #666;">Utsav: ${donation.utsavName}</small>` : ''}
                        </td>
                        <td style="padding: 12px; border: 1px solid #ddd; text-align: right; font-weight: bold; font-size: 16px;">
                            ${formatINR(donation.amount)}
                        </td>
                    </tr>
                </tbody>
            </table>

            <!-- Signatures -->
            <div style="display: flex; justify-content: space-between; margin-top: 60px; padding-top: 20px;">
                <div style="text-align: center; width: 200px;">
                    <p style="border-top: 1px solid #333; margin: 0; padding-top: 5px;">Donor's Signature</p>
                </div>
                <div style="text-align: center; width: 200px;">
                    <p style="font-weight: bold; margin: 0 0 5px; color: #FF6B00;">${donation.createdByName || 'Authorized Signatory'}</p>
                    <p style="border-top: 1px solid #333; margin: 0; padding-top: 5px;">Receiver's Signature</p>
                </div>
            </div>

            <!-- Footer -->
            <div style="position: absolute; bottom: 40px; left: 40px; right: 40px; text-align: center; font-size: 12px; border-top: 1px solid #ddd; padding-top: 15px; color: #888;">
                <p style="margin: 0;">This is a computer-generated receipt.</p>
                <p style="margin: 5px 0 0;">Donations to Shri Shyam Sarnam Seva Trust are eligible for tax exemption under section 80G of the Income Tax Act.</p>
            </div>
        </div>
    `;

    document.body.appendChild(container);

    // 2. Configure html2pdf options
    const opt = {
        margin: 0,
        filename: `${donation.receiptNumber}_Receipt.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'px', format: [800, 1130], orientation: 'portrait' }
        // 800x1130 is approx A4 ratio at 96 DPI
    };

    // 3. Generate and Save PDF
    // We use .from() .set() .save() cleanly.
    try {
        await html2pdf().from(container.querySelector('#pdf-content')).set(opt).save();
    } catch (err) {
        console.error('PDF Generation Error:', err);
    } finally {
        // Clean up DOM
        document.body.removeChild(container);
    }
};
