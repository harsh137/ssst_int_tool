'use client';

import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';
import { useLang } from '@/lib/context/LangContext';

// Helper functions inline to avoid mockData dependency
const formatINR = (amount) => {
    if (amount === undefined || amount === null) return '₹0';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);
};
const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
        return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return dateStr; }
};

export default function ReceiptModal({ donation, onClose }) {
    const { t, lang } = useLang();

    if (!donation) return null;

    // backend uses 'receiptNumber', legacy mock data used 'receiptNo' — support both
    const receiptNo = donation.receiptNumber || donation.receiptNo || '—';

    const fundLabel = {
        general: lang === 'hi' ? 'सामान्य' : 'General',
        utsav: lang === 'hi' ? 'उत्सव' : 'Utsav',
        membership: lang === 'hi' ? 'सदस्यता' : 'Membership'
    };
    const payLabel = {
        cash: lang === 'hi' ? 'नकद' : 'Cash',
        upi: 'UPI',
        bankTransfer: lang === 'hi' ? 'बैंक ट्रांसफर' : 'Bank Transfer'
    };

    const handlePrint = () => {
        // Create a new print window with just the receipt content
        const printWin = window.open('', '_blank', 'width=600,height=800');
        const content = document.getElementById('ssst-receipt-content').innerHTML;

        printWin.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Donation Receipt - ${receiptNo}</title>
                <link rel="preconnect" href="https://fonts.googleapis.com">
                <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Noto+Sans+Devanagari:wght@400;600;700&display=swap" rel="stylesheet">
                <style>
                    * { box-sizing: border-box; margin: 0; padding: 0; }
                    body {
                        font-family: 'Plus Jakarta Sans', sans-serif;
                        background: white;
                        padding: 32px;
                        color: #1F2937;
                    }
                    .receipt-wrapper {
                        max-width: 480px;
                        margin: 0 auto;
                        border: 2px dashed #FED7AA;
                        border-radius: 16px;
                        padding: 28px;
                        background: #FFFBF5;
                    }
                    .trust-header { text-align: center; border-bottom: 1px solid #FED7AA; padding-bottom: 16px; margin-bottom: 20px; }
                    .trust-icon { font-size: 36px; line-height: 1; margin-bottom: 8px; }
                    .trust-name-hi { font-family: 'Noto Sans Devanagari', sans-serif; font-size: 18px; font-weight: 700; color: #111827; }
                    .trust-name-en { font-size: 13px; color: #6B7280; margin-top: 2px; }
                    .tagline { font-size: 11px; color: #9CA3AF; margin-top: 4px; }
                    .receipt-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
                    .label { font-size: 10px; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.05em; }
                    .value { font-size: 13px; font-weight: 600; color: #111827; margin-top: 2px; }
                    .value.accent { color: #FF6B00; font-family: monospace; }
                    .detail-row { display: flex; align-items: flex-start; gap: 8px; margin-bottom: 10px; }
                    .detail-label { font-size: 11px; color: #9CA3AF; width: 110px; flex-shrink: 0; padding-top: 1px; }
                    .detail-value { font-size: 13px; font-weight: 500; color: #1F2937; }
                    .amount-box {
                        margin-top: 16px;
                        padding: 14px;
                        border-radius: 12px;
                        background: linear-gradient(135deg, #FF6B00, #F5A623);
                        text-align: center;
                    }
                    .amount-label { font-size: 11px; color: rgba(255,255,255,0.8); }
                    .amount-value { font-size: 28px; font-weight: 800; color: white; margin-top: 2px; }
                    .footer { margin-top: 16px; padding-top: 12px; border-top: 1px solid #FED7AA; text-align: center; }
                    .footer p { font-size: 11px; color: #9CA3AF; margin-top: 4px; }
                    @media print {
                        body { padding: 0; }
                    }
                </style>
            </head>
            <body>
                <div class="receipt-wrapper">
                    <div class="trust-header">
                        <div class="trust-icon">🛕</div>
                        <div class="trust-name-hi">श्री श्याम शरणम् सेवा ट्रस्ट</div>
                        <div class="trust-name-en">Shri Shyam Sarnam Seva Trust</div>
                        <div class="tagline">🙏 Jai Shri Shyam</div>
                    </div>

                    <div class="receipt-row">
                        <div>
                            <div class="label">Receipt No.</div>
                            <div class="value accent">${receiptNo}</div>
                        </div>
                        <div style="text-align:right">
                            <div class="label">Date</div>
                            <div class="value">${formatDate(donation.date)}</div>
                        </div>
                    </div>

                    <div class="detail-row">
                        <span class="detail-label">Donor Name:</span>
                        <span class="detail-value">${donation.donorName || '—'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Mobile:</span>
                        <span class="detail-value">${donation.mobile || '—'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Address:</span>
                        <span class="detail-value">${donation.address || '—'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Fund Type:</span>
                        <span class="detail-value">${fundLabel[donation.fundType] || donation.fundType || '—'}</span>
                    </div>
                    ${donation.utsavName ? `<div class="detail-row"><span class="detail-label">Utsav:</span><span class="detail-value">${donation.utsavName}</span></div>` : ''}
                    <div class="detail-row">
                        <span class="detail-label">Payment Mode:</span>
                        <span class="detail-value">${payLabel[donation.paymentMode] || donation.paymentMode || '—'}</span>
                    </div>
                    ${donation.upiRefNo ? `<div class="detail-row"><span class="detail-label">UPI Ref No:</span><span class="detail-value">${donation.upiRefNo}</span></div>` : ''}

                    <div class="amount-box">
                        <div class="amount-label">Donation Amount</div>
                        <div class="amount-value">${formatINR(donation.amount)}</div>
                    </div>

                    ${donation.notes ? `<p style="margin-top:12px; font-size:11px; color:#9CA3AF; text-align:center">${donation.notes}</p>` : ''}

                    <div class="footer">
                        <p>Thank you for your generous donation 🙏</p>
                        <p>This receipt is a valid proof of donation.</p>
                    </div>
                </div>
                <script>
                    window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; };
                </script>
            </body>
            </html>
        `);
        printWin.document.close();
    };

    const handleWhatsApp = () => {
        const msg = encodeURIComponent(
            `🙏 Jai Shri Shyam!\n\nDear ${donation.donorName},\n\nThank you for your generous donation to *Shri Shyam Sarnam Seva Trust*.\n\n📄 Receipt No: *${receiptNo}*\n💰 Amount: *${formatINR(donation.amount)}*\n📅 Date: *${formatDate(donation.date)}*\n🏦 Payment: *${payLabel[donation.paymentMode] || donation.paymentMode}*\n\nJai Shri Shyam 🙏`
        );
        const mobile = donation.mobile ? `91${donation.mobile}` : '';
        window.open(`https://wa.me/${mobile}?text=${msg}`, '_blank');
    };

    return (
        <Modal isOpen={!!donation} onClose={onClose} title={t('viewReceipt')} size="md">
            {/* Hidden source for content (for reference) */}
            <div id="ssst-receipt-content" style={{ display: 'none' }} />

            {/* Receipt Preview */}
            <div className="border-2 border-dashed border-orange-200 rounded-[var(--radius-lg)] p-6 mb-4 bg-orange-50/30">
                {/* Trust Header */}
                <div className="text-center mb-5 pb-4 border-b border-orange-200">
                    <div className="w-14 h-14 mx-auto mb-2 rounded-full flex items-center justify-center text-2xl"
                        style={{ background: 'linear-gradient(135deg, var(--saffron), var(--gold))' }}>
                        🛕
                    </div>
                    <h2 className="font-bold text-[var(--text-primary)] text-lg" style={{ fontFamily: 'Noto Sans Devanagari, sans-serif' }}>
                        श्री श्याम शरणम् सेवा ट्रस्ट
                    </h2>
                    <p className="text-sm text-[var(--text-secondary)]">Shri Shyam Sarnam Seva Trust</p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">🙏 Jai Shri Shyam</p>
                </div>

                {/* Receipt Header Row */}
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <p className="text-xs text-[var(--text-muted)]">{t('receiptNo')}</p>
                        <p className="font-bold text-[var(--saffron)] font-mono text-sm">{receiptNo}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-[var(--text-muted)]">{t('date')}</p>
                        <p className="font-semibold text-sm">{formatDate(donation.date)}</p>
                    </div>
                </div>

                {/* Donor Details */}
                <div className="space-y-2.5">
                    {[
                        { label: t('donorName'), value: donation.donorName },
                        { label: t('mobileNumber'), value: donation.mobile },
                        { label: t('address'), value: donation.address },
                        { label: t('fundType'), value: fundLabel[donation.fundType] ?? donation.fundType },
                        donation.utsavName && { label: lang === 'hi' ? 'उत्सव' : 'Utsav', value: donation.utsavName },
                        { label: t('paymentMode'), value: payLabel[donation.paymentMode] ?? donation.paymentMode },
                        donation.upiRefNo && { label: 'UPI Ref No.', value: donation.upiRefNo },
                    ].filter(Boolean).map(({ label, value }) => (
                        <div key={label} className="flex items-start gap-2">
                            <span className="text-xs text-[var(--text-muted)] w-32 flex-shrink-0">{label}:</span>
                            <span className="text-sm text-[var(--text-primary)] font-medium">{value || '—'}</span>
                        </div>
                    ))}
                </div>

                {/* Amount */}
                <div className="mt-4 p-3 rounded-xl text-center" style={{ background: 'linear-gradient(135deg, var(--saffron), var(--gold))' }}>
                    <p className="text-white/80 text-xs mb-0.5">{t('amount')}</p>
                    <p className="text-white text-2xl font-bold">{formatINR(donation.amount)}</p>
                </div>

                {donation.notes && (
                    <p className="mt-3 text-xs text-[var(--text-muted)] text-center">{donation.notes}</p>
                )}

                {/* Footer */}
                <div className="mt-4 pt-3 border-t border-orange-200 text-center">
                    <p className="text-xs text-[var(--text-muted)]">
                        {lang === 'hi' ? 'आपके दान के लिए हार्दिक धन्यवाद 🙏' : 'Thank you for your generous donation 🙏'}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                        {lang === 'hi' ? 'यह रसीद वैध प्रमाण है।' : 'This receipt is a valid proof of donation.'}
                    </p>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 flex-col sm:flex-row">
                <Button onClick={handlePrint} variant="primary" fullWidth icon={<span>🖨️</span>}>{t('downloadReceipt')}</Button>
                <Button onClick={handleWhatsApp} variant="success" fullWidth icon={<span>💬</span>}>{t('sendWhatsApp')}</Button>
            </div>
        </Modal>
    );
}
