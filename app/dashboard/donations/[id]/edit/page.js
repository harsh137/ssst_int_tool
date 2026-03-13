'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { useLang } from '@/lib/context/LangContext';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { toast } from '@/components/ui/Toast';
import { formatINR, formatDate } from '@/lib/data/mockData';
import { Check, Paperclip } from 'lucide-react';

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

export default function EditDonationPage() {
    const { currentUser } = useAuth();
    const { t, lang } = useLang();
    const router = useRouter();
    const params = useParams();
    const donationId = params.id;

    const [isLoading, setIsLoading] = useState(true);
    const [step, setStep] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    const [upiUploading, setUpiUploading] = useState(false);
    const [upiPreview, setUpiPreview] = useState(null);

    const [form, setForm] = useState({
        donorName: '', mobile: '', address: '', amount: '', fundType: 'general',
        utsavId: '', utsavName: '',
        paymentMode: 'cash', upiRefNo: '', upiScreenshotUrl: '',
        date: '', notes: ''
    });

    const [settings, setSettings] = useState({});
    const [activeUtsavs, setActiveUtsavs] = useState([]);

    useEffect(() => {
        async function fetchInitialData() {
            try {
                const [settingsRes, utsavsRes, donationRes] = await Promise.all([
                    fetch('/api/settings'),
                    fetch('/api/utsavs'),
                    fetch(`/api/donations/${donationId}`)
                ]);

                const sData = await settingsRes.json();
                const uData = await utsavsRes.json();
                const dData = await donationRes.json();

                if (sData.success) setSettings(sData.settings);
                if (uData.success) setActiveUtsavs(uData.utsavs);

                if (dData.success) {
                    const d = dData.donation;
                    setForm({
                        donorName: d.donorName || '',
                        mobile: d.mobile || '',
                        address: d.address || '',
                        amount: d.amount || '',
                        fundType: d.fundType || 'general',
                        utsavId: d.utsavId || '',
                        utsavName: d.utsavName || '',
                        paymentMode: d.paymentMode || 'cash',
                        upiRefNo: d.upiRefNo || '',
                        upiScreenshotUrl: d.upiScreenshotUrl || '',
                        date: d.date ? d.date.split('T')[0] : '',
                        notes: d.notes || ''
                    });
                    if (d.upiScreenshotUrl) setUpiPreview(d.upiScreenshotUrl);
                } else {
                    toast.error(dData.error || 'Failed to load donation details');
                    router.push('/dashboard/donations');
                }
            } catch (err) {
                console.error('Failed to load edit data', err);
                toast.error('Network error. Check your connection or permissions.');
                router.push('/dashboard/donations');
            } finally {
                setIsLoading(false);
            }
        }
        if (donationId) fetchInitialData();
    }, [donationId, router]);

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
            setUpiPreview(url);
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
            const res = await fetch(`/api/donations/${donationId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, amount: Number(form.amount) })
            });
            const data = await res.json();

            if (res.ok && data.success) {
                toast.success('Donation updated successfully');
                router.push('/dashboard/donations');
            } else {
                toast.error(data.error || 'Failed to update donation');
            }
        } catch {
            toast.error('Network Error');
        } finally {
            setSubmitting(false);
        }
    };

    const labelOf = (opts) => opts.map((o) => ({ ...o, display: lang === 'hi' ? o.labelHi : o.label }));
    const ic = (k) => `clay-input ${errors[k] ? 'error' : ''}`;

    if (isLoading) return <div className="p-8 text-center text-[var(--text-muted)]">Loading...</div>;

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
                <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Edit Donation</h1>
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
                            <label className="text-xs font-bold uppercase tracking-wide mb-1.5 block" style={{ color: '#1F2937' }}>{t('mobile')} *</label>
                            <input type="tel" maxLength="10" placeholder="10-digit number"
                                value={form.mobile} onChange={(e) => set('mobile', e.target.value.replace(/\D/g, ''))} className={ic('mobile')} />
                            {errors.mobile && <p className="text-xs text-red-500 mt-1">{errors.mobile}</p>}
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase tracking-wide mb-1.5 block" style={{ color: '#1F2937' }}>{t('address')}</label>
                            <textarea value={form.address} onChange={(e) => set('address', e.target.value)} rows="2"
                                placeholder={lang === 'hi' ? 'पता' : 'Address'} className={ic('address')} />
                            {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
                        </div>
                        <div className="pt-2 flex justify-end">
                            <button onClick={next} className="clay-btn-primary flex items-center gap-2">
                                {t('next')}
                                <svg width="12" height="12" fill="none" viewBox="0 0 12 12"><path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            </button>
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
                            <input type="number" min="1" value={form.amount} onChange={(e) => set('amount', e.target.value)}
                                placeholder="e.g. 500" className={ic('amount')} style={{ fontSize: '18px', fontWeight: 'bold' }} />
                            {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
                        </div>

                        {/* Date */}
                        <div>
                            <label className="text-xs font-bold uppercase tracking-wide mb-1.5 block" style={{ color: '#1F2937' }}>{t('date')} *</label>
                            <input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} className={ic('date')} />
                            {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date}</p>}
                        </div>

                        {/* Fund Type */}
                        <div>
                            <label className="text-xs font-bold uppercase tracking-wide mb-1.5 block" style={{ color: '#1F2937' }}>{t('fundType')} *</label>
                            <div className="grid grid-cols-2 gap-2">
                                {labelOf(FUND_OPTS).map((o) => (
                                    <button key={o.value} onClick={() => handleFundType(o.value)}
                                        className={`px-3 py-2 text-sm font-semibold rounded-xl border-2 transition-all text-center
                                            ${form.fundType === o.value ? 'border-[var(--saffron)] bg-orange-50/50 text-[var(--saffron)]' : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-gray-300'}
                                        `}>
                                        {o.display}
                                    </button>
                                ))}
                            </div>
                            {errors.fundType && <p className="text-xs text-red-500 mt-1">{errors.fundType}</p>}
                        </div>

                        {/* Utsav Selection Drawer */}
                        {form.fundType === 'utsav' && (
                            <div className="p-3 bg-red-50/50 border border-red-100 rounded-xl space-y-2 anim-scale-in">
                                <label className="text-xs font-bold uppercase tracking-wide block text-red-800">{lang === 'hi' ? 'उत्सव चुनें' : 'Select Utsav'}</label>
                                {activeUtsavs.length === 0 ? (
                                    <p className="text-xs text-red-600">{lang === 'hi' ? 'कोई सक्रिय उत्सव नहीं मिला' : 'No active Utsavs found'}</p>
                                ) : (
                                    <div className="grid grid-cols-2 gap-2">
                                        {activeUtsavs.map((u) => (
                                            <button key={u._id} onClick={() => handleUtsavSelect(u)}
                                                className={`px-3 py-1.5 text-xs font-bold rounded-lg border text-left truncate transition-colors
                                                ${form.utsavId === u._id ? 'bg-red-500 text-white border-red-600 shadow-sm' : 'bg-white text-red-700 border-red-200 hover:bg-red-100'}
                                            `}>
                                                {lang === 'hi' ? u.nameHi : u.name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {errors.utsavId && <p className="text-xs text-red-500">{errors.utsavId}</p>}
                            </div>
                        )}

                        {/* Payment Mode */}
                        <div>
                            <label className="text-xs font-bold uppercase tracking-wide mb-1.5 block" style={{ color: '#1F2937' }}>{t('paymentMode')} *</label>
                            <div className="grid grid-cols-3 gap-2">
                                {labelOf(PAY_OPTS).map((o) => (
                                    <button key={o.value} onClick={() => set('paymentMode', o.value)}
                                        className={`px-2 py-2 text-xs font-bold rounded-xl border-2 transition-all
                                        ${form.paymentMode === o.value ? 'border-[var(--saffron)] bg-orange-50/50 text-[var(--saffron)]' : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-gray-300'}
                                    `}>
                                        {o.display}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* UPI Details Drawer */}
                        {form.paymentMode === 'upi' && (
                            <div className="p-4 bg-orange-50/40 border-2 border-orange-100 rounded-2xl space-y-4 anim-scale-in">
                                {/* Show Trust QR */}
                                {settings.upiQrCodeUrl && (
                                    <div className="flex gap-4 items-center bg-white p-3 rounded-xl shadow-sm border border-orange-100">
                                        <img src={settings.upiQrCodeUrl} alt="Trust QR Code" className="w-16 h-16 object-cover rounded-lg border border-[var(--border)]" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-[var(--text-primary)]">Trust UPI QR Code</p>
                                            <p className="text-xs text-[var(--text-muted)] truncate">{settings.upiId || 'Scan to pay'}</p>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="text-xs font-bold text-orange-800 uppercase tracking-wide mb-1.5 block">UPI Reference No. *</label>
                                    <input value={form.upiRefNo} onChange={(e) => set('upiRefNo', e.target.value)}
                                        placeholder="e.g. 31234567890" className={`${ic('upiRefNo')} !border-orange-200 focus:!border-orange-400`} />
                                    {errors.upiRefNo && <p className="text-xs text-red-500 mt-1">{errors.upiRefNo}</p>}
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-orange-800 uppercase tracking-wide mb-1.5 block">Payment Screenshot</label>
                                    <div className="flex items-center gap-3">
                                        {upiPreview && (
                                            <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-orange-200">
                                                <img src={upiPreview} alt="Preview" className="w-full h-full object-cover" />
                                                {upiUploading && <div className="absolute inset-0 bg-white/60 flex items-center justify-center"><div className="w-4 h-4 border-2 border-[var(--saffron)] border-t-transparent rounded-full animate-spin" /></div>}
                                            </div>
                                        )}
                                        <label className="flex-1 flex flex-col items-center justify-center py-4 border-2 border-dashed border-orange-300 rounded-xl bg-orange-50/50 hover:bg-orange-100 transition-colors cursor-pointer text-orange-600">
                                            <Paperclip size={20} strokeWidth={2} className="mb-1" />
                                            <span className="text-xs font-bold">{lang === 'hi' ? 'गैलरी से अपलोड करें' : 'Upload Receipt'}</span>
                                            <input type="file" accept="image/*" className="hidden" onChange={handleUpiScreenshot} />
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="pt-2 flex justify-between">
                            <button onClick={back} className="clay-btn-secondary">{t('back')}</button>
                            <button onClick={next} className="clay-btn-primary flex items-center gap-2">
                                {t('next')}
                                <svg width="12" height="12" fill="none" viewBox="0 0 12 12"><path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            </button>
                        </div>
                    </div>
                )}

                {/* ── Step 2: Review & Submit ── */}
                {step === 2 && (
                    <div className="space-y-4">
                        <h2 className="text-sm font-bold pb-2 border-b" style={{ color: 'var(--text-primary)', borderColor: 'rgba(0,0,0,0.05)' }}>Review Donation</h2>

                        <div className="bg-[#fcfbf9] border border-[var(--border)] rounded-2xl p-4 space-y-3">
                            <div className="flex justify-between items-baseline border-b border-[var(--border)] pb-3">
                                <span className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-wide">{t('amount')}</span>
                                <span className="text-2xl font-bold text-[var(--saffron)]">₹{form.amount}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pb-3 border-b border-[var(--border)]">
                                <div>
                                    <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider mb-0.5">{t('donorName')}</p>
                                    <p className="text-sm font-bold text-[var(--text-primary)]">{form.donorName}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider mb-0.5">{t('mobile')}</p>
                                    <p className="text-sm font-semibold text-[var(--text-secondary)]">{form.mobile}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pb-3 border-b border-[var(--border)]">
                                <div>
                                    <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider mb-0.5">{t('fundType')}</p>
                                    <p className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md inline-block uppercase tracking-wide">
                                        {form.fundType === 'utsav' ? `Utsav: ${form.utsavName}` : form.fundType}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider mb-0.5">{t('paymentMode')}</p>
                                    <p className="text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-md inline-block uppercase tracking-wide">{form.paymentMode}</p>
                                </div>
                            </div>

                            {form.paymentMode === 'upi' && form.upiRefNo && (
                                <div className="flex justify-between items-center bg-orange-50 p-2 rounded-lg border border-orange-100">
                                    <span className="text-[10px] font-bold text-orange-800 uppercase tracking-wide">UPI Ref</span>
                                    <span className="text-xs font-mono font-bold text-orange-900">{form.upiRefNo}</span>
                                </div>
                            )}

                            <div>
                                <label className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider mb-1 block">{t('notes')}</label>
                                <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows="2"
                                    placeholder="Optional notes or remarks" className={`clay-input text-xs ${errors.notes ? 'error' : ''}`} />
                            </div>
                        </div>

                        <div className="pt-4 flex justify-between items-center">
                            <button onClick={back} className="clay-btn-secondary" disabled={submitting}>{t('back')}</button>
                            <button onClick={handleSubmit} disabled={submitting || upiUploading}
                                className={`clay-btn-primary flex items-center gap-2 px-6 ${submitting ? 'opacity-70 cursor-wait' : ''}`}>
                                {submitting ? (lang === 'hi' ? 'अपडेट हो रहा है...' : 'Updating...') : (lang === 'hi' ? 'अपडेट सेव करें' : 'Update Donation')}
                                {!submitting && <svg width="14" height="14" fill="none" viewBox="0 0 14 14"><path d="M11.5 3.5l-6 6-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
