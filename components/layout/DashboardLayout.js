'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function DashboardLayout({ children, pendingCount = 0 }) {
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-page)' }}>
            <Sidebar
                mobileOpen={mobileOpen}
                onClose={() => setMobileOpen(false)}
                pendingCount={pendingCount}
            />

            {/* Main column */}
            <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
                <Topbar
                    onMenuClick={() => setMobileOpen(true)}
                    pendingCount={pendingCount}
                />
                <main className="flex-1 overflow-y-auto p-4 lg:p-6 animate-fade-in">
                    {children}
                </main>
            </div>
        </div>
    );
}
