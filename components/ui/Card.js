'use client';

export default function Card({ children, className = '', hover = false, padding = 'md', onClick }) {
    const paddings = { none: '', sm: 'p-4', md: 'p-5', lg: 'p-6', xl: 'p-8' };
    return (
        <div
            onClick={onClick}
            className={[
                'bg-[var(--bg-card)] rounded-[var(--radius-lg)] border border-[var(--border)] shadow-[var(--shadow-sm)]',
                hover ? 'card-hover cursor-pointer' : '',
                paddings[padding] ?? paddings.md,
                className,
            ].join(' ')}
        >
            {children}
        </div>
    );
}

export function StatCard({ title, titleHi, lang = 'en', value, icon, trend, trendUp, color = 'saffron', loading = false }) {
    const displayTitle = lang === 'hi' && titleHi ? titleHi : title;
    const colors = {
        saffron: 'bg-orange-50 text-[var(--saffron)]',
        green: 'bg-emerald-50 text-emerald-600',
        blue: 'bg-blue-50 text-blue-600',
        purple: 'bg-purple-50 text-purple-600',
        red: 'bg-red-50 text-red-600',
    };

    return (
        <Card className="animate-fade-in">
            <div className="flex items-start justify-between mb-3">
                <p className="text-sm font-medium text-[var(--text-secondary)]">{displayTitle}</p>
                {icon && (
                    <span className={`w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center text-lg flex-shrink-0 ${colors[color] ?? colors.saffron}`}>
                        {icon}
                    </span>
                )}
            </div>
            {loading ? (
                <div className="h-8 w-32 bg-gray-100 rounded animate-pulse" />
            ) : (
                <p className="text-2xl font-bold text-[var(--text-primary)] leading-tight">{value}</p>
            )}
            {trend && (
                <p className={`text-xs mt-1.5 ${trendUp ? 'text-emerald-600' : 'text-red-500'}`}>
                    {trendUp ? '↑' : '↓'} {trend}
                </p>
            )}
        </Card>
    );
}
