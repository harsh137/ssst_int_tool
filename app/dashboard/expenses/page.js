'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import { useLang } from '@/lib/context/LangContext';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { formatINR, formatDate } from '@/lib/data/mockData';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal, { ConfirmModal } from '@/components/ui/Modal';
import { toast } from '@/components/ui/Toast';
import { Eye, Check, X, Trash2, FileText, ExternalLink } from 'lucide-react';

const TABS = [
    { key: 'all', labelEn: 'All', labelHi: 'सभी' },
    { key: 'pending', labelEn: 'Pending', labelHi: 'लंबित' },
    { key: 'approved', labelEn: 'Approved', labelHi: 'स्वीकृत' },
    { key: 'rejected', labelEn: 'Rejected', labelHi: 'अस्वीकृत' },
];

const CAT_LABELS = { tent: 'Tent & Canopy', prasad: 'Prasad & Food', construction: 'Temple Construction', electricity: 'Electricity', decoration: 'Decoration', other: 'Other' };

export default function ExpensesPage() {
    const { currentUser } = useAuth();
    const { t, lang } = useLang();

    const [expenses, setExpenses] = useState([]);
    const [activeTab, setActiveTab] = useState('all');
    const [rejectTarget, setRejectTarget] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [billTarget, setBillTarget] = useState(null); // for bill image viewer

    const [isLoading, setIsLoading] = useState(true);

    const canCreate = hasPermission(currentUser, PERMISSIONS.EXPENSE_CREATE);
    const canApprove = hasPermission(currentUser, PERMISSIONS.EXPENSE_APPROVE);
    const canDelete = hasPermission(currentUser, PERMISSIONS.EXPENSE_DELETE);

    const reload = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/expenses');
            const data = await res.json();
            if (data.success) setExpenses(data.expenses);
        } catch (err) {
            toast.error('Failed to load expenses');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { reload(); }, []);

    const filtered = activeTab === 'all' ? expenses : expenses.filter((e) => e.status === activeTab);

    const handleApprove = async (expense) => {
        try {
            const res = await fetch(`/api/expenses/${expense._id}/action`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'approve' })
            });
            if (res.ok) {
                toast.success(t('approveSuccess'));
                reload();
            } else {
                toast.error('Failed to approve');
            }
        } catch { toast.error('Check your connection'); }
    };

    const handleReject = async () => {
        try {
            const res = await fetch(`/api/expenses/${rejectTarget._id}/action`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'reject', rejectionReason: rejectReason })
            });
            if (res.ok) {
                toast.warning(t('rejectSuccess'));
                setRejectTarget(null); setRejectReason('');
                reload();
            }
        } catch { toast.error('Failed to reject'); }
    };

    const handleDelete = async () => {
        try {
            const res = await fetch(`/api/expenses/${deleteTarget._id}/action`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('Expense deleted.');
                setDeleteTarget(null);
                reload();
            }
        } catch { toast.error('Failed to delete'); }
    };

    const catLabel = (k) => {
        const hiLabels = { tent: 'तंबू', prasad: 'प्रसाद', construction: 'निर्माण', electricity: 'बिजली', decoration: 'सजावट', other: 'अन्य' };
        return lang === 'hi' ? (hiLabels[k] ?? k) : (CAT_LABELS[k] ?? k);
    };
    const payLabel = (p) => ({ cash: lang === 'hi' ? 'नकद' : 'Cash', upi: 'UPI', bankTransfer: lang === 'hi' ? 'बैंक ट्रांसफर' : 'Bank Transfer' }[p] ?? p);

    const counts = {
        pending: expenses.filter((e) => e.status === 'pending').length,
        approved: expenses.filter((e) => e.status === 'approved').length,
        rejected: expenses.filter((e) => e.status === 'rejected').length,
    };

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">{t('expenseList')}</h1>
                    <p className="text-sm text-[var(--text-muted)] mt-0.5">{expenses.length} {lang === 'hi' ? 'रिकॉर्ड' : 'records'}</p>
                </div>
                {canCreate && <Link href="/dashboard/expenses/new"><Button icon={<span>+</span>}>{t('createExpense')}</Button></Link>}
            </div>

            {/* Status Tabs */}
            <div className="flex gap-1 bg-gray-100 rounded-[var(--radius-lg)] p-1 w-fit">
                {TABS.map((tab) => (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                        className={`relative px-4 py-1.5 text-sm font-medium rounded-[var(--radius-md)] transition-all ${activeTab === tab.key ? 'bg-white shadow-sm text-[var(--text-primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}>
                        {lang === 'hi' ? tab.labelHi : tab.labelEn}
                        {tab.key !== 'all' && counts[tab.key] > 0 && (
                            <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full font-semibold ${tab.key === 'pending' ? 'bg-amber-100 text-amber-700' : tab.key === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                                {counts[tab.key]}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white rounded-[var(--radius-lg)] border border-[var(--border)] shadow-[var(--shadow-sm)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-[var(--border)]">
                            <tr>
                                {[t('srNo'), t('category'), t('vendor'), t('amount'), t('paymentMode'), t('date'), t('submittedBy'), t('status'), t('actions')].map((h) => (
                                    <th key={h} className="px-4 py-3 text-xs font-semibold text-[var(--text-muted)] text-left whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                            {filtered.length === 0 ? (
                                <tr><td colSpan={9} className="px-4 py-12 text-center text-sm text-[var(--text-muted)]">{t('noData')}</td></tr>
                            ) : filtered.map((e, i) => (
                                <tr key={e.id} className="hover:bg-gray-50/80 transition-colors">
                                    <td className="px-4 py-3 text-[var(--text-muted)]">{i + 1}</td>
                                    <td className="px-4 py-3 font-medium">{catLabel(e.category)}</td>
                                    <td className="px-4 py-3 text-[var(--text-secondary)]">{e.vendor}</td>
                                    <td className="px-4 py-3 font-bold">{formatINR(e.amount)}</td>
                                    <td className="px-4 py-3"><Badge variant={e.paymentMode}>{payLabel(e.paymentMode)}</Badge></td>
                                    <td className="px-4 py-3 text-[var(--text-muted)] whitespace-nowrap">{formatDate(e.date)}</td>
                                    <td className="px-4 py-3 text-[var(--text-secondary)] text-xs">{e.createdByName}</td>
                                    <td className="px-4 py-3">
                                        <div>
                                            <Badge variant={e.status} showDot>
                                                {lang === 'hi' ? { pending: 'लंबित', approved: 'स्वीकृत', rejected: 'अस्वीकृत' }[e.status] : e.status}
                                            </Badge>
                                            {e.status === 'rejected' && e.rejectionReason && (
                                                <p className="text-xs text-red-500 mt-1 max-w-32 truncate" title={e.rejectionReason}>{e.rejectionReason}</p>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1 flex-wrap">
                                            {/* ── View Bill button ── */}
                                            <button onClick={() => setBillTarget(e)} title={lang === 'hi' ? 'बिल देखें' : 'View Bill'}
                                                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-blue-50 text-blue-500 transition-colors">
                                                <Eye size={15} strokeWidth={2} />
                                            </button>

                                            {canApprove && e.status === 'pending' && (
                                                <>
                                                    <button onClick={() => handleApprove(e)} title="Approve"
                                                        className="flex items-center gap-1 px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-medium rounded-lg transition-colors">
                                                        <Check size={14} strokeWidth={2.5} /> {lang === 'hi' ? 'स्वीकृत' : 'Approve'}
                                                    </button>
                                                    <button onClick={() => { setRejectTarget(e); setRejectReason(''); }} title="Reject"
                                                        className="flex items-center gap-1 px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium rounded-lg transition-colors">
                                                        <X size={14} strokeWidth={2.5} /> {lang === 'hi' ? 'अस्वीकार' : 'Reject'}
                                                    </button>
                                                </>
                                            )}
                                            {canDelete && (
                                                <button onClick={() => setDeleteTarget(e)} title="Delete"
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
            </div>

            {/* ── Bill / Voucher Viewer Modal ── */}
            <Modal isOpen={!!billTarget} onClose={() => setBillTarget(null)}
                title={lang === 'hi' ? 'बिल / वाउचर' : 'Bill / Voucher'}
                size="md">
                {billTarget && (
                    <div>
                        <div className="flex items-center gap-3 mb-4 p-3 rounded-xl"
                            style={{ background: 'linear-gradient(145deg, #F8F7F4, #F0EDE8)' }}>
                            <div>
                                <p className="text-sm font-bold" style={{ color: '#111827' }}>{catLabel(billTarget.category)} — {billTarget.vendor}</p>
                                <p className="text-xs font-semibold" style={{ color: '#6B7280' }}>{formatINR(billTarget.amount)} · {formatDate(billTarget.date)}</p>
                            </div>
                        </div>

                        {billTarget.billImageUrl ? (
                            <div className="text-center">
                                <img src={billTarget.billImageUrl} alt="Bill" className="max-w-full rounded-xl mx-auto"
                                    style={{ maxHeight: '420px', objectFit: 'contain', border: '1.5px solid rgba(0,0,0,0.08)' }} />
                                <a href={billTarget.billImageUrl} target="_blank" rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold"
                                    style={{ color: '#2563EB' }}>
                                    <ExternalLink size={14} strokeWidth={2} /> {lang === 'hi' ? 'नई टैब में खोलें' : 'Open in new tab'}
                                </a>
                            </div>
                        ) : (
                            <div className="text-center py-10 rounded-xl"
                                style={{ background: 'linear-gradient(145deg, #F5F3F0, #EDE9E3)' }}>
                                <div className="flex justify-center mb-3 text-gray-400">
                                    <FileText size={40} strokeWidth={1} />
                                </div>
                                <p className="text-sm font-semibold" style={{ color: '#6B7280' }}>
                                    {lang === 'hi' ? 'कोई बिल अपलोड नहीं किया गया' : 'No bill / voucher uploaded for this expense'}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            {/* Reject Modal */}
            <Modal isOpen={!!rejectTarget} onClose={() => { setRejectTarget(null); setRejectReason(''); }} title={t('rejectExpense')} size="sm">
                <p className="text-sm text-[var(--text-secondary)] mb-3">{rejectTarget?.vendor} — {rejectTarget ? formatINR(rejectTarget.amount) : ''}</p>
                <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3} placeholder={t('rejectionReason')}
                    className="w-full border border-[var(--border)] rounded-[var(--radius-md)] px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-[var(--saffron)] focus:ring-2 focus:ring-[var(--saffron)]/15 mb-4" />
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => { setRejectTarget(null); setRejectReason(''); }} className="flex-1">{t('cancel')}</Button>
                    <Button variant="danger" onClick={handleReject} className="flex-1" disabled={!rejectReason.trim()}>{t('rejectExpense')}</Button>
                </div>
            </Modal>

            {/* Delete Confirm */}
            <ConfirmModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
                title={t('confirmDelete')} message={`${t('deleteWarning')} ${deleteTarget?.vendor}`} confirmText={t('yes')} />
        </div>
    );
}
