'use client';

import { useState, useEffect } from 'react';
import { useLang } from '@/lib/context/LangContext';
import { useAuth } from '@/lib/context/AuthContext';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { formatINR, formatDate } from '@/lib/data/mockData';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { toast } from '@/components/ui/Toast';
import { generatePDFReceipt } from '@/lib/pdfGenerator';
import { BarChart2, FileSpreadsheet, Folder, FileText } from 'lucide-react';

const REPORT_TYPES = [
    { value: 'donations', labelEn: 'Donations Report', labelHi: 'दान रिपोर्ट' },
    { value: 'expenses', labelEn: 'Expenses Report', labelHi: 'व्यय रिपोर्ट' },
    { value: 'combined', labelEn: 'Combined Report', labelHi: 'संयुक्त रिपोर्ट' },
];
const FUND_OPTS = [
    { value: '', labelEn: 'All Funds', labelHi: 'सभी निधि' },
    { value: 'general', labelEn: 'General', labelHi: 'सामान्य' },
    { value: 'utsav', labelEn: 'Utsav', labelHi: 'उत्सव' },
    { value: 'membership', labelEn: 'Membership', labelHi: 'सदस्यता' },
];

export default function ReportsPage() {
    const { currentUser } = useAuth();
    const { t, lang } = useLang();

    const [reportType, setReportType] = useState('combined');
    const [fundFilter, setFundFilter] = useState('');
    const [fromDate, setFromDate] = useState('2026-02-01');
    const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
    const [generating, setGenerating] = useState(false);
    const [generated, setGenerated] = useState(false);
    const [reportData, setReportData] = useState({ donations: [], expenses: [] });

    const canExport = hasPermission(currentUser, PERMISSIONS.REPORT_EXPORT);

    const generateReport = async () => {
        setGenerating(true);
        try {
            const [donRes, expRes] = await Promise.all([
                fetch('/api/donations'),
                fetch('/api/expenses')
            ]);

            const donData = await donRes.json();
            const expData = await expRes.json();

            const dbDonations = donData.success ? donData.donations : [];
            const dbExpenses = expData.success ? expData.expenses : [];

            const filteredDonations = dbDonations.filter((d) => {
                const dt = d.date.split('T')[0]; // Ensure comparison format matches YYYY-MM-DD
                return dt >= fromDate && dt <= toDate && (!fundFilter || d.fundType === fundFilter);
            });
            const filteredExpenses = dbExpenses.filter((e) => {
                const dt = e.date.split('T')[0];
                return dt >= fromDate && dt <= toDate && e.status === 'approved';
            });

            setReportData({ donations: filteredDonations, expenses: filteredExpenses });
            setGenerated(true);

            // Log that a report was generated
            fetch('/api/logs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'SYSTEM', // or 'REPORT' if we add to enum
                    resource: 'Settings', // using Settings for now as a generic proxy
                    details: `Generated ${reportType} report from ${fromDate} to ${toDate}`
                })
            }).catch(() => { });

        } catch {
            toast.error('Failed to generate report');
        } finally {
            setGenerating(false);
        }
    };

    const handleExport = async (type) => {
        if (type === 'pdf') {
            if (reportData.donations.length === 0) {
                toast.error('No donations to generate PDFs for.');
                return;
            }
            toast.info('Generating PDF Receipts...');
            // Download the first 10 to prevent browser crash
            const slice = reportData.donations.slice(0, 10);
            for (const d of slice) {
                await generatePDFReceipt(d);
            }
            if (reportData.donations.length > 10) toast.info('Only generated first 10 to prevent crash.');
            return;
        }

        const query = new URLSearchParams({
            type: reportType,
            from: fromDate,
            to: toDate
        });
        if (fundFilter && (reportType === 'donations' || reportType === 'combined')) {
            query.append('fund', fundFilter);
        }

        const url = `/api/exports/${type}?${query.toString()}`;

        // Trigger native browser download directly via an invisible link
        const a = document.createElement('a');
        a.href = url;
        a.download = '';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        toast.success(type === 'excel' ? t('excelDownloaded') : t('tallyDownloaded'));
    };

    const totalDonations = reportData.donations.reduce((s, d) => s + d.amount, 0);
    const totalExpenses = reportData.expenses.reduce((s, e) => s + e.amount, 0);
    const netBalance = totalDonations - totalExpenses;

    const selectCls = 'px-3 py-2 text-sm border border-[var(--border)] rounded-[var(--radius-md)] focus:outline-none focus:border-[var(--saffron)] bg-white cursor-pointer';

    return (
        <div className="space-y-5">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-[var(--text-primary)]">{t('reports')}</h1>
                <p className="text-sm text-[var(--text-muted)] mt-0.5">
                    {lang === 'hi' ? 'दिनांक सीमा के अनुसार रिपोर्ट देखें और निर्यात करें' : 'View and export reports by date range'}
                </p>
            </div>

            {/* Filter Panel */}
            <div className="bg-white rounded-[var(--radius-lg)] border border-[var(--border)] p-5 shadow-[var(--shadow-sm)]">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div>
                        <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1.5">{lang === 'hi' ? 'रिपोर्ट प्रकार' : 'Report Type'}</label>
                        <select value={reportType} onChange={(e) => setReportType(e.target.value)} className={selectCls}>
                            {REPORT_TYPES.map((r) => <option key={r.value} value={r.value}>{lang === 'hi' ? r.labelHi : r.labelEn}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1.5">{t('from')}</label>
                        <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className={selectCls + ' w-full'} />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1.5">{t('to')}</label>
                        <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className={selectCls + ' w-full'} />
                    </div>
                    {(reportType === 'donations' || reportType === 'combined') && (
                        <div>
                            <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1.5">{t('filterFund')}</label>
                            <select value={fundFilter} onChange={(e) => setFundFilter(e.target.value)} className={selectCls}>
                                {FUND_OPTS.map((o) => <option key={o.value} value={o.value}>{lang === 'hi' ? o.labelHi : o.labelEn}</option>)}
                            </select>
                        </div>
                    )}
                </div>
                <Button onClick={generateReport} loading={generating} disabled={generating} icon={<BarChart2 size={16} strokeWidth={2} />}>{t('generateReport')}</Button>
            </div>

            {/* Report Result */}
            {generated && (
                <div className="space-y-5 animate-fade-in">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {(reportType === 'donations' || reportType === 'combined') && (
                            <div className="bg-white rounded-[var(--radius-lg)] border border-[var(--border)] p-5 shadow-[var(--shadow-sm)]">
                                <p className="text-xs font-semibold text-[var(--text-muted)] mb-1">{t('totalDonations')}</p>
                                <p className="text-2xl font-bold text-[var(--saffron)]">{formatINR(totalDonations)}</p>
                                <p className="text-xs text-[var(--text-muted)] mt-1">{reportData.donations.length} {lang === 'hi' ? 'लेन-देन' : 'transactions'}</p>
                            </div>
                        )}
                        {(reportType === 'expenses' || reportType === 'combined') && (
                            <div className="bg-white rounded-[var(--radius-lg)] border border-[var(--border)] p-5 shadow-[var(--shadow-sm)]">
                                <p className="text-xs font-semibold text-[var(--text-muted)] mb-1">{t('totalExpenses')}</p>
                                <p className="text-2xl font-bold text-blue-600">{formatINR(totalExpenses)}</p>
                                <p className="text-xs text-[var(--text-muted)] mt-1">{reportData.expenses.length} {lang === 'hi' ? 'लेन-देन' : 'transactions'}</p>
                            </div>
                        )}
                        {reportType === 'combined' && (
                            <div className="bg-white rounded-[var(--radius-lg)] border border-[var(--border)] p-5 shadow-[var(--shadow-sm)]">
                                <p className="text-xs font-semibold text-[var(--text-muted)] mb-1">{t('netBalance')}</p>
                                <p className={`text-2xl font-bold ${netBalance >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{formatINR(netBalance)}</p>
                                <p className="text-xs text-[var(--text-muted)] mt-1">{fromDate} → {toDate}</p>
                            </div>
                        )}
                    </div>

                    {/* Export Buttons */}
                    {canExport && (
                        <div className="bg-white rounded-[var(--radius-lg)] border border-[var(--border)] p-5 shadow-[var(--shadow-sm)]">
                            <p className="text-sm font-semibold text-[var(--text-primary)] mb-3">{lang === 'hi' ? 'रिपोर्ट निर्यात करें' : 'Export Report'}</p>
                            <div className="flex flex-wrap gap-2">
                                <Button onClick={() => handleExport('excel')} variant="secondary" icon={<FileSpreadsheet size={16} strokeWidth={2} />}>{t('exportExcel')}</Button>
                                <Button onClick={() => handleExport('tally')} variant="outline" icon={<Folder size={16} strokeWidth={2} />}>{t('exportTally')}</Button>
                                <Button onClick={() => handleExport('pdf')} variant="secondary" icon={<FileText size={16} strokeWidth={2} />}>{t('exportPdf')}</Button>
                            </div>
                        </div>
                    )}

                    {/* Donations Table */}
                    {(reportType === 'donations' || reportType === 'combined') && reportData.donations.length > 0 && (
                        <div className="bg-white rounded-[var(--radius-lg)] border border-[var(--border)] shadow-[var(--shadow-sm)] overflow-hidden">
                            <div className="px-5 py-3.5 border-b border-[var(--border)] flex items-center justify-between">
                                <h3 className="text-sm font-semibold">{t('donationList')}</h3>
                                <Badge variant="general">{reportData.donations.length}</Badge>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 border-b border-[var(--border)]">
                                        <tr>
                                            {[t('receiptNo'), t('donorName'), t('amount'), t('fundType'), t('paymentMode'), t('date')].map((h) => (
                                                <th key={h} className="px-4 py-2.5 text-xs font-semibold text-[var(--text-muted)] text-left">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--border)]">
                                        {reportData.donations.map((d) => (
                                            <tr key={d._id} className="hover:bg-gray-50">
                                                <td className="px-4 py-2.5 font-mono text-xs text-[var(--saffron)]">{d.receiptNumber || d.receiptNo}</td>
                                                <td className="px-4 py-2.5 font-medium">{d.donorName}</td>
                                                <td className="px-4 py-2.5 font-bold">{formatINR(d.amount)}</td>
                                                <td className="px-4 py-2.5"><Badge variant={d.fundType}>{d.fundType}</Badge></td>
                                                <td className="px-4 py-2.5"><Badge variant={d.paymentMode} >{d.paymentMode}</Badge></td>
                                                <td className="px-4 py-2.5 text-[var(--text-muted)]">{formatDate(d.date)}</td>
                                            </tr>
                                        ))}
                                        <tr className="bg-orange-50 font-bold border-t-2 border-orange-200">
                                            <td colSpan={2} className="px-4 py-2.5 text-right text-[var(--text-secondary)]">{t('total')}:</td>
                                            <td className="px-4 py-2.5 text-[var(--saffron)]">{formatINR(totalDonations)}</td>
                                            <td colSpan={3}></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Expenses Table */}
                    {(reportType === 'expenses' || reportType === 'combined') && reportData.expenses.length > 0 && (
                        <div className="bg-white rounded-[var(--radius-lg)] border border-[var(--border)] shadow-[var(--shadow-sm)] overflow-hidden">
                            <div className="px-5 py-3.5 border-b border-[var(--border)] flex items-center justify-between">
                                <h3 className="text-sm font-semibold">{t('expenseList')}</h3>
                                <Badge variant="approved">{reportData.expenses.length}</Badge>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 border-b border-[var(--border)]">
                                        <tr>
                                            {[t('category'), t('vendor'), t('amount'), t('paymentMode'), t('date')].map((h) => (
                                                <th key={h} className="px-4 py-2.5 text-xs font-semibold text-[var(--text-muted)] text-left">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--border)]">
                                        {reportData.expenses.map((e) => (
                                            <tr key={e._id} className="hover:bg-gray-50">
                                                <td className="px-4 py-2.5 capitalize font-medium">{e.category}</td>
                                                <td className="px-4 py-2.5 text-[var(--text-secondary)]">{e.vendor}</td>
                                                <td className="px-4 py-2.5 font-bold">{formatINR(e.amount)}</td>
                                                <td className="px-4 py-2.5"><Badge variant={e.paymentMode}>{e.paymentMode}</Badge></td>
                                                <td className="px-4 py-2.5 text-[var(--text-muted)]">{formatDate(e.date)}</td>
                                            </tr>
                                        ))}
                                        <tr className="bg-blue-50 font-bold border-t-2 border-blue-200">
                                            <td colSpan={2} className="px-4 py-2.5 text-right text-[var(--text-secondary)]">{t('total')}:</td>
                                            <td className="px-4 py-2.5 text-blue-600">{formatINR(totalExpenses)}</td>
                                            <td colSpan={2}></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
