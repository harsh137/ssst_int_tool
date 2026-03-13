'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import { useLang } from '@/lib/context/LangContext';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { formatINR, formatDate } from '@/lib/data/mockData';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { ConfirmModal } from '@/components/ui/Modal';
import { toast } from '@/components/ui/Toast';
import ReceiptModal from '@/components/donations/ReceiptModal';
import { generatePDFReceipt } from '@/lib/pdfGenerator';
import { Download, Pencil, Trash2 } from 'lucide-react';

const FUND_OPTIONS = [
    { value: 'general', label: 'General', labelHi: 'सामान्य' },
    { value: 'utsav', label: 'Utsav', labelHi: 'उत्सव' },
    { value: 'membership', label: 'Membership', labelHi: 'सदस्यता' },
];
const PAYMENT_OPTIONS = [
    { value: 'cash', label: 'Cash', labelHi: 'नकद' },
    { value: 'upi', label: 'UPI', labelHi: 'UPI' },
    { value: 'bankTransfer', label: 'Bank Transfer', labelHi: 'बैंक ट्रांसफर' },
];

export default function DonationsPage() {
    const { currentUser } = useAuth();
    const { t, lang } = useLang();

    const [donations, setDonations] = useState([]);
    const [search, setSearch] = useState('');
    const [fundFilter, setFundFilter] = useState('');
    const [payFilter, setPayFilter] = useState('');
    const [receipt, setReceipt] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [page, setPage] = useState(1);
    const PER_PAGE = 10;
    const [isLoading, setIsLoading] = useState(true);

    const canCreate = hasPermission(currentUser, PERMISSIONS.DONATION_CREATE);
    const canEdit = hasPermission(currentUser, PERMISSIONS.DONATION_EDIT);
    const canDelete = hasPermission(currentUser, PERMISSIONS.DONATION_DELETE);

    const reload = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/donations');
            const data = await res.json();
            if (data.success) setDonations(data.donations);
        } catch {
            toast.error('Failed to load donations');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { reload(); }, []);

    const filtered = donations.filter((d) => {
        const s = search.toLowerCase();
        const matchSearch = !search || d.donorName.toLowerCase().includes(s) || d.mobile.includes(s) || d.receiptNumber.toLowerCase().includes(s);
        const matchFund = !fundFilter || d.fundType === fundFilter;
        const matchPay = !payFilter || d.paymentMode === payFilter;
        return matchSearch && matchFund && matchPay;
    });

    const total = filtered.length;
    const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
    const totalPages = Math.ceil(total / PER_PAGE);

    const handleDelete = async () => {
        try {
            const res = await fetch(`/api/donations/${deleteTarget._id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('Donation record deleted.');
                setDeleteTarget(null);
                reload();
            } else {
                toast.error('Failed to delete');
            }
        } catch {
            toast.error('Network Error');
        }
    };

    const fundLabel = (f) => ({ general: lang === 'hi' ? 'सामान्य' : 'General', utsav: lang === 'hi' ? 'उत्सव' : 'Utsav', membership: lang === 'hi' ? 'सदस्यता' : 'Membership' }[f] ?? f);
    const payLabel = (p) => ({ cash: lang === 'hi' ? 'नकद' : 'Cash', upi: 'UPI', bankTransfer: lang === 'hi' ? 'बैंक ट्रांसफर' : 'Bank Transfer' }[p] ?? p);

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">{t('donationList')}</h1>
                    <p className="text-sm text-[var(--text-muted)] mt-0.5">{total} {lang === 'hi' ? 'रिकॉर्ड' : 'records'}</p>
                </div>
                {canCreate && (
                    <Link href="/dashboard/donations/new">
                        <Button icon={<span className="text-base font-bold">+</span>}>{t('newDonation')}</Button>
                    </Link>
                )}
            </div>

            {/* Filters */}
            <div className="bg-white rounded-[var(--radius-lg)] border border-[var(--border)] p-4 shadow-[var(--shadow-sm)]">
                <div className="flex flex-col sm:flex-row gap-3">
                    {/* Search */}
                    <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]">
                            <svg width="14" height="14" fill="none" viewBox="0 0 14 14">
                                <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5" />
                                <path d="M9.5 9.5L13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                        </span>
                        <input
                            type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            placeholder={t('searchDonor')}
                            className="w-full pl-8 pr-3 py-2 text-sm border border-[var(--border)] rounded-[var(--radius-md)] focus:outline-none focus:border-[var(--saffron)] focus:ring-2 focus:ring-[var(--saffron)]/15 transition-all"
                        />
                    </div>
                    {/* Fund filter */}
                    <select value={fundFilter} onChange={(e) => { setFundFilter(e.target.value); setPage(1); }}
                        className="px-3 py-2 text-sm border border-[var(--border)] rounded-[var(--radius-md)] focus:outline-none focus:border-[var(--saffron)] bg-white cursor-pointer">
                        <option value="">{t('allFunds')}</option>
                        {FUND_OPTIONS.map((o) => <option key={o.value} value={o.value}>{lang === 'hi' ? o.labelHi : o.label}</option>)}
                    </select>
                    {/* Payment filter */}
                    <select value={payFilter} onChange={(e) => { setPayFilter(e.target.value); setPage(1); }}
                        className="px-3 py-2 text-sm border border-[var(--border)] rounded-[var(--radius-md)] focus:outline-none focus:border-[var(--saffron)] bg-white cursor-pointer">
                        <option value="">{t('allPayments')}</option>
                        {PAYMENT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{lang === 'hi' ? o.labelHi : o.label}</option>)}
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-[var(--radius-lg)] border border-[var(--border)] shadow-[var(--shadow-sm)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-[var(--border)]">
                            <tr>
                                {[t('srNo'), t('receiptNo'), t('donorName'), t('mobile'), t('amount'), t('fundType'), t('paymentMode'), t('date'), t('collectedBy') || 'Collected By', t('actions')].map((h) => (
                                    <th key={h} className="px-4 py-3 text-xs font-semibold text-[var(--text-muted)] text-left whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                            {paginated.length === 0 ? (
                                <tr><td colSpan={9} className="px-4 py-12 text-center text-sm text-[var(--text-muted)]">{t('noData')}</td></tr>
                            ) : paginated.map((d, i) => (
                                <tr key={d._id} className="hover:bg-orange-50/30 transition-colors">
                                    <td className="px-4 py-3 text-[var(--text-muted)]">{(page - 1) * PER_PAGE + i + 1}</td>
                                    <td className="px-4 py-3 font-mono text-xs font-medium text-[var(--saffron)]">{d.receiptNumber}</td>
                                    <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{d.donorName}</td>
                                    <td className="px-4 py-3 text-[var(--text-secondary)]">{d.mobile}</td>
                                    <td className="px-4 py-3 font-bold text-[var(--text-primary)]">{formatINR(d.amount)}</td>
                                    <td className="px-4 py-3"><Badge variant={d.fundType}>{fundLabel(d.fundType)}</Badge></td>
                                    <td className="px-4 py-3"><Badge variant={d.paymentMode}>{payLabel(d.paymentMode)}</Badge></td>
                                    <td className="px-4 py-3 text-[var(--text-muted)] whitespace-nowrap">{formatDate(d.date)}</td>
                                    <td className="px-4 py-3 text-[var(--text-secondary)] whitespace-nowrap">{d.createdByName || '-'}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1">
                                            <button onClick={async () => {
                                                toast.info('Generating PDF...');
                                                await generatePDFReceipt(d);
                                            }} title="Download Receipt"
                                                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-orange-100 text-[var(--saffron)] transition-colors text-sm">
                                                <Download size={15} strokeWidth={2} />
                                            </button>
                                            {canEdit && (
                                                <Link href={`/dashboard/donations/${d._id}/edit`}>
                                                    <button title="Edit" className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-blue-50 text-blue-500 transition-colors">
                                                        <Pencil size={14} strokeWidth={2} />
                                                    </button>
                                                </Link>
                                            )}
                                            {canDelete && (
                                                <button onClick={() => setDeleteTarget(d)} title="Delete"
                                                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-red-500 transition-colors">
                                                    <Trash2 size={15} strokeWidth={2} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border)] bg-gray-50">
                        <p className="text-xs text-[var(--text-muted)]">
                            {lang === 'hi' ? `${total} में से ${(page - 1) * PER_PAGE + 1}–${Math.min(page * PER_PAGE, total)} दिखाए जा रहे हैं` : `Showing ${(page - 1) * PER_PAGE + 1}–${Math.min(page * PER_PAGE, total)} of ${total}`}
                        </p>
                        <div className="flex gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                                <button key={p} onClick={() => setPage(p)}
                                    className={`w-7 h-7 text-xs rounded-lg transition-colors ${p === page ? 'text-white font-semibold' : 'text-[var(--text-secondary)] hover:bg-gray-200'}`}
                                    style={p === page ? { background: 'var(--saffron)' } : {}}>
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Receipt Modal */}
            <ReceiptModal donation={receipt} onClose={() => setReceipt(null)} />

            {/* Delete Confirm */}
            <ConfirmModal
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                title={t('confirmDelete')}
                message={`${t('deleteWarning')} ${deleteTarget?.receiptNumber} — ${deleteTarget?.donorName}`}
                confirmText={t('yes')}
            />
        </div>
    );
}
