'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Landmark } from 'lucide-react';

export default function DashboardRootLayout({ children }) {
    const { currentUser, isLoading } = useAuth();
    const router = useRouter();
    const [pendingCount, setPendingCount] = useState(0);

    useEffect(() => {
        if (!isLoading && !currentUser) {
            router.replace('/login');
        } else if (currentUser) {
            fetch('/api/dashboard/stats')
                .then(res => res.json())
                .then(data => {
                    if (data.success && data.summary) {
                        setPendingCount(data.summary.pendingCount || 0);
                    }
                })
                .catch(err => console.error('Failed to load pending count', err));
        }
    }, [currentUser, isLoading, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-page)' }}>
                <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center text-white"
                        style={{ background: 'linear-gradient(135deg, var(--saffron), var(--gold))' }}>
                        <Landmark size={24} strokeWidth={2} />
                    </div>
                    <p className="text-[var(--text-muted)] text-sm">Loading...</p>
                </div>
            </div>
        );
    }

    if (!currentUser) return null;

    return (
        <DashboardLayout pendingCount={pendingCount}>
            {children}
        </DashboardLayout>
    );
}
