'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { useLang } from '@/lib/context/LangContext';
import { hasPermission, PERMISSIONS, ROLES } from '@/lib/permissions';

const NAV = [
    {
        href: '/dashboard', exact: true,
        labelKey: 'dashboard',
        icon: (
            <svg width="17" height="17" fill="none" viewBox="0 0 17 17">
                <rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
                <rect x="10" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
                <rect x="1" y="10" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
                <rect x="10" y="10" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
            </svg>
        ),
        permission: null,
    },
    {
        href: '/dashboard/donations',
        labelKey: 'donations',
        icon: (
            <svg width="17" height="17" fill="none" viewBox="0 0 17 17">
                <path d="M8.5 2C5.46 2 3 4.46 3 7.5c0 4.5 5.5 8.5 5.5 8.5s5.5-4 5.5-8.5C14 4.46 11.54 2 8.5 2z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                <circle cx="8.5" cy="7.5" r="2" stroke="currentColor" strokeWidth="1.5" />
            </svg>
        ),
        permission: PERMISSIONS.DONATION_VIEW,
    },
    {
        href: '/dashboard/expenses',
        labelKey: 'expenses',
        icon: (
            <svg width="17" height="17" fill="none" viewBox="0 0 17 17">
                <rect x="1.5" y="4" width="14" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
                <path d="M1.5 7h14" stroke="currentColor" strokeWidth="1.5" />
                <path d="M5 11h2.5M9.5 11h2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
        ),
        permission: PERMISSIONS.EXPENSE_VIEW,
    },
    {
        href: '/dashboard/reports',
        labelKey: 'reports',
        icon: (
            <svg width="17" height="17" fill="none" viewBox="0 0 17 17">
                <rect x="1.5" y="1.5" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" />
                <path d="M4.5 10l2.5-3 2.5 2 3.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
        permission: PERMISSIONS.REPORT_VIEW,
    },
    {
        href: '/dashboard/utsavs',
        labelKey: 'utsavs',
        icon: (
            <svg width="17" height="17" fill="none" viewBox="0 0 17 17">
                <rect x="1.5" y="3.5" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.6" />
                <path d="M5.5 1.5v4M11.5 1.5v4M1.5 7.5h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M5.5 11h2M9.5 11h2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
        ),
        permission: PERMISSIONS.USER_CREATE, // Super Admin only
    },
    {
        href: '/dashboard/users',
        labelKey: 'users',
        icon: (
            <svg width="17" height="17" fill="none" viewBox="0 0 17 17">
                <circle cx="6.5" cy="5.5" r="3" stroke="currentColor" strokeWidth="1.6" />
                <path d="M1 15c0-3.038 2.462-5.5 5.5-5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                <path d="M12.5 10v5M10 12.5h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
        ),
        permission: PERMISSIONS.USER_VIEW,
    },
    {
        href: '/dashboard/settings',
        labelKey: 'settings',
        icon: (
            <svg width="17" height="17" fill="none" viewBox="0 0 17 17">
                <circle cx="8.5" cy="8.5" r="2.5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M8.5 1.5v2M8.5 13v2.5M1.5 8.5h2M13 8.5h2.5M3.5 3.5l1.5 1.5M11.5 11.5l1.5 1.5M3.5 13.5l1.5-1.5M11.5 5l1.5-1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
        ),
        permission: PERMISSIONS.USER_CREATE, // Super Admin only
    },
    {
        href: '/dashboard/system-logs',
        labelKey: 'systemLogs',
        icon: (
            <svg width="17" height="17" fill="none" viewBox="0 0 17 17">
                <path d="M4 4h9M4 8.5h9M4 13h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
        ),
        permission: PERMISSIONS.USER_CREATE, // Super Admin only
    },
];

export default function Sidebar({ mobileOpen, onClose, pendingCount = 0 }) {
    const pathname = usePathname();
    const { currentUser } = useAuth();
    const { t, lang } = useLang();

    const roleInfo = ROLES[currentUser?.role] ?? ROLES.staff;

    const isActive = (item) =>
        item.exact ? pathname === item.href : pathname.startsWith(item.href);

    const visibleNav = NAV.filter(
        (item) => !item.permission || hasPermission(currentUser, item.permission)
    );

    return (
        <>
            {/* Mobile overlay */}
            {mobileOpen && (
                <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden" onClick={onClose} />
            )}

            <aside
                className={[
                    'clay-sidebar fixed inset-y-0 left-0 z-50 flex flex-col transition-transform duration-300',
                    'lg:translate-x-0',
                    mobileOpen ? 'translate-x-0' : '-translate-x-full',
                ].join(' ')}
                style={{ width: 'var(--sidebar-w)', flexShrink: 0 }}
            >
                {/* Logo */}
                <div className="flex items-center gap-3 px-5 py-5 flex-shrink-0"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 shadow-lg"
                        style={{ background: 'linear-gradient(135deg, #FF8534 0%, #FF6B00 60%, #F5A623 100%)', boxShadow: '0 4px 14px rgba(255,107,0,0.45)' }}>
                        🛕
                    </div>
                    <div className="min-w-0">
                        <p className="text-white font-bold text-sm leading-tight" style={{ fontFamily: lang === 'hi' ? 'var(--font-hindi)' : 'inherit' }}>
                            {lang === 'hi' ? 'श्री श्याम शरणम्' : 'SSST Internal'}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'rgba(255,166,50,0.85)' }}>
                            {lang === 'hi' ? 'जय श्री श्याम' : 'Jai Shri Shyam 🙏'}
                        </p>
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                    {visibleNav.map((item) => {
                        const active = isActive(item);
                        return (
                            <Link key={item.href} href={item.href} onClick={onClose}
                                className={`clay-nav-item ${active ? 'active' : ''}`}>
                                <span className="flex-shrink-0 opacity-80">{item.icon}</span>
                                <span className="flex-1">{t(item.labelKey)}</span>
                                {item.labelKey === 'expenses' && pendingCount > 0 && (
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                                        style={{ background: 'rgba(245,166,35,0.9)', color: '#1A1F36' }}>
                                        {pendingCount > 9 ? '9+' : pendingCount}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* User chip */}
                <div className="px-4 py-4 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                            style={{ background: `linear-gradient(135deg, ${roleInfo.color}BB, ${roleInfo.color})` }}>
                            {currentUser?.avatar ?? '?'}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-white text-xs font-semibold truncate">{currentUser?.name}</p>
                            <p className="text-[10px] font-medium" style={{ color: roleInfo.color }}>
                                {lang === 'hi' ? roleInfo.labelHi : roleInfo.label}
                            </p>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}
