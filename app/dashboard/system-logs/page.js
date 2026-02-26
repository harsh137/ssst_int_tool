'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { useLang } from '@/lib/context/LangContext';
import { formatDate } from '@/lib/data/mockData'; // Has a time component ideally, or we can write a quick one
import Badge from '@/components/ui/Badge';
import { toast } from '@/components/ui/Toast';
import { useRouter } from 'next/navigation';

const ACTION_COLORS = {
    LOGIN: 'emerald', LOGOUT: 'gray',
    CREATE: 'blue', UPDATE: 'orange', DELETE: 'red',
    APPROVE: 'emerald', REJECT: 'red',
    EXPORT: 'purple', SYSTEM: 'gray'
};

const formatDateTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true
    });
};

export default function SystemLogsPage() {
    const { currentUser } = useAuth();
    const { t, lang } = useLang();
    const router = useRouter();

    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Filters
    const [actionFilter, setActionFilter] = useState('');
    const [resourceFilter, setResourceFilter] = useState('');
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (currentUser && currentUser.role !== 'super_admin') {
            router.replace('/dashboard');
        }
    }, [currentUser, router]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams({ page, limit: 30 });
            if (actionFilter) query.append('action', actionFilter);
            if (resourceFilter) query.append('resource', resourceFilter);
            if (search) query.append('search', search);

            const res = await fetch(`/api/logs?${query}`);
            const data = await res.json();

            if (data.success) {
                setLogs(data.logs);
                setTotalPages(data.pagination.pages);
            } else {
                toast.error(data.error || 'Failed to fetch logs');
            }
        } catch {
            toast.error('Network Error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (currentUser?.role === 'super_admin') fetchLogs();
    }, [page, actionFilter, resourceFilter, currentUser]); // eslint-disable-line

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        fetchLogs();
    };

    if (currentUser?.role !== 'super_admin') return null;

    return (
        <div className="space-y-5">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                    {lang === 'hi' ? 'सिस्टम लॉग' : 'System Logs'}
                </h1>
                <p className="text-sm text-[var(--text-muted)] mt-0.5">
                    {lang === 'hi' ? 'सभी उपयोगकर्ता गतिविधियों का ऑडिट ट्रेल' : 'Audit trail of all user activities'}
                </p>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-[var(--radius-lg)] border border-[var(--border)] shadow-[var(--shadow-sm)] flex flex-wrap gap-3 items-center justify-between">
                <div className="flex flex-wrap gap-3 flex-1">
                    <select value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
                        className="px-3 py-2 text-sm border border-[var(--border)] rounded-[var(--radius-md)] focus:outline-none focus:border-[var(--saffron)] bg-white">
                        <option value="">{lang === 'hi' ? 'सभी क्रियाएं' : 'All Actions'}</option>
                        {Object.keys(ACTION_COLORS).map(a => <option key={a} value={a}>{a}</option>)}
                    </select>

                    <select value={resourceFilter} onChange={(e) => { setResourceFilter(e.target.value); setPage(1); }}
                        className="px-3 py-2 text-sm border border-[var(--border)] rounded-[var(--radius-md)] focus:outline-none focus:border-[var(--saffron)] bg-white">
                        <option value="">{lang === 'hi' ? 'सभी संसाधन' : 'All Resources'}</option>
                        {['User', 'Donation', 'Expense', 'Utsav', 'Auth', 'Settings'].map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                </div>

                <form onSubmit={handleSearch} className="relative w-full sm:w-64">
                    <input type="text" placeholder={lang === 'hi' ? 'विवरण खोजें...' : 'Search details...'}
                        value={search} onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm border border-[var(--border)] rounded-[var(--radius-md)] focus:outline-none focus:border-[var(--saffron)]" />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">🔍</span>
                </form>
            </div>

            {/* Logs Table */}
            <div className="bg-white rounded-[var(--radius-lg)] border border-[var(--border)] shadow-[var(--shadow-sm)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-[var(--border)]">
                            <tr>
                                {[
                                    lang === 'hi' ? 'समय' : 'Time',
                                    lang === 'hi' ? 'उपयोगकर्ता' : 'User',
                                    lang === 'hi' ? 'क्रिया' : 'Action',
                                    lang === 'hi' ? 'संसाधन' : 'Resource',
                                    lang === 'hi' ? 'विवरण' : 'Details'
                                ].map((h) => (
                                    <th key={h} className="px-4 py-3 text-xs font-semibold text-[var(--text-muted)] text-left whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                            {loading && logs.length === 0 ? (
                                <tr><td colSpan={5} className="px-4 py-12 text-center text-[var(--text-muted)]">{lang === 'hi' ? 'लॉग लोड हो रहे हैं...' : 'Loading logs...'}</td></tr>
                            ) : logs.length === 0 ? (
                                <tr><td colSpan={5} className="px-4 py-12 text-center text-[var(--text-muted)]">{lang === 'hi' ? 'कोई लॉग नहीं मिला' : 'No logs found'}</td></tr>
                            ) : logs.map((log) => (
                                <tr key={log._id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-4 py-3 text-[var(--text-secondary)] whitespace-nowrap font-mono text-xs">
                                        {formatDateTime(log.createdAt)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <p className="font-medium text-[var(--text-primary)]">{log.user?.name || 'System'}</p>
                                        <p className="text-xs text-[var(--text-muted)] capitalize">{log.user?.role || 'system'}</p>
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge variant={ACTION_COLORS[log.action] || 'gray'}>{log.action}</Badge>
                                    </td>
                                    <td className="px-4 py-3 text-[var(--text-secondary)] font-medium">
                                        {log.resource}
                                    </td>
                                    <td className="px-4 py-3 text-[var(--text-primary)] relative group max-w-md">
                                        <span className="block truncate">{log.details}</span>
                                        {/* Simple hover tooltip for full text if truncated */}
                                        <div className="hidden group-hover:block absolute z-10 bg-gray-900 text-white text-xs p-2 rounded shadow-lg -top-8 left-0 whitespace-nowrap">
                                            {log.details}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-5 py-4 border-t border-[var(--border)] bg-gray-50/50">
                        <p className="text-xs text-[var(--text-muted)]">
                            {lang === 'hi' ? 'कुल' : 'Page'} <span className="font-semibold text-[var(--text-primary)]">{page}</span> {lang === 'hi' ? 'में से' : 'of'} <span className="font-semibold text-[var(--text-primary)]">{totalPages}</span>
                        </p>
                        <div className="flex gap-2">
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1 || loading}
                                className="px-3 py-1.5 text-xs font-semibold border border-[var(--border)] rounded-lg bg-white disabled:opacity-50 hover:bg-gray-50 transition-colors cursor-pointer">
                                {lang === 'hi' ? 'पिछला' : 'Previous'}
                            </button>
                            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || loading}
                                className="px-3 py-1.5 text-xs font-semibold border border-[var(--border)] rounded-lg bg-white disabled:opacity-50 hover:bg-gray-50 transition-colors cursor-pointer">
                                {lang === 'hi' ? 'अगला' : 'Next'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
