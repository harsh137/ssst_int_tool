'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { useLang } from '@/lib/context/LangContext';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { toast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';
import { Check, Paperclip, Hourglass } from 'lucide-react';

const CAT_OPTS = [
    { value: 'tent', label: 'Tent & Canopy', labelHi: 'तंबू और छतरी' },
    { value: 'prasad', label: 'Prasad & Food', labelHi: 'प्रसाद और भोजन' },
    { value: 'construction', label: 'Temple Construction', labelHi: 'मंदिर निर्माण' },
    { value: 'electricity', label: 'Electricity', labelHi: 'बिजली' },
    { value: 'decoration', label: 'Decoration', labelHi: 'सजावट' },
    { value: 'other', label: 'Other', labelHi: 'अन्य' },
];
const PAY_OPTS = [
    { value: 'cash', label: 'Cash', labelHi: 'नकद' },
    { value: 'upi', label: 'UPI', labelHi: 'UPI' },
    { value: 'bankTransfer', label: 'Bank Transfer', labelHi: 'बैंक ट्रांसफर' },
];

export default function NewExpensePage() {
    const { currentUser } = useAuth();
    const { t, lang } = useLang();
    const router = useRouter();

    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    // Cloudinary state
    const [billUploading, setBillUploading] = useState(false);
    const [billPreview, setBillPreview] = useState(null);

    const [form, setForm] = useState({
        category: '', vendor: '', amount: '', paymentMode: 'cash',
        date: new Date().toISOString().split('T')[0], notes: '',
        billImageUrl: '', createdBy: currentUser?.id, createdByName: currentUser?.name,
    });

    const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: '' })); };

    const handleBillUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setBillUploading(true);
        // temp preview
        setBillPreview(URL.createObjectURL(file));

        try {
            const { url } = await uploadToCloudinary(file, 'ssst/bills');
            set('billImageUrl', url);
            toast.info(lang === 'hi' ? 'बिल छवि अपलोड हो गई' : 'Bill image uploaded');
        } catch (err) {
            toast.error(lang === 'hi' ? 'छवि अपलोड विफल' : 'Image upload failed');
            setBillPreview(null);
        } finally {
            setBillUploading(false);
        }
    };

    const validate = () => {
        const errs = {};
        if (!form.category) errs.category = t('required');
        if (!form.vendor.trim()) errs.vendor = t('required');
        if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0) errs.amount = t('invalidAmount');
        if (!form.date) errs.date = t('required');
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (billUploading) {
            toast.warning(lang === 'hi' ? 'कृपया छवि अपलोड पूरी होने दें' : 'Please wait for upload to finish');
            return;
        }
        if (!validate()) return;

        setSubmitting(true);
        try {
            const res = await fetch('/api/expenses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, amount: Number(form.amount) })
            });
            const data = await res.json();

            if (res.ok && data.success) {
                toast.success(t('expenseSuccess'));
                router.push('/dashboard/expenses');
            } else {
                toast.error(data.error || 'Failed to submit expense');
            }
        } catch {
            toast.error('Network Error');
        } finally {
            setSubmitting(false);
        }
    };

    const inputCls = (k) =>
        `w-full border rounded-[var(--radius-md)] px-3 py-2.5 text-sm focus:outline-none transition-all ${errors[k] ? 'border-[var(--danger)] focus:ring-2 focus:ring-red-200' : 'border-[var(--border)] focus:border-[var(--saffron)] focus:ring-2 focus:ring-[var(--saffron)]/15'}`;

    return (
        <div className="max-w-xl mx-auto">
            <div className="mb-6">
                <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--saffron)] transition-colors mb-3">
                    <svg width="14" height="14" fill="none" viewBox="0 0 14 14"><path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    {t('back')}
                </button>
                <h1 className="text-2xl font-bold text-[var(--text-primary)]">{t('createExpense')}</h1>
                <p className="text-sm text-[var(--text-muted)] mt-1">
                    {lang === 'hi' ? 'व्यय सबमिट करें — Super Admin द्वारा अनुमोदन जरूरी है' : 'Submit for Super Admin approval'}
                </p>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="bg-white rounded-[var(--radius-xl)] border border-[var(--border)] p-6 shadow-[var(--shadow-md)] space-y-5 animate-fade-in">

                    {/* Category */}
                    <div>
                        <label className="text-sm font-medium block mb-2">{t('category')} <span className="text-[var(--danger)]">*</span></label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {CAT_OPTS.map((o) => (
                                <button key={o.value} type="button" onClick={() => set('category', o.value)}
                                    className={`py-2 px-3 text-sm rounded-[var(--radius-md)] border font-medium text-left transition-all ${form.category === o.value ? 'text-white border-transparent' : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--saffron)]'}`}
                                    style={form.category === o.value ? { background: 'linear-gradient(135deg, var(--saffron), var(--gold))' } : {}}>
                                    {lang === 'hi' ? o.labelHi : o.label}
                                </button>
                            ))}
                        </div>
                        {errors.category && <p className="text-xs text-[var(--danger)] mt-1">{errors.category}</p>}
                    </div>

                    {/* Vendor */}
                    <div>
                        <label className="text-sm font-medium block mb-1">{t('vendor')} <span className="text-[var(--danger)]">*</span></label>
                        <input value={form.vendor} onChange={(e) => set('vendor', e.target.value)} placeholder={lang === 'hi' ? 'विक्रेता / दुकान का नाम' : 'Vendor / supplier name'} className={inputCls('vendor')} />
                        {errors.vendor && <p className="text-xs text-[var(--danger)] mt-1">{errors.vendor}</p>}
                    </div>

                    {/* Amount + Date */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium block mb-1">{t('amount')} (₹) <span className="text-[var(--danger)]">*</span></label>
                            <input type="number" value={form.amount} onChange={(e) => set('amount', e.target.value)} placeholder="0" min="1" className={inputCls('amount')} />
                            {errors.amount && <p className="text-xs text-[var(--danger)] mt-1">{errors.amount}</p>}
                        </div>
                        <div>
                            <label className="text-sm font-medium block mb-1">{t('date')} <span className="text-[var(--danger)]">*</span></label>
                            <input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} className={inputCls('date')} />
                        </div>
                    </div>

                    {/* Payment Mode */}
                    <div>
                        <label className="text-sm font-medium block mb-2">{t('paymentMode')}</label>
                        <div className="flex gap-2">
                            {PAY_OPTS.map((o) => (
                                <button key={o.value} type="button" onClick={() => set('paymentMode', o.value)}
                                    className={`flex-1 py-2 text-sm rounded-[var(--radius-md)] border font-medium transition-all ${form.paymentMode === o.value ? 'text-white border-transparent' : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--saffron)]'}`}
                                    style={form.paymentMode === o.value ? { background: 'linear-gradient(135deg, var(--saffron), var(--gold))' } : {}}>
                                    {lang === 'hi' ? o.labelHi : o.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Bill Image Upload */}
                    <div>
                        <label className="text-sm font-medium block mb-2">{t('billImage')}</label>
                        <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-[var(--border)] hover:border-[var(--saffron)] rounded-[var(--radius-lg)] p-6 cursor-pointer transition-colors bg-gray-50 hover:bg-orange-50/30">
                            {billPreview ? (
                                <div className="text-center">
                                    <img src={billPreview} alt="Bill" className="max-h-32 mb-2 rounded-lg object-contain mx-auto" style={{ border: '1px solid rgba(0,0,0,0.1)' }} />
                                    {billUploading ? (
                                        <p className="text-xs font-semibold text-blue-600">
                                            <span className="inline-block w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full anim-spin mr-1 align-middle" />
                                            {lang === 'hi' ? 'अपलोड हो रहा है...' : 'Uploading...'}
                                        </p>
                                    ) : (
                                        <p className="text-xs font-semibold text-emerald-600 flex items-center justify-center gap-1">
                                            <Check size={14} strokeWidth={3} /> {lang === 'hi' ? 'अपलोड हो गया (बदलें)' : 'Uploaded (Click to change)'}
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <Paperclip size={32} strokeWidth={1.5} className="text-gray-400 mb-2" />
                                    <div className="text-center">
                                        <p className="text-sm font-medium text-[var(--text-secondary)]">{t('uploadBill')}</p>
                                        <p className="text-xs text-[var(--text-muted)] mt-0.5">JPG, PNG, or PDF (Cloudinary)</p>
                                    </div>
                                </>
                            )}
                            <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleBillUpload} />
                        </label>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="text-sm font-medium block mb-1">{t('notes')}</label>
                        <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={3} placeholder={lang === 'hi' ? 'वैकल्पिक विवरण' : 'Optional description'} className={inputCls('notes') + ' resize-none'} />
                    </div>

                    {/* Pending notice */}
                    <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-[var(--radius-md)] px-3 py-2.5">
                        <Hourglass size={16} strokeWidth={2} className="text-amber-600 mt-0.5" />
                        <p className="text-xs text-amber-700">
                            {lang === 'hi' ? 'सबमिट करने के बाद यह "लंबित" रहेगा। Super Admin इसे स्वीकृत या अस्वीकार करेंगे।' : 'After submitting, this will be marked as "Pending" until Super Admin approves it.'}
                        </p>
                    </div>

                    <Button type="submit" loading={submitting || billUploading} disabled={billUploading} fullWidth size="lg">
                        {t('submit')}
                    </Button>
                </div>
            </form>
        </div>
    );
}
