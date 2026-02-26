'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { useLang } from '@/lib/context/LangContext';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import Modal, { ConfirmModal } from '@/components/ui/Modal';
import { formatINR, formatDate } from '@/lib/data/mockData';
import Badge from '@/components/ui/Badge';
import { toast } from '@/components/ui/Toast';

const EMPTY_FORM = {
    name: '', nameHi: '', description: '',
    startDate: '', endDate: '', targetAmount: '', isActive: true,
};

export default function UtsavsPage() {
    const { currentUser } = useAuth();
    const { t, lang } = useLang();

    const [utsavs, setUtsavs] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [selected, setSelected] = useState(null);

    const canCreate = hasPermission(currentUser, PERMISSIONS.USER_CREATE);

    const reload = async () => {
        try {
            const res = await fetch('/api/utsavs?all=true');
            const data = await res.json();
            if (data.success) setUtsavs(data.utsavs);
        } catch { toast.error('Failed to load Utsavs'); }
    };

    useEffect(() => { reload(); }, []);

    const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: '' })); };

    const openCreate = () => { setForm(EMPTY_FORM); setEditTarget(null); setErrors({}); setModalOpen(true); };
    const openEdit = (u) => {
        setForm({ name: u.name, nameHi: u.nameHi, description: u.description, startDate: u.startDate, endDate: u.endDate, targetAmount: u.targetAmount, isActive: u.isActive });
        setEditTarget(u); setErrors({}); setModalOpen(true);
    };

    const validate = () => {
        const errs = {};
        if (!form.name.trim()) errs.name = t('required');
        if (!form.startDate) errs.startDate = t('required');
        if (!form.endDate) errs.endDate = t('required');
        if (form.startDate && form.endDate && form.endDate < form.startDate)
            errs.endDate = lang === 'hi' ? 'समाप्ति तिथि प्रारंभ से पहले नहीं हो सकती' : 'End date cannot be before start date';
        if (form.targetAmount && isNaN(Number(form.targetAmount))) errs.targetAmount = t('invalidAmount');
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        setSubmitting(true);
        const payload = {
            ...form, targetAmount: form.targetAmount ? Number(form.targetAmount) : 0,
            createdBy: currentUser?.id, createdByName: currentUser?.name,
        };

        try {
            const url = editTarget ? `/api/utsavs/${editTarget._id}` : '/api/utsavs';
            const method = editTarget ? 'PATCH' : 'POST';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (res.ok && data.success) {
                toast.success(lang === 'hi' ? 'उत्सव सहेजा गया' : 'Utsav saved successfully');
                reload();
                setModalOpen(false);
            } else {
                toast.error(data.error || 'Failed to save');
            }
        } catch {
            toast.error('Network error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        try {
            const res = await fetch(`/api/utsavs/${deleteTarget._id}`, { method: 'DELETE' });
            if (res.ok) {
                if (selected?._id === deleteTarget._id) setSelected(null);
                setDeleteTarget(null);
                reload();
                toast.warning(lang === 'hi' ? 'उत्सव हटाया गया' : 'Utsav deleted');
            }
        } catch { toast.error('Failed to delete'); }
    };

    const handleToggleActive = async (utsav) => {
        try {
            const res = await fetch(`/api/utsavs/${utsav._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !utsav.isActive })
            });
            if (res.ok) {
                reload();
                toast.info(lang === 'hi'
                    ? `उत्सव ${utsav.isActive ? 'निष्क्रिय' : 'सक्रिय'} किया गया`
                    : `Utsav ${utsav.isActive ? 'deactivated' : 'activated'}`);
            }
        } catch { toast.error('Failed to toggle status'); }
    };

    const inputCls = (k) => `clay-input ${errors[k] ? 'error' : ''}`;
    // TODO: Dynamic donation fetching per Utsav could be added, for now use a default 0 array.
    const selectedSummary = selected ? { total: 0, count: 0, donations: [] } : null;

    /* ─── Shared card style ─── */
    const cardStyle = (isSelected) => ({
        background: 'linear-gradient(160deg, #FFFFFF 0%, #F3EDE4 100%)',
        border: isSelected ? '2px solid #FF6B00' : '2px solid rgba(0,0,0,0.10)',
        borderRadius: '20px',
        boxShadow: isSelected
            ? '0 8px 24px rgba(255,107,0,0.18), 0 2px 8px rgba(0,0,0,0.08)'
            : '0 4px 16px rgba(0,0,0,0.09), 0 1px 4px rgba(0,0,0,0.05)',
        padding: '20px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
    });

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between anim-fade-up">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: '#111827' }}>
                        {lang === 'hi' ? 'उत्सव प्रबंधन' : 'Utsav Management'}
                    </h1>
                    <p className="text-sm font-medium mt-0.5" style={{ color: '#4B5563' }}>
                        {lang === 'hi' ? 'सभी उत्सव बनाएँ, प्रबंधित करें और दान ट्रैक करें' : 'Create, manage events and track donations per Utsav'}
                    </p>
                </div>
                {canCreate && (
                    <button onClick={openCreate} className="clay-btn clay-btn-primary">
                        + {lang === 'hi' ? 'नया उत्सव' : 'New Utsav'}
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                {/* ── Utsav Cards ── */}
                <div className="xl:col-span-2 space-y-4">
                    {utsavs.length === 0 && (
                        <div style={cardStyle(false)} className="text-center">
                            <p className="text-4xl mb-3">🛕</p>
                            <p style={{ color: '#6B7280', fontWeight: 500 }}>
                                {lang === 'hi' ? 'कोई उत्सव नहीं मिला' : 'No Utsavs found'}
                            </p>
                        </div>
                    )}

                    {utsavs.map((utsav, i) => {
                        const progress = utsav.targetAmount > 0 ? 0 : 0; // TODO calculate actual progress from summary
                        const isSelected = selected?._id === utsav._id;

                        return (
                            <div
                                key={utsav._id}
                                onClick={() => setSelected(isSelected ? null : utsav)}
                                style={cardStyle(isSelected)}
                                onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                            >
                                {/* Top row */}
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                                        {/* Temple icon */}
                                        <div style={{
                                            width: 48, height: 48, borderRadius: 16, flexShrink: 0,
                                            background: utsav.isActive ? 'linear-gradient(135deg, #FF8534, #FF6B00)' : 'linear-gradient(135deg, #9CA3AF, #6B7280)',
                                            boxShadow: utsav.isActive ? '0 4px 14px rgba(255,107,0,0.40)' : 'none',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                                        }}>🛕</div>

                                        <div style={{ minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>
                                                    {lang === 'hi' && utsav.nameHi ? utsav.nameHi : utsav.name}
                                                </h3>
                                                <Badge variant={utsav.isActive ? 'active' : 'inactive'} showDot>
                                                    {utsav.isActive ? (lang === 'hi' ? 'सक्रिय' : 'Active') : (lang === 'hi' ? 'निष्क्रिय' : 'Inactive')}
                                                </Badge>
                                            </div>
                                            <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginTop: 3 }}>
                                                📅 {formatDate(utsav.startDate)} → {formatDate(utsav.endDate)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Action buttons */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}
                                        onClick={(e) => e.stopPropagation()}>
                                        <button onClick={() => handleToggleActive(utsav)}
                                            className={`clay-btn ${utsav.isActive ? 'clay-btn-secondary' : 'clay-btn-primary'} !text-xs !px-3 !py-1.5 rounded-xl`}>
                                            {utsav.isActive ? (lang === 'hi' ? 'निष्क्रिय करें' : 'Deactivate') : (lang === 'hi' ? 'सक्रिय करें' : 'Activate')}
                                        </button>
                                        {canCreate && (
                                            <>
                                                <button onClick={() => openEdit(utsav)}
                                                    className="clay-btn clay-btn-ghost w-8 h-8 !p-0 rounded-xl"
                                                    style={{ color: '#2563EB' }}>
                                                    <svg width="13" height="13" fill="none" viewBox="0 0 13 13"><path d="M1 12l9-9 2 2-9 9H1v-2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" /></svg>
                                                </button>
                                                <button onClick={() => setDeleteTarget(utsav)}
                                                    className="clay-btn clay-btn-ghost w-8 h-8 !p-0 rounded-xl"
                                                    style={{ color: '#DC2626' }}>
                                                    <svg width="13" height="13" fill="none" viewBox="0 0 13 13"><path d="M2 3h9M5 3V2h3v1M4 3v8h5V3H4z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Divider */}
                                <div style={{ height: 1, background: 'rgba(0,0,0,0.09)', margin: '14px 0' }} />

                                {/* Progress section */}
                                {utsav.targetAmount > 0 && (
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                                            <span style={{ color: '#1F2937', fontWeight: 600 }}>
                                                {lang === 'hi' ? 'संग्रहित' : 'Collected'}:{' '}
                                                <span style={{ color: '#EA580C', fontWeight: 700 }}>{formatINR(summary.total)}</span>
                                            </span>
                                            <span style={{ color: '#1F2937', fontWeight: 600 }}>
                                                {lang === 'hi' ? 'लक्ष्य' : 'Target'}:{' '}
                                                <span style={{ fontWeight: 700 }}>{formatINR(utsav.targetAmount)}</span>
                                            </span>
                                        </div>
                                        {/* Progress bar */}
                                        <div style={{ height: 10, borderRadius: 99, background: '#B8B0A8', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.18)' }}>
                                            <div style={{
                                                width: `${progress}%`, height: '100%', borderRadius: 99,
                                                background: 'linear-gradient(90deg, #FF8534, #FF6B00)',
                                                boxShadow: '0 2px 8px rgba(255,107,0,0.5)',
                                                transition: 'width 0.7s ease',
                                            }} />
                                        </div>
                                        <p style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginTop: 6 }}>
                                            {progress}% · {summary.count} {lang === 'hi' ? 'दानकर्ता' : 'donors'}
                                        </p>
                                    </div>
                                )}

                                {/* Description */}
                                {utsav.description && (
                                    <p style={{ marginTop: 10, fontSize: 13, fontWeight: 500, color: '#374151' }}>
                                        {utsav.description}
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* ── Detail Panel ── */}
                <div className="clay-card p-5">
                    {!selected ? (
                        <div className="text-center py-8">
                            <p className="text-3xl mb-2">👆</p>
                            <p className="text-sm font-medium" style={{ color: '#6B7280' }}>
                                {lang === 'hi' ? 'विवरण देखने के लिए किसी उत्सव पर क्लिक करें' : 'Click an Utsav to see donation details'}
                            </p>
                        </div>
                    ) : (
                        <div>
                            <h3 className="font-bold text-sm mb-1" style={{ color: '#111827' }}>
                                {lang === 'hi' && selected.nameHi ? selected.nameHi : selected.name}
                            </h3>
                            <p className="text-xs font-semibold mb-4" style={{ color: '#6B7280' }}>
                                {lang === 'hi' ? 'उत्सव दान सारांश' : 'Utsav Donation Summary'}
                            </p>

                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <div className="p-3 rounded-2xl text-center"
                                    style={{ background: 'linear-gradient(135deg, #FFF7ED, #FFEDD5)', boxShadow: 'var(--clay-shadow-sm)' }}>
                                    <p className="text-lg font-bold" style={{ color: '#EA580C' }}>{formatINR(selectedSummary?.total ?? 0)}</p>
                                    <p className="text-xs font-semibold" style={{ color: '#9A3412' }}>{lang === 'hi' ? 'कुल दान' : 'Total Donated'}</p>
                                </div>
                                <div className="p-3 rounded-2xl text-center"
                                    style={{ background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)', boxShadow: 'var(--clay-shadow-sm)' }}>
                                    <p className="text-lg font-bold" style={{ color: '#1D4ED8' }}>{selectedSummary?.count ?? 0}</p>
                                    <p className="text-xs font-semibold" style={{ color: '#1E40AF' }}>{lang === 'hi' ? 'दानकर्ता' : 'Donors'}</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                {selectedSummary?.donations.length === 0 && (
                                    <p className="text-xs font-medium text-center py-4" style={{ color: '#6B7280' }}>
                                        {lang === 'hi' ? 'अभी कोई दान नहीं' : 'No donations yet'}
                                    </p>
                                )}
                                {selectedSummary?.donations.map((d) => (
                                    <div key={d.id} className="flex items-center justify-between p-2.5 rounded-xl"
                                        style={{ background: 'linear-gradient(145deg, #FAF7F4, #F5F0EB)', boxShadow: 'var(--clay-shadow-sm)', border: '1px solid rgba(0,0,0,0.07)' }}>
                                        <div>
                                            <p className="text-xs font-semibold" style={{ color: '#111827' }}>{d.donorName}</p>
                                            <p className="text-xs font-medium" style={{ color: '#6B7280' }}>{d.receiptNo}</p>
                                        </div>
                                        <span className="text-sm font-bold" style={{ color: '#EA580C' }}>{formatINR(d.amount)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Create/Edit Modal ── */}
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}
                title={editTarget ? (lang === 'hi' ? 'उत्सव संपादित करें' : 'Edit Utsav') : (lang === 'hi' ? 'नया उत्सव बनाएँ' : 'Create New Utsav')}
                size="md">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold uppercase tracking-wide mb-1.5 block" style={{ color: '#4B5563' }}>
                            {lang === 'hi' ? 'नाम (अंग्रेज़ी)' : 'Name (English)'} *
                        </label>
                        <input value={form.name} onChange={(e) => set('name', e.target.value)}
                            placeholder="e.g. Holi Utsav 2026" className={inputCls('name')} />
                        {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                    </div>
                    <div>
                        <label className="text-xs font-bold uppercase tracking-wide mb-1.5 block" style={{ color: '#4B5563' }}>
                            नाम (हिंदी)
                        </label>
                        <input value={form.nameHi} onChange={(e) => set('nameHi', e.target.value)}
                            placeholder="जैसे: होली उत्सव 2026"
                            className={inputCls('nameHi')}
                            style={{ fontFamily: 'Noto Sans Devanagari, sans-serif' }} />
                    </div>
                    <div>
                        <label className="text-xs font-bold uppercase tracking-wide mb-1.5 block" style={{ color: '#4B5563' }}>
                            {lang === 'hi' ? 'विवरण' : 'Description'}
                        </label>
                        <textarea value={form.description} onChange={(e) => set('description', e.target.value)}
                            rows={2} placeholder={lang === 'hi' ? 'उत्सव का संक्षिप्त विवरण' : 'Brief description of this Utsav'}
                            className={inputCls('description') + ' resize-none'} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-bold uppercase tracking-wide mb-1.5 block" style={{ color: '#4B5563' }}>
                                {lang === 'hi' ? 'प्रारंभ तिथि' : 'Start Date'} *
                            </label>
                            <input type="date" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} className={inputCls('startDate')} />
                            {errors.startDate && <p className="text-xs text-red-500 mt-1">{errors.startDate}</p>}
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase tracking-wide mb-1.5 block" style={{ color: '#4B5563' }}>
                                {lang === 'hi' ? 'समाप्ति तिथि' : 'End Date'} *
                            </label>
                            <input type="date" value={form.endDate} onChange={(e) => set('endDate', e.target.value)} className={inputCls('endDate')} />
                            {errors.endDate && <p className="text-xs text-red-500 mt-1">{errors.endDate}</p>}
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold uppercase tracking-wide mb-1.5 block" style={{ color: '#4B5563' }}>
                            {lang === 'hi' ? 'लक्षित राशि (₹)' : 'Target Amount (₹)'}
                        </label>
                        <input type="number" value={form.targetAmount} onChange={(e) => set('targetAmount', e.target.value)}
                            placeholder="0" min="0" className={inputCls('targetAmount')} />
                        {errors.targetAmount && <p className="text-xs text-red-500 mt-1">{errors.targetAmount}</p>}
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl"
                        style={{ background: 'linear-gradient(145deg, #F0FDF4, #DCFCE7)', border: '1px solid rgba(34,197,94,0.20)' }}>
                        <input type="checkbox" id="isActive" checked={form.isActive} onChange={(e) => set('isActive', e.target.checked)}
                            className="w-4 h-4 rounded accent-[var(--saffron)]" />
                        <label htmlFor="isActive" className="text-sm font-semibold" style={{ color: '#166534' }}>
                            {lang === 'hi' ? 'इस उत्सव के लिए दान स्वीकार करें (सक्रिय)' : 'Accept donations for this Utsav (Active)'}
                        </label>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => setModalOpen(false)} className="clay-btn clay-btn-secondary flex-1">
                            {t('cancel')}
                        </button>
                        <button type="submit" disabled={submitting} className="clay-btn clay-btn-primary flex-1 disabled:opacity-60">
                            {submitting && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full anim-spin" />}
                            {editTarget ? (lang === 'hi' ? 'अपडेट करें' : 'Update') : (lang === 'hi' ? 'बनाएँ' : 'Create')}
                        </button>
                    </div>
                </form>
            </Modal>

            <ConfirmModal
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                title={lang === 'hi' ? 'उत्सव हटाएँ?' : 'Delete Utsav?'}
                message={`${lang === 'hi' ? 'क्या आप सच में इस उत्सव को हटाना चाहते हैं?' : 'Are you sure you want to delete'} "${deleteTarget?.name}"? ${lang === 'hi' ? 'इससे जुड़े दान रिकॉर्ड बने रहेंगे।' : 'Linked donation records will be kept.'}`}
                confirmText={lang === 'hi' ? 'हाँ, हटाएँ' : 'Yes, Delete'}
            />
        </div>
    );
}
