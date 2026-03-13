'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { useLang } from '@/lib/context/LangContext';
import { ROLES, ROLE_DEFAULTS, PERMISSION_GROUPS, PERMISSIONS } from '@/lib/permissions';
import Button from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';
import { AlertTriangle } from 'lucide-react';

const ROLE_OPTS = Object.entries(ROLES).map(([value, r]) => ({ value, label: r.label, labelHi: r.labelHi }));

function NewUserForm() {
    const { currentUser } = useAuth();
    const { t, lang } = useLang();
    const router = useRouter();
    const searchParams = useSearchParams();
    const editId = searchParams.get('edit');

    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(!!editId);
    const [errors, setErrors] = useState({});
    const [mode, setMode] = useState('defaults'); // 'defaults' | 'custom'

    const [form, setForm] = useState({
        name: '', mobile: '', tempPassword: '', role: 'staff',
        useRoleDefaults: true, permissions: [...ROLE_DEFAULTS.staff],
        isActive: true, avatar: '',
    });

    useEffect(() => {
        if (!editId) return;
        async function fetchEditUser() {
            try {
                const res = await fetch('/api/users');
                const data = await res.json();
                if (data.success) {
                    const u = data.users.find((x) => x._id?.toString() === editId);
                    if (u) {
                        setForm({
                            name: u.name || '',
                            mobile: u.mobile || '',
                            tempPassword: '', // Don't prefill password
                            role: u.role || 'staff',
                            useRoleDefaults: u.useRoleDefaults ?? true,
                            permissions: u.permissions || [],
                            isActive: u.isActive ?? true,
                            avatar: u.avatar || ''
                        });
                        setMode(u.useRoleDefaults ? 'defaults' : 'custom');
                    } else {
                        toast.error('User not found');
                        router.push('/dashboard/users');
                    }
                }
            } catch { toast.error('Failed to load user data for editing'); }
            finally { setLoading(false); }
        }
        fetchEditUser();
    }, [editId, router]);

    const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: '' })); };

    // When role changes, update default permissions
    const handleRoleChange = (role) => {
        set('role', role);
        if (mode === 'defaults') {
            set('permissions', [...ROLE_DEFAULTS[role]]);
        }
    };

    // Switch permission mode
    const switchMode = (m) => {
        setMode(m);
        const useDefaults = m === 'defaults';
        setForm((f) => ({
            ...f,
            useRoleDefaults: useDefaults,
            permissions: useDefaults ? [...ROLE_DEFAULTS[f.role]] : [...ROLE_DEFAULTS[f.role]],
        }));
    };

    // Toggle individual permission
    const togglePermission = (perm) => {
        setForm((f) => {
            const perms = f.permissions.includes(perm)
                ? f.permissions.filter((p) => p !== perm)
                : [...f.permissions, perm];
            return { ...f, permissions: perms };
        });
    };

    const validate = () => {
        const errs = {};
        if (!form.name.trim()) errs.name = t('required');
        if (!/^\d{10}$/.test(form.mobile)) errs.mobile = t('invalidMobile');
        if (!editId && (!form.tempPassword || form.tempPassword.length < 6)) errs.tempPassword = lang === 'hi' ? 'कम से कम 6 अक्षर' : 'Minimum 6 characters';
        if (editId && form.tempPassword && form.tempPassword.length < 6) errs.tempPassword = lang === 'hi' ? 'कम से कम 6 अक्षर' : 'Minimum 6 characters';
        if (!form.role) errs.role = t('required');
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        setSubmitting(true);

        const initials = form.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
        const payload = { ...form };
        if (form.tempPassword) payload.password = form.tempPassword; // only send if set (or creating where required)

        try {
            const url = editId ? `/api/users/${editId}` : '/api/users';
            const method = editId ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (res.ok && data.success) {
                toast.success(editId ? (lang === 'hi' ? 'उपयोगकर्ता अपडेट हो गया' : 'User updated') : t('userCreated'));
                router.push('/dashboard/users');
            } else {
                toast.error(data.error || 'Failed to save user');
            }
        } catch {
            toast.error('Network error');
        } finally {
            setSubmitting(false);
        }
    };

    const inputCls = (k) =>
        `w-full border rounded-[var(--radius-md)] px-3 py-2.5 text-sm focus:outline-none transition-all ${errors[k] ? 'border-[var(--danger)] focus:ring-2 focus:ring-red-200' : 'border-[var(--border)] focus:border-[var(--saffron)] focus:ring-2 focus:ring-[var(--saffron)]/15'}`;

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-6">
                <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--saffron)] transition-colors mb-3">
                    <svg width="14" height="14" fill="none" viewBox="0 0 14 14"><path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    {t('back')}
                </button>
                <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                    {editId ? (lang === 'hi' ? 'उपयोगकर्ता संपादित करें' : 'Edit User') : t('createUser')}
                </h1>
            </div>

            {loading ? (
                <div className="flex justify-center p-10"><span className="w-8 h-8 border-4 border-[var(--saffron)] border-t-transparent rounded-full anim-spin" /></div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in">
                    {/* Account Info */}
                    <div className="bg-white rounded-[var(--radius-xl)] border border-[var(--border)] p-6 shadow-[var(--shadow-md)] space-y-4">
                        <h2 className="text-sm font-semibold text-[var(--text-primary)] pb-2 border-b border-[var(--border)]">{lang === 'hi' ? 'खाता जानकारी' : 'Account Information'}</h2>
                        <div>
                            <label className="text-sm font-medium block mb-1">{t('userName')} <span className="text-[var(--danger)]">*</span></label>
                            <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder={lang === 'hi' ? 'पूरा नाम' : 'Full Name'} className={inputCls('name')} />
                            {errors.name && <p className="text-xs text-[var(--danger)] mt-1">{errors.name}</p>}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium block mb-1">{t('mobileNumber')} <span className="text-[var(--danger)]">*</span></label>
                                <input type="tel" value={form.mobile} onChange={(e) => set('mobile', e.target.value.replace(/\D/, '').slice(0, 10))} maxLength={10} placeholder="10-digit mobile" className={inputCls('mobile')} />
                                {errors.mobile && <p className="text-xs text-[var(--danger)] mt-1">{errors.mobile}</p>}
                            </div>
                            <div>
                                <label className="text-sm font-medium block mb-1">
                                    {editId ? (lang === 'hi' ? 'पासवर्ड बदलें (वैकल्पिक)' : 'Change Password (Optional)') : t('tempPassword')}
                                    {!editId && <span className="text-[var(--danger)]">*</span>}
                                </label>
                                <input type="text" value={form.tempPassword} onChange={(e) => set('tempPassword', e.target.value)} placeholder="min 6 chars" className={inputCls('tempPassword')} />
                                {errors.tempPassword && <p className="text-xs text-[var(--danger)] mt-1">{errors.tempPassword}</p>}
                            </div>
                        </div>

                        {/* Role */}
                        <div>
                            <label className="text-sm font-medium block mb-2">{t('role')} <span className="text-[var(--danger)]">*</span></label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {ROLE_OPTS.map((o) => {
                                    const rInfo = ROLES[o.value];
                                    return (
                                        <button key={o.value} type="button" onClick={() => handleRoleChange(o.value)}
                                            className={`py-2.5 px-3 text-xs font-medium rounded-[var(--radius-md)] border text-left transition-all ${form.role === o.value ? 'text-white border-transparent' : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--saffron)]'}`}
                                            style={form.role === o.value ? { background: rInfo.color } : {}}>
                                            {lang === 'hi' ? o.labelHi : o.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Permission Assignment */}
                    <div className="bg-white rounded-[var(--radius-xl)] border border-[var(--border)] p-6 shadow-[var(--shadow-md)] space-y-4">
                        <h2 className="text-sm font-semibold text-[var(--text-primary)] pb-2 border-b border-[var(--border)]">{t('permissionMode')}</h2>

                        {/* Mode toggle */}
                        <div className="flex gap-2 bg-gray-100 rounded-[var(--radius-md)] p-1 w-fit">
                            {[['defaults', t('useRoleDefaults')], ['custom', t('customPermissions')]].map(([m, lbl]) => (
                                <button key={m} type="button" onClick={() => switchMode(m)}
                                    className={`px-4 py-1.5 text-sm font-medium rounded-[var(--radius-md)] transition-all ${mode === m ? 'bg-white shadow-sm text-[var(--text-primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}>
                                    {lbl}
                                </button>
                            ))}
                        </div>

                        {mode === 'defaults' ? (
                            <div className="bg-blue-50 border border-blue-200 rounded-[var(--radius-md)] p-4">
                                <p className="text-xs font-semibold text-blue-700 mb-2">
                                    {lang === 'hi' ? `"${ROLES[form.role]?.labelHi}" के लिए डिफ़ॉल्ट अनुमतियाँ:` : `Default permissions for "${ROLES[form.role]?.label}":`}
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {ROLE_DEFAULTS[form.role]?.map((perm) => (
                                        <span key={perm} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">{perm}</span>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <p className="text-xs text-[var(--text-muted)]">{t('permissionsFor')}</p>

                                {PERMISSION_GROUPS.map((group) => (
                                    <div key={group.key} className="border border-[var(--border)] rounded-[var(--radius-lg)] overflow-hidden">
                                        <div className="bg-gray-50 px-4 py-2.5 border-b border-[var(--border)]">
                                            <h3 className="text-xs font-semibold text-[var(--text-primary)]">
                                                {lang === 'hi' ? group.labelHi : group.label}
                                            </h3>
                                        </div>
                                        <div className="p-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                                            {group.permissions.map(({ perm, label, labelHi, dangerous }) => {
                                                const checked = form.permissions.includes(perm);
                                                return (
                                                    <label key={perm}
                                                        className={`flex items-center gap-2 p-2 rounded-[var(--radius-md)] cursor-pointer border transition-all ${checked ? (dangerous ? 'bg-red-50 border-red-200' : 'bg-green-50 border-emerald-200') : 'border-transparent hover:bg-gray-50'}`}>
                                                        <input type="checkbox" checked={checked} onChange={() => togglePermission(perm)}
                                                            className="w-3.5 h-3.5 rounded accent-[var(--saffron)] flex-shrink-0" />
                                                        <span className={`text-xs font-medium flex-1 flex items-center gap-1.5 ${dangerous && checked ? 'text-red-700' : 'text-[var(--text-primary)]'}`}>
                                                            {dangerous && <AlertTriangle size={14} className="text-red-500" />} {lang === 'hi' ? labelHi : label}
                                                        </span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                        {/* Warning for dangerous permissions */}
                                        {group.permissions.some((p) => p.dangerous && form.permissions.includes(p.perm)) && (
                                            <div className="px-4 py-2 bg-red-50 border-t border-red-200">
                                                <p className="text-xs text-red-600 flex items-center gap-1.5"><AlertTriangle size={14} /> {t('dangerousPermWarning')}</p>
                                            </div>
                                        )}
                                    </div>
                                ))}

                                <p className="text-xs text-[var(--text-muted)]">
                                    {form.permissions.length} {lang === 'hi' ? 'अनुमतियाँ चुनी गई' : 'permissions selected'}
                                </p>
                            </div>
                        )}
                    </div>

                    <Button type="submit" loading={submitting} fullWidth size="lg">
                        {editId ? (lang === 'hi' ? 'परिवर्तन सहेजें' : 'Save Changes') : t('createUser')}
                    </Button>
                </form>
            )}
        </div>
    );
}

export default function NewUserPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <NewUserForm />
        </Suspense>
    );
}
