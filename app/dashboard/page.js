'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import { useLang } from '@/lib/context/LangContext';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { formatINR, formatDate } from '@/lib/data/mockData';
import Badge from '@/components/ui/Badge';
import { WalletCards, ChartBar, Landmark, Hourglass } from 'lucide-react';

export default function DashboardPage() {
    const { currentUser } = useAuth();
    const { t, lang } = useLang();

    const [summary, setSummary] = useState(null);
    const [recentDonations, setDonList] = useState([]);
    const [recentExpenses, setExpList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                const res = await fetch('/api/dashboard/stats');
                const data = await res.json();
                if (data.success) {
                    setSummary(data.summary);
                    setDonList(data.recentDonations);
                    setExpList(data.recentExpenses);
                }
            } catch (err) {
                console.error("Failed to fetch stats", err);
            } finally {
                setIsLoading(false);
            }
        }
        fetchStats();
    }, []);

    const canCreate = hasPermission(currentUser, PERMISSIONS.DONATION_CREATE);
    const canExpense = hasPermission(currentUser, PERMISSIONS.EXPENSE_CREATE);
    const fundTotal = summary ? Object.values(summary.fundBreakdown).reduce((a, b) => a + b, 0) : 1;

    const stats = [
        { label: t('totalDonations'), labelHi: 'कुल दान', value: summary ? formatINR(summary.totalDonations) : '—', icon: <WalletCards size={24} />, variant: 'clay-stat-saffron', delay: '' },
        { label: t('totalExpenses'), labelHi: 'कुल व्यय', value: summary ? formatINR(summary.totalExpenses) : '—', icon: <ChartBar size={24} />, variant: 'clay-stat-blue', delay: 'delay-1' },
        { label: t('netBalance'), labelHi: 'शुद्ध शेष', value: summary ? formatINR(summary.netBalance) : '—', icon: <Landmark size={24} />, variant: 'clay-stat-emerald', delay: 'delay-2' },
        { label: t('pendingApprovals'), labelHi: 'लंबित अनुमोदन', value: summary ? summary.pendingCount : '—', icon: <Hourglass size={24} />, variant: 'clay-stat-purple', delay: 'delay-3' },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between anim-fade-up">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{t('dashboard')}</h1>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {lang === 'hi' ? 'जय श्री श्याम — आज का सारांश' : 'Jai Shri Shyam — Today\'s Overview'}
                    </p>
                </div>
                <div className="flex gap-2">
                    {canCreate && <Link href="/dashboard/donations/new"><button className="clay-btn clay-btn-primary !text-xs">+ {t('newDonation')}</button></Link>}
                    {canExpense && <Link href="/dashboard/expenses/new"><button className="clay-btn clay-btn-secondary !text-xs">+ {t('newExpense')}</button></Link>}
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {stats.map((s) => (
                    <div key={s.label} className={`${s.variant} ${s.delay} anim-fade-up rounded-3xl p-5 relative overflow-hidden`}>
                        {/* Shine overlay */}
                        <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(145deg, rgba(255,255,255,0.28) 0%, transparent 60%)', borderRadius: 'inherit' }} />
                        <div className="relative z-10">
                            <div className="flex items-start justify-between mb-3">
                                <p className="text-xs font-semibold text-white/75 uppercase tracking-wide">
                                    {lang === 'hi' ? s.labelHi : s.label}
                                </p>
                                <span className="text-2xl">{s.icon}</span>
                            </div>
                            <p className="text-2xl font-bold text-white">{s.value}</p>
                            <p className="text-xs text-white/60 mt-1">{t('thisMonth')}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

                {/* Fund Breakdown */}
                <div className="clay-card p-5 anim-fade-up delay-2">
                    <h2 className="text-sm font-bold mb-4" style={{ color: 'var(--text-primary)' }}>{t('fundBreakdown')}</h2>
                    {summary && (
                        <div className="space-y-4">
                            {[
                                { key: 'general', label: t('generalFund'), labelHi: 'सामान्य निधि', color: '#3B82F6', amount: summary.fundBreakdown.general },
                                { key: 'utsav', label: t('utsavFund'), labelHi: 'उत्सव निधि', color: '#FF6B00', amount: summary.fundBreakdown.utsav },
                            ].map((f) => {
                                const pct = fundTotal > 0 ? Math.round((f.amount / fundTotal) * 100) : 0;
                                return (
                                    <div key={f.key}>
                                        <div className="flex justify-between text-xs mb-1.5">
                                            <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>{lang === 'hi' ? f.labelHi : f.label}</span>
                                            <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{formatINR(f.amount)}</span>
                                        </div>
                                        <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'linear-gradient(145deg, #E5E0D8, #EDE8E2)', boxShadow: 'inset 2px 2px 5px rgba(0,0,0,0.08)' }}>
                                            <div className="h-full rounded-full transition-all duration-700"
                                                style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${f.color}BB, ${f.color})`, boxShadow: `0 2px 8px ${f.color}55` }} />
                                        </div>
                                        <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{pct}%</p>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Recent Donations */}
                <div className="xl:col-span-2 clay-card anim-fade-up delay-3">
                    <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                        <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{lang === 'hi' ? 'हाल के दान' : 'Recent Donations'}</h2>
                        <Link href="/dashboard/donations" className="text-xs font-semibold" style={{ color: 'var(--saffron)' }}>{t('viewAll')} →</Link>
                    </div>
                    <div className="divide-y" style={{ '--tw-divide-color': 'rgba(0,0,0,0.04)' }}>
                        {recentDonations.map((d) => (
                            <div key={d._id} className="flex items-center justify-between px-5 py-3 hover:bg-orange-50/30 transition-colors">
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{d.donorName}</p>
                                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{d.receiptNumber} · {formatDate(d.date)}</p>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                                    <Badge variant={d.fundType}>{lang === 'hi' ? { general: 'सामान्य', utsav: 'उत्सव', membership: 'सदस्यता' }[d.fundType] : d.fundType}</Badge>
                                    <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{formatINR(d.amount)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Recent Expenses */}
            <div className="clay-card anim-fade-up delay-4">
                <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                    <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{lang === 'hi' ? 'हाल के व्यय' : 'Recent Expenses'}</h2>
                    <Link href="/dashboard/expenses" className="text-xs font-semibold" style={{ color: 'var(--saffron)' }}>{t('viewAll')} →</Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="clay-table">
                        <thead>
                            <tr>{[t('category'), t('vendor'), t('amount'), t('paymentMode'), t('date'), t('status')].map(h => <th key={h}>{h}</th>)}</tr>
                        </thead>
                        <tbody>
                            {recentExpenses.map((e) => (
                                <tr key={e._id}>
                                    <td className="capitalize font-medium" style={{ color: 'var(--text-primary)' }}>{e.category}</td>
                                    <td style={{ color: 'var(--text-secondary)' }}>{e.vendor}</td>
                                    <td className="font-bold" style={{ color: 'var(--text-primary)' }}>{formatINR(e.amount)}</td>
                                    <td><Badge variant={e.paymentMode}>{e.paymentMode}</Badge></td>
                                    <td style={{ color: 'var(--text-muted)' }}>{formatDate(e.date)}</td>
                                    <td><Badge variant={e.status} showDot>{e.status}</Badge></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
