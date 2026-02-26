'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { useLang } from '@/lib/context/LangContext';
import { ROLES } from '@/lib/permissions';
import { toast } from '@/components/ui/Toast';

export default function Topbar({ onMenuClick, pendingCount = 0 }) {
    const { currentUser, logout } = useAuth();
    const { t, lang, toggleLang } = useLang();
    const router = useRouter();
    const roleInfo = ROLES[currentUser?.role] ?? ROLES.staff;

    const handleLogout = async () => {
        await logout();
        toast.info('Logged out. Jai Shri Shyam! 🙏');
    };

    return (
        <header className="h-16 flex items-center justify-between px-4 lg:px-6 flex-shrink-0"
            style={{
                background: 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(250,247,244,0.95) 100%)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.07), inset 0 -1px 0 rgba(0,0,0,0.05)',
                backdropFilter: 'blur(12px)',
            }}>

            {/* Left */}
            <div className="flex items-center gap-3">
                <button onClick={onMenuClick}
                    className="clay-btn clay-btn-ghost w-9 h-9 !p-0 rounded-xl lg:hidden">
                    <svg width="17" height="17" fill="none" viewBox="0 0 17 17">
                        <path d="M2 4.5h13M2 8.5h13M2 12.5h13" stroke="var(--text-primary)" strokeWidth="1.6" strokeLinecap="round" />
                    </svg>
                </button>

                {/* Pending notice — Super Admin */}
                {pendingCount > 0 && currentUser?.role === 'super_admin' && (
                    <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
                        style={{ background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)', color: '#92400E', boxShadow: '3px 3px 10px rgba(245,158,11,0.25), -1px -1px 6px rgba(255,255,255,0.90)' }}>
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full anim-pulse" />
                        {pendingCount} {lang === 'hi' ? 'व्यय लंबित' : 'expenses pending'}
                    </div>
                )}
            </div>

            {/* Right */}
            <div className="flex items-center gap-2">
                {/* Language Toggle */}
                <button onClick={toggleLang}
                    className="clay-btn clay-btn-secondary !px-3 !py-1.5 !text-xs rounded-full">
                    {lang === 'en' ? 'हिंदी' : 'EN'}
                </button>

                {/* Bell */}
                <button className="clay-btn clay-btn-ghost w-9 h-9 !p-0 rounded-xl relative">
                    <svg width="17" height="17" fill="none" viewBox="0 0 17 17">
                        <path d="M8.5 2a5 5 0 00-5 5c0 2.5-1 3.5-1 3.5h12s-1-1-1-3.5a5 5 0 00-5-5z" stroke="var(--text-secondary)" strokeWidth="1.5" />
                        <path d="M7 13.5a1.5 1.5 0 003 0" stroke="var(--text-secondary)" strokeWidth="1.5" />
                    </svg>
                    {pendingCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                            style={{ background: 'var(--saffron)', boxShadow: '0 0 6px rgba(255,107,0,0.7)' }} />
                    )}
                </button>

                {/* Divider */}
                <div className="w-px h-8 mx-1" style={{ background: 'rgba(0,0,0,0.07)' }} />

                {/* User */}
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        style={{
                            background: `linear-gradient(135deg, ${roleInfo.color}CC, ${roleInfo.color})`,
                            boxShadow: `0 3px 10px ${roleInfo.color}44`,
                        }}>
                        {currentUser?.avatar ?? '?'}
                    </div>
                    <div className="hidden md:block">
                        <p className="text-xs font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>{currentUser?.name}</p>
                        <p className="text-[10px] font-semibold" style={{ color: roleInfo.color }}>
                            {lang === 'hi' ? roleInfo.labelHi : roleInfo.label}
                        </p>
                    </div>
                </div>

                {/* Logout */}
                <button onClick={handleLogout} title={t('logout')}
                    className="clay-btn clay-btn-ghost w-9 h-9 !p-0 rounded-xl text-red-400 hover:!bg-red-50">
                    <svg width="15" height="15" fill="none" viewBox="0 0 15 15">
                        <path d="M5.5 2H2v11h3.5M9 10l4-2.5-4-2.5M4 7.5h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
            </div>
        </header>
    );
}
