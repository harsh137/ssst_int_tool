'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { useLang } from '@/lib/context/LangContext';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { toast } from '@/components/ui/Toast';
import ReceiptModal from '@/components/donations/ReceiptModal';
import { Check, Landmark, AlertTriangle, Paperclip, Info } from 'lucide-react';

const STEPS = ['donorInfo', 'paymentInfo', 'review'];
const FUND_OPTS = [
    { value: 'general', label: 'General', labelHi: 'सामान्य' },
    { value: 'utsav', label: 'Utsav', labelHi: 'उत्सव' },
];
const PAY_OPTS = [
    { value: 'cash', label: 'Cash', labelHi: 'नकद' },
    { value: 'upi', label: 'UPI', labelHi: 'UPI' },
    { value: 'bankTransfer', label: 'Bank Transfer', labelHi: 'बैंक ट्रांसफर' },
];

export default function NewDonationPage() {
    const { currentUser } = useAuth();
    const { t, lang } = useLang();
    const router = useRouter();

    const [step, setStep] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [receipt, setReceipt] = useState(null);
    const [errors, setErrors] = useState({});

    const [upiUploading, setUpiUploading] = useState(false);
    const [upiPreview, setUpiPreview] = useState(null);

    const [form, setForm] = useState({
        donorName: '', mobile: '', address: '', amount: '', fundType: 'general',
        utsavId: '', utsavName: '',
        paymentMode: 'cash', upiRefNo: '', upiScreenshotUrl: '',
        date: new Date().toISOString().split('T')[0], notes: '',
        createdBy: currentUser?.id, createdByName: currentUser?.name,
    });

    const [settings, setSettings] = useState({});
    const [activeUtsavs, setActiveUtsavs] = useState([]);

    useEffect(() => {
        async function fetchInitialData() {
            try {
                const [settingsRes, utsavsRes] = await Promise.all([
                    fetch('/api/settings'),
                    fetch('/api/utsavs') // GET only active by default
                ]);

                const sData = await settingsRes.json();
                const uData = await utsavsRes.json();

                if (sData.success) setSettings(sData.settings);
                if (uData.success) setActiveUtsavs(uData.utsavs);
            } catch (err) {
                console.error('Failed to load initial data', err);
            }
        }
        fetchInitialData();
    }, []);

    const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: '' })); };

    const handleFundType = (val) => {
        set('fundType', val);
        if (val !== 'utsav') { set('utsavId', ''); set('utsavName', ''); }
    };

    const handleUtsavSelect = (utsav) => {
        setForm((f) => ({ ...f, utsavId: utsav._id, utsavName: utsav.name }));
        setErrors((e) => ({ ...e, utsavId: '' }));
    };

    const handleUpiScreenshot = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUpiUploading(true);
        // show temp preview
        setUpiPreview(URL.createObjectURL(file));

        try {
            const { url } = await uploadToCloudinary(file, 'ssst/upi_screenshots');
            set('upiScreenshotUrl', url);
        } catch (err) {
            toast.error(lang === 'hi' ? 'स्क्रीनशॉट अपलोड विफल रहा' : 'Screenshot upload failed');
            setUpiPreview(null);
        } finally {
            setUpiUploading(false);
        }
    };

    const validate = (s) => {
        const errs = {};
        if (s === 0) {
            if (!form.donorName.trim()) errs.donorName = t('required');
            if (!/^\d{10}$/.test(form.mobile)) errs.mobile = t('invalidMobile');
            if (!form.address.trim()) errs.address = t('required');
        }
        if (s === 1) {
            if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0) errs.amount = t('invalidAmount');
            if (!form.fundType) errs.fundType = t('required');
            if (form.fundType === 'utsav' && !form.utsavId) errs.utsavId = t('required');
            if (!form.paymentMode) errs.paymentMode = t('required');
            if (!form.date) errs.date = t('required');
            if (form.paymentMode === 'upi') {
                if (!form.upiRefNo.trim()) errs.upiRefNo = t('required');
            }
        }
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const next = () => { if (validate(step)) setStep((s) => s + 1); };
    const back = () => setStep((s) => s - 1);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (upiUploading) {
            toast.warning(lang === 'hi' ? 'कृपया छवि अपलोड पूरी होने दें' : 'Please wait for upload to finish');
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch('/api/donations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, amount: Number(form.amount) })
            });
            const data = await res.json();

            if (res.ok && data.success) {
                toast.success(t('donationSuccess'));
                // TODO: WA link generation
                router.push('/dashboard/donations');
            } else {
                toast.error(data.error || 'Failed to submit donation');
            }
        } catch {
            toast.error('Network Error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleReceiptClose = () => {
        setReceipt(null);
        router.push('/dashboard/donations');
    };

    const labelOf = (opts) => opts.map((o) => ({ ...o, display: lang === 'hi' ? o.labelHi : o.label }));
    const ic = (k) => `clay-input ${errors[k] ? 'error' : ''}`;

    return (
        <div className="max-w-xl mx-auto">
            {/* Header */}
            <div className="mb-6 anim-fade-up">
                <button onClick={() => router.back()}
                    className="flex items-center gap-1.5 text-sm mb-3 transition-colors hover:opacity-70"
                    style={{ color: '#1F2937' }}>
                    <svg width="14" height="14" fill="none" viewBox="0 0 14 14"><path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    {t('back')}
                </button>
                <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{t('createDonation')}</h1>
            </div>

            {/* Stepper */}
            <div className="flex items-center gap-2 mb-7">
                {STEPS.map((sk, i) => (
                    <div key={sk} className="flex items-center gap-2 flex-1">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all"
                            style={{ background: i <= step ? 'linear-gradient(135deg, var(--saffron), var(--gold))' : 'linear-gradient(145deg, #E5E0D8, #EDE8E2)', color: i <= step ? 'white' : 'var(--text-muted)', boxShadow: i <= step ? '0 3px 10px rgba(255,107,0,0.35)' : 'var(--clay-shadow-sm)' }}>
                            {i < step ? <Check size={14} strokeWidth={3} /> : i + 1}
                        </div>
                        <span className="text-xs font-semibold whitespace-nowrap" style={{ color: i === step ? 'var(--saffron)' : 'var(--text-muted)' }}>{t(sk)}</span>
                        {i < STEPS.length - 1 && (
                            <div className="h-0.5 flex-1 mx-1 rounded-full transition-all"
                                style={{ background: i < step ? 'linear-gradient(90deg, var(--saffron), var(--gold))' : 'rgba(0,0,0,0.08)' }} />
                        )}
                    </div>
                ))}
            </div>

            {/* Card */}
            <div className="clay-card-lg p-6 anim-scale-in">

                {/* ── Step 0: Donor Info ── */}
                {step === 0 && (
                    <div className="space-y-4">
                        <h2 className="text-sm font-bold pb-2 border-b" style={{ color: 'var(--text-primary)', borderColor: 'rgba(0,0,0,0.05)' }}>{t('donorInfo')}</h2>
                        <div>
                            <label className="text-xs font-bold uppercase tracking-wide mb-1.5 block" style={{ color: '#1F2937' }}>{t('donorName')} *</label>
                            <input value={form.donorName} onChange={(e) => set('donorName', e.target.value)}
                                placeholder={lang === 'hi' ? 'दानकर्ता का नाम' : 'Full Name'} className={ic('donorName')} />
                            {errors.donorName && <p className="text-xs text-red-500 mt-1">{errors.donorName}</p>}
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase tracking-wide mb-1.5 block" style={{ color: '#1F2937' }}>{t('mobileNumber')} *</label>
                            <input type="tel" value={form.mobile}
                                onChange={(e) => set('mobile', e.target.value.replace(/\D/, '').slice(0, 10))}
                                placeholder="10-digit mobile" maxLength={10} className={ic('mobile')} />
                            {errors.mobile && <p className="text-xs text-red-500 mt-1">{errors.mobile}</p>}
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase tracking-wide mb-1.5 block" style={{ color: '#1F2937' }}>{t('address')} *</label>
                            <textarea value={form.address} onChange={(e) => set('address', e.target.value)}
                                rows={3} placeholder={lang === 'hi' ? 'पूरा पता' : 'Full address'}
                                className={ic('address') + ' resize-none'} />
                            {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
                        </div>
                    </div>
                )}

                {/* ── Step 1: Payment Info ── */}
                {step === 1 && (
                    <div className="space-y-4">
                        <h2 className="text-sm font-bold pb-2 border-b" style={{ color: 'var(--text-primary)', borderColor: 'rgba(0,0,0,0.05)' }}>{t('paymentInfo')}</h2>

                        {/* Amount */}
                        <div>
                            <label className="text-xs font-bold uppercase tracking-wide mb-1.5 block" style={{ color: '#1F2937' }}>{t('amount')} (₹) *</label>
                            <input type="number" value={form.amount}
                                onChange={(e) => set('amount', e.target.value)}
                                placeholder="0" min="1" className={ic('amount')} />
                            {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
                        </div>

                        {/* Fund Type */}
                        <div>
                            <label className="text-xs font-bold uppercase tracking-wide mb-2 block" style={{ color: '#1F2937' }}>{t('fundType')} *</label>
                            <div className="flex gap-2">
                                {labelOf(FUND_OPTS).map((o) => (
                                    <button key={o.value} type="button" onClick={() => handleFundType(o.value)}
                                        className="flex-1 py-2.5 text-xs font-bold rounded-2xl transition-all"
                                        style={{
                                            background: form.fundType === o.value ? 'linear-gradient(135deg, var(--saffron), var(--gold))' : 'linear-gradient(145deg, #FAF7F4, #F0EDE8)',
                                            color: form.fundType === o.value ? 'white' : 'var(--text-secondary)',
                                            boxShadow: form.fundType === o.value ? 'var(--clay-shadow-saffron)' : 'var(--clay-shadow-sm)',
                                            border: '1px solid rgba(255,255,255,0.70)',
                                        }}>
                                        {o.display}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* ── Utsav Picker (only when fundType === 'utsav') ── */}
                        {form.fundType === 'utsav' && (
                            <div className="p-4 rounded-2xl" style={{ background: 'linear-gradient(145deg, #FFF8E7, #FFF3D6)', border: '1px solid rgba(245,166,35,0.25)' }}>
                                <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide mb-2.5" style={{ color: '#92400E' }}>
                                    <Landmark size={14} strokeWidth={2.5} /> {t('selectUtsav')} *
                                </label>
                                {activeUtsavs.length === 0 ? (
                                    <p className="text-xs font-medium" style={{ color: '#92400E' }}>{t('noUtsavs')}</p>
                                ) : (
                                    <div className="space-y-2">
                                        {activeUtsavs.map((u) => {
                                            const isSelected = form.utsavId === u._id;
                                            return (
                                                <button key={u._id} type="button" onClick={() => handleUtsavSelect(u)}
                                                    className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all"
                                                    style={{
                                                        background: isSelected ? 'linear-gradient(135deg, #FF8534, #FF6B00)' : 'rgba(255,255,255,0.80)',
                                                        color: isSelected ? 'white' : 'var(--text-primary)',
                                                        boxShadow: isSelected ? '0 4px 14px rgba(255,107,0,0.35)' : 'var(--clay-shadow-sm)',
                                                        border: `1.5px solid ${isSelected ? 'transparent' : 'rgba(255,255,255,0.70)'}`,
                                                    }}>
                                                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                                                        style={{ background: isSelected ? 'rgba(255,255,255,0.20)' : 'linear-gradient(135deg, #FFF3D6, #FFE8A0)' }}>
                                                        <Landmark size={16} strokeWidth={2.5} />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-xs font-bold truncate">{lang === 'hi' && u.nameHi ? u.nameHi : u.name}</p>
                                                        <p className="text-[10px] mt-0.5 opacity-75">{u.startDate} → {u.endDate}</p>
                                                    </div>
                                                    {isSelected && <span className="text-white flex items-center"><Check size={16} strokeWidth={3} /></span>}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                                {errors.utsavId && <p className="text-xs text-red-600 mt-2">{errors.utsavId}</p>}
                            </div>
                        )}

                        {/* Payment Mode */}
                        <div>
                            <label className="text-xs font-bold uppercase tracking-wide mb-2 block" style={{ color: '#1F2937' }}>{t('paymentMode')} *</label>
                            <div className="flex gap-2">
                                {labelOf(PAY_OPTS).map((o) => (
                                    <button key={o.value} type="button" onClick={() => set('paymentMode', o.value)}
                                        className="flex-1 py-2.5 text-xs font-bold rounded-2xl transition-all"
                                        style={{
                                            background: form.paymentMode === o.value ? 'linear-gradient(135deg, var(--saffron), var(--gold))' : 'linear-gradient(145deg, #FAF7F4, #F0EDE8)',
                                            color: form.paymentMode === o.value ? 'white' : 'var(--text-secondary)',
                                            boxShadow: form.paymentMode === o.value ? 'var(--clay-shadow-saffron)' : 'var(--clay-shadow-sm)',
                                            border: '1px solid rgba(255,255,255,0.70)',
                                        }}>
                                        {o.display}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* ── UPI Manual Flow ── */}
                        {form.paymentMode === 'upi' && (
                            <div className="p-5 rounded-2xl border" style={{ borderColor: 'rgba(37,99,235,0.15)', background: 'linear-gradient(145deg, #EFF6FF, #DBEAFE)' }}>
                                <div className="flex flex-col md:flex-row gap-5 items-center">
                                    {/* QR Dispaly */}
                                    <div className="flex-shrink-0">
                                        <p className="text-xs font-bold text-center mb-2" style={{ color: '#1D4ED8' }}>
                                            {lang === 'hi' ? 'Trust का UPI QR' : 'Trust UPI QR'}
                                        </p>
                                        {settings.upiQrUrl ? (
                                            <div className="bg-white p-2 rounded-xl border" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
                                                <img src={settings.upiQrUrl} alt="Trust UPI QR" className="w-32 h-32 object-contain rounded-lg" />
                                            </div>
                                        ) : (
                                            <div className="w-32 h-32 bg-white rounded-xl border border-dashed flex flex-col items-center justify-center text-center p-2"
                                                style={{ borderColor: 'rgba(0,0,0,0.15)' }}>
                                                <AlertTriangle size={24} strokeWidth={1.5} className="text-gray-400 mb-1" />
                                                <p className="text-[10px] font-semibold text-gray-500">
                                                    {lang === 'hi' ? 'Super Admin ने QR अपलोड नहीं किया है' : 'QR not uploaded by Super Admin'}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Ref & Screenshot */}
                                    <div className="flex-1 space-y-4 w-full">
                                        <div>
                                            <label className="text-xs font-bold block mb-1.5" style={{ color: '#1E3A8A' }}>
                                                {lang === 'hi' ? 'UPI संदर्भ संख्या (Ref No) *' : 'UPI Reference Number *'}
                                            </label>
                                            <input value={form.upiRefNo} onChange={(e) => set('upiRefNo', e.target.value)}
                                                placeholder="e.g. 30192039129" className={`w-full px-3 py-2 rounded-xl text-sm border focus:outline-none ${errors.upiRefNo ? 'border-red-400 focus:ring-red-200' : 'border-blue-200 focus:border-blue-400 focus:ring-blue-100'}`} />
                                            {errors.upiRefNo && <p className="text-xs text-red-500 mt-1">{errors.upiRefNo}</p>}
                                        </div>

                                        <div>
                                            <label className="text-xs font-bold block mb-1.5" style={{ color: '#1E3A8A' }}>
                                                {lang === 'hi' ? 'भुगतान का स्क्रीनशॉट' : 'Payment Screenshot'}
                                            </label>
                                            <label className="flex items-center gap-3 bg-white px-3 py-2 rounded-xl border border-blue-200 hover:border-blue-400 cursor-pointer transition-colors text-sm font-medium" style={{ color: '#2563EB' }}>
                                                {upiUploading ? (
                                                    <span className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full anim-spin" />
                                                ) : <Paperclip size={16} strokeWidth={2} />}
                                                {form.upiScreenshotUrl ? (
                                                    <span className="flex items-center gap-1.5"><Check size={14} strokeWidth={3} className="text-emerald-600" /> {lang === 'hi' ? 'अपलोड हो गया (बदलें)' : 'Uploaded (Click to change)'}</span>
                                                ) : (lang === 'hi' ? 'स्क्रीनशॉट अपलोड करें' : 'Upload Screenshot')}
                                                <input type="file" accept="image/*" className="hidden" onChange={handleUpiScreenshot} />
                                            </label>
                                            {upiPreview && !form.upiScreenshotUrl && (
                                                <p className="text-[10px] mt-1 text-blue-600 font-semibold">{lang === 'hi' ? 'अपलोड हो रहा है...' : 'Uploading to Cloudinary...'}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Date + Notes */}
                        <div>
                            <label className="text-xs font-bold uppercase tracking-wide mb-1.5 block" style={{ color: '#1F2937' }}>{t('date')} *</label>
                            <input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} className={ic('date')} />
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase tracking-wide mb-1.5 block" style={{ color: '#1F2937' }}>{t('notes')}</label>
                            <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)}
                                rows={2} placeholder={lang === 'hi' ? 'वैकल्पिक टिप्पणी' : 'Optional remarks'}
                                className={ic('notes') + ' resize-none'} />
                        </div>
                    </div>
                )}

                {/* ── Step 2: Review ── */}
                {step === 2 && (
                    <div className="space-y-3">
                        <h2 className="text-sm font-bold pb-2 border-b" style={{ color: 'var(--text-primary)', borderColor: 'rgba(0,0,0,0.05)' }}>{t('review')}</h2>
                        <div className="rounded-2xl p-4 space-y-2.5" style={{ background: 'linear-gradient(145deg, #FAF7F4, #F5F0EB)', boxShadow: 'var(--clay-shadow-sm)' }}>
                            {[
                                [t('donorName'), form.donorName],
                                [t('mobileNumber'), form.mobile],
                                [t('address'), form.address],
                                [t('amount'), `₹${Number(form.amount).toLocaleString('en-IN')}`],
                                [t('fundType'), labelOf(FUND_OPTS).find((o) => o.value === form.fundType)?.display],
                                ...(form.fundType === 'utsav' && form.utsavName ? [[(lang === 'hi' ? 'उत्सव' : 'Utsav'), form.utsavName]] : []),
                                [t('paymentMode'), labelOf(PAY_OPTS).find((o) => o.value === form.paymentMode)?.display],
                                ...(form.paymentMode === 'upi' ? [[(lang === 'hi' ? 'UPI संदर्भ' : 'UPI Ref'), form.upiRefNo]] : []),
                                [t('date'), form.date],
                                ...(form.notes ? [[t('notes'), form.notes]] : []),
                            ].map(([label, value]) => (
                                <div key={label} className="flex items-start gap-3">
                                    <span className="text-xs w-28 flex-shrink-0 mt-0.5" style={{ color: '#6B7280' }}>{label}:</span>
                                    <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{value || '-'}</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: 'linear-gradient(135deg, #FFFBEB, #FEF3C7)', border: '1px solid rgba(245,158,11,0.25)' }}>
                            <Info size={16} strokeWidth={2} className="text-amber-600 flex-shrink-0" />
                            <p className="text-xs font-medium" style={{ color: '#92400E' }}>
                                {lang === 'hi' ? 'सबमिट के बाद रिकॉर्ड लॉक। केवल Super Admin बदलाव कर सकते हैं।' : 'Record is locked after submission. Only Super Admin can edit.'}
                            </p>
                        </div>
                    </div>
                )}

                {/* Navigation */}
                <div className="flex gap-3 mt-6 pt-4" style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                    {step > 0 && (
                        <button onClick={back} className="clay-btn clay-btn-secondary flex-1">{t('back')}</button>
                    )}
                    {step < STEPS.length - 1 ? (
                        <button onClick={next} className="clay-btn clay-btn-primary flex-1">{t('next')}</button>
                    ) : (
                        <button onClick={handleSubmit} disabled={submitting || upiUploading} className="clay-btn clay-btn-primary flex-1 disabled:opacity-60">
                            {submitting && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full anim-spin" />}
                            {t('submit')}
                        </button>
                    )}
                </div>
            </div>

            <ReceiptModal donation={receipt} onClose={handleReceiptClose} />
        </div>
    );
}
