'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import { useLang } from '@/lib/context/LangContext';
import { hasPermission, PERMISSIONS, ROLES } from '@/lib/permissions';
import { formatDate } from '@/lib/data/mockData';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { ConfirmModal } from '@/components/ui/Modal';
import { toast } from '@/components/ui/Toast';

export default function UsersPage() {
    const { currentUser } = useAuth();
    const { t, lang } = useLang();

    const [users, setUsers] = useState([]);
    const [deactivateTarget, setDT] = useState(null);

    const canCreate = hasPermission(currentUser, PERMISSIONS.USER_CREATE);
    const canEdit = hasPermission(currentUser, PERMISSIONS.USER_EDIT);
    const canDelete = hasPermission(currentUser, PERMISSIONS.USER_DELETE);

    const reload = async () => {
        try {
            const res = await fetch('/api/users');
            const data = await res.json();
            if (data.success) setUsers(data.users);
        } catch { toast.error('Failed to load users'); }
    };

    useEffect(() => { reload(); }, []);

    const handleToggleActive = async () => {
        try {
            const res = await fetch(`/api/users/${deactivateTarget._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !deactivateTarget.isActive })
            });
            if (res.ok) {
                setDT(null);
                reload();
                toast.success(`User ${deactivateTarget.isActive ? 'deactivated' : 'activated'}.`);
            } else {
                toast.error('Failed to update user status');
            }
        } catch { toast.error('Network error'); }
    };

    const roleInfo = (r) => ROLES[r] ?? ROLES.staff;

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">{t('userList')}</h1>
                    <p className="text-sm text-[var(--text-muted)] mt-0.5">{users.length} {lang === 'hi' ? 'उपयोगकर्ता' : 'accounts'}</p>
                </div>
                {canCreate && (
                    <Link href="/dashboard/users/new">
                        <Button icon={<span>+</span>}>{t('addUser')}</Button>
                    </Link>
                )}
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-[var(--radius-lg)] border border-[var(--border)] shadow-[var(--shadow-sm)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-[var(--border)]">
                            <tr>
                                {[t('srNo'), t('userName'), t('mobile'), t('role'), lang === 'hi' ? 'अनुमतियाँ' : 'Permissions', t('lastLogin'), t('activeStatus'), t('actions')].map((h) => (
                                    <th key={h} className="px-4 py-3 text-xs font-semibold text-[var(--text-muted)] text-left whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                            {users.map((user, i) => {
                                const role = roleInfo(user.role);
                                return (
                                    <tr key={user._id} className="hover:bg-gray-50/80 transition-colors">
                                        <td className="px-4 py-3 text-[var(--text-muted)]">{i + 1}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                                                    style={{ background: `linear-gradient(135deg, ${role.color}, ${role.color}99)` }}>
                                                    {user.avatar}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-[var(--text-primary)]">{user.name}</p>
                                                    {user._id === currentUser?._id && (
                                                        <p className="text-xs text-[var(--saffron)]">{lang === 'hi' ? 'आप' : 'You'}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-[var(--text-secondary)] font-mono text-xs">{user.mobile}</td>
                                        <td className="px-4 py-3">
                                            <Badge variant={user.role}>{lang === 'hi' ? role.labelHi : role.label}</Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${user.useRoleDefaults ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                                                {user.useRoleDefaults ? (lang === 'hi' ? 'भूमिका डिफ़ॉल्ट' : 'Role Default') : (lang === 'hi' ? 'कस्टम' : 'Custom')}
                                            </span>
                                            <span className="ml-1.5 text-xs text-[var(--text-muted)]">({user.permissions.length})</span>
                                        </td>
                                        <td className="px-4 py-3 text-[var(--text-muted)] text-xs whitespace-nowrap">
                                            {user.lastLogin ? formatDate(user.lastLogin) : lang === 'hi' ? 'कभी नहीं' : 'Never'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge variant={user.isActive ? 'active' : 'inactive'} showDot>
                                                {user.isActive ? t('active') : t('inactive')}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1">
                                                {canEdit && user._id !== currentUser?._id && (
                                                    <Link href={`/dashboard/users/new?edit=${user._id}`}>
                                                        <button title="Edit" className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-blue-50 text-blue-500 transition-colors">
                                                            <svg width="13" height="13" fill="none" viewBox="0 0 13 13"><path d="M1 12l9-9 2 2-9 9H1v-2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" /></svg>
                                                        </button>
                                                    </Link>
                                                )}
                                                {canDelete && user._id !== currentUser?._id && (
                                                    <button onClick={() => setDT(user)} title={user.isActive ? t('deactivate') : 'Activate'}
                                                        className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${user.isActive ? 'hover:bg-red-50 text-red-400' : 'hover:bg-emerald-50 text-emerald-500'}`}>
                                                        {user.isActive ? (
                                                            <svg width="13" height="13" fill="none" viewBox="0 0 13 13"><path d="M2 2l9 9M11 2l-9 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
                                                        ) : (
                                                            <svg width="13" height="13" fill="none" viewBox="0 0 13 13"><path d="M2 6.5l3.5 3.5L11 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <ConfirmModal
                isOpen={!!deactivateTarget}
                onClose={() => setDT(null)}
                onConfirm={handleToggleActive}
                title={deactivateTarget?.isActive ? t('deactivate') : 'Activate Account'}
                message={`${deactivateTarget?.isActive ? (lang === 'hi' ? 'क्या आप इस खाते को निष्क्रिय करना चाहते हैं?' : 'Deactivate this account?') : (lang === 'hi' ? 'इस खाते को सक्रिय करें?' : 'Activate this account?')} ${deactivateTarget?.name}`}
                confirmText={deactivateTarget?.isActive ? t('deactivate') : 'Activate'}
                confirmVariant={deactivateTarget?.isActive ? 'danger' : 'primary'}
            />
        </div>
    );
}
