'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { useLang } from '@/lib/context/LangContext';
import { ROLES } from '@/lib/permissions';
import { toast } from '@/components/ui/Toast';
import { Landmark, WalletCards, ChartBar, ShieldCheck, FileText, Eye, EyeOff, AlertTriangle } from 'lucide-react';

const roleColors = {
    super_admin: '#FF6B00', founder: '#8B5CF6', ca: '#3B82F6', staff: '#10B981',
};

export default function LoginPage() {
    const { login } = useAuth();
    const { t, lang, toggleLang } = useLang();
    const router = useRouter();

    const [mobile, setMobile] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPass, setShowPass] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        if (!/^\d{10}$/.test(mobile)) { setError(t('invalidMobile')); return; }
        if (!password) { setError(t('required')); return; }
        setLoading(true);
        await new Promise((r) => setTimeout(r, 600));
        const result = await login(mobile, password);
        setLoading(false);
        if (result.success) {
            toast.success('Jai Shri Shyam!');
            // Use hard navigation so the session cookie is reliably picked up
            // on the fresh page load (avoids React state race condition)
            setTimeout(() => { window.location.replace('/dashboard'); }, 700);
        } else {
            setError(t('invalidCredentials'));
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4"
            style={{ background: 'radial-gradient(ellipse at 20% 50%, #FFF0E6 0%, #F5F0EB 40%, #EDE8F5 100%)' }}>

            {/* Decorative blobs */}
            <div className="fixed top-0 left-0 w-96 h-96 rounded-full opacity-20 pointer-events-none"
                style={{ background: 'radial-gradient(circle, #FF6B00, transparent)', transform: 'translate(-40%, -40%)' }} />
            <div className="fixed bottom-0 right-0 w-80 h-80 rounded-full opacity-15 pointer-events-none"
                style={{ background: 'radial-gradient(circle, #8B5CF6, transparent)', transform: 'translate(30%, 30%)' }} />

            {/* Lang toggle */}
            <button onClick={toggleLang}
                className="clay-btn clay-btn-secondary !px-3 !py-1.5 !text-xs fixed top-5 right-5 z-10">
                {lang === 'en' ? 'हिंदी' : 'English'}
            </button>

            <div className="w-full max-w-4xl grid lg:grid-cols-2 gap-6 items-center">

                {/* Left — Branding */}
                <div className="hidden lg:block anim-fade-up">
                    <div className="clay-card-lg p-8" style={{ background: 'linear-gradient(145deg, #1A1F36 0%, #252B45 100%)', border: '1px solid rgba(255,255,255,0.10)' }}>
                        {/* Glowing logo */}
                        <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl mb-6 text-white"
                            style={{ background: 'linear-gradient(135deg, #FF8534, #FF6B00, #F5A623)', boxShadow: '0 8px 28px rgba(255,107,0,0.50), inset 0 2px 0 rgba(255,255,255,0.25)' }}>
                            <Landmark size={40} strokeWidth={1.5} />
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-1" style={{ fontFamily: 'Noto Sans Devanagari, Plus Jakarta Sans, sans-serif' }}>
                            श्री श्याम शरणम्
                        </h1>
                        <h2 className="text-xl font-bold mb-1" style={{ background: 'linear-gradient(135deg, #FF8534, #F5A623)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            सेवा ट्रस्ट
                        </h2>
                        <p className="text-sm mb-8" style={{ color: 'rgba(255,166,50,0.80)' }}>Jai Shri Shyam</p>

                        <div className="space-y-3">
                            {[
                                { icon: <WalletCards size={20} className="text-amber-400" />, en: 'Donation & Receipt Management', hi: 'दान एवं रसीद प्रबंधन' },
                                { icon: <ChartBar size={20} className="text-emerald-400" />, en: 'Expense Tracker & Approvals', hi: 'व्यय ट्रैकर एवं अनुमोदन' },
                                { icon: <ShieldCheck size={20} className="text-blue-400" />, en: 'Role-Based Access Control', hi: 'भूमिका-आधारित पहुँच नियंत्रण' },
                                { icon: <FileText size={20} className="text-purple-400" />, en: 'CA & Tally Report Export', hi: 'CA एवं Tally रिपोर्ट निर्यात' },
                            ].map((f, i) => (
                                <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-2xl anim-fade-up delay-${i + 1}`}
                                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                    <span className="text-xl">{f.icon}</span>
                                    <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.72)' }}>
                                        {lang === 'hi' ? f.hi : f.en}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right — Login Card */}
                <div className="clay-card-lg p-8 anim-scale-in">
                    {/* Mobile logo */}
                    <div className="flex items-center gap-3 mb-7 lg:hidden">
                        <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white"
                            style={{ background: 'linear-gradient(135deg, #FF8534, #FF6B00)', boxShadow: '0 5px 18px rgba(255,107,0,0.40)' }}>
                            <Landmark size={24} strokeWidth={1.5} />
                        </div>
                        <div>
                            <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>SSST Internal</p>
                            <p className="text-xs" style={{ color: '#FF6B00', fontFamily: 'Noto Sans Devanagari, sans-serif' }}>जय श्री श्याम</p>
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{t('loginTitle')}</h2>
                    <p className="text-sm mb-7" style={{ color: 'var(--text-secondary)' }}>{t('loginSubtitle')}</p>

                    <form onSubmit={handleLogin} className="space-y-4">
                        {/* Mobile */}
                        <div>
                            <label className="text-xs font-bold uppercase tracking-wide mb-1.5 block" style={{ color: 'var(--text-muted)' }}>
                                {t('mobile')}
                            </label>
                            <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                                    <svg width="15" height="15" fill="none" viewBox="0 0 15 15"><rect x="3" y="1" width="9" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.5" /><circle cx="7.5" cy="11" r="0.75" fill="currentColor" /></svg>
                                </span>
                                <input type="tel" value={mobile}
                                    onChange={(e) => setMobile(e.target.value.replace(/\D/, '').slice(0, 10))}
                                    placeholder={t('mobilePlaceholder')} maxLength={10}
                                    className={`clay-input !pl-12 ${error ? 'error' : ''}`} />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="text-xs font-bold uppercase tracking-wide mb-1.5 block" style={{ color: 'var(--text-muted)' }}>
                                {t('password')}
                            </label>
                            <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                                    <svg width="15" height="15" fill="none" viewBox="0 0 15 15"><rect x="2" y="6.5" width="11" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" /><path d="M4.5 6.5V5a3 3 0 016 0v1.5" stroke="currentColor" strokeWidth="1.5" /><circle cx="7.5" cy="10" r="1" fill="currentColor" /></svg>
                                </span>
                                <input type={showPass ? 'text' : 'password'} value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className={`clay-input !pl-12 pr-10 ${error ? 'error' : ''}`} />
                                <button type="button" onClick={() => setShowPass(!showPass)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-base" style={{ color: 'var(--text-muted)' }}>
                                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 text-sm px-3.5 py-2.5 rounded-2xl"
                                style={{ background: 'linear-gradient(135deg, #FEE2E2, #FECACA)', color: '#B91C1C' }}>
                                <AlertTriangle size={18} /> {error}
                            </div>
                        )}

                        <button type="submit" disabled={loading}
                            className="clay-btn clay-btn-primary w-full !py-3 !text-sm rounded-2xl disabled:opacity-60">
                            {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full anim-spin" />}
                            {loading ? t('loading') : t('loginBtn')}
                        </button>
                    </form>

                </div>
            </div>
        </div>
    );
}
