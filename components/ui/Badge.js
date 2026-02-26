'use client';

const VARIANTS = {
    // Fund types
    general: { bg: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)', color: '#1E40AF', dot: '#3B82F6' },
    utsav: { bg: 'linear-gradient(135deg, #F5F3FF, #EDE9FE)', color: '#5B21B6', dot: '#8B5CF6' },
    membership: { bg: 'linear-gradient(135deg, #FFFBEB, #FEF3C7)', color: '#92400E', dot: '#F59E0B' },
    // Payment modes
    cash: { bg: 'linear-gradient(135deg, #F0FDF4, #DCFCE7)', color: '#14532D', dot: '#22C55E' },
    upi: { bg: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)', color: '#1E40AF', dot: '#3B82F6' },
    bankTransfer: { bg: 'linear-gradient(135deg, #F5F3FF, #EDE9FE)', color: '#5B21B6', dot: '#8B5CF6' },
    // Status
    pending: { bg: 'linear-gradient(135deg, #FFFBEB, #FEF3C7)', color: '#92400E', dot: '#F59E0B' },
    approved: { bg: 'linear-gradient(135deg, #F0FDF4, #DCFCE7)', color: '#14532D', dot: '#22C55E' },
    rejected: { bg: 'linear-gradient(135deg, #FFF1F2, #FFE4E6)', color: '#881337', dot: '#EF4444' },
    // Roles
    super_admin: { bg: 'linear-gradient(135deg, #FFF7ED, #FFEDD5)', color: '#9A3412', dot: '#F97316' },
    founder: { bg: 'linear-gradient(135deg, #F5F3FF, #EDE9FE)', color: '#5B21B6', dot: '#8B5CF6' },
    ca: { bg: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)', color: '#1E40AF', dot: '#3B82F6' },
    staff: { bg: 'linear-gradient(135deg, #F0FDF4, #DCFCE7)', color: '#14532D', dot: '#22C55E' },
    // Active/Inactive
    active: { bg: 'linear-gradient(135deg, #F0FDF4, #DCFCE7)', color: '#14532D', dot: '#22C55E' },
    inactive: { bg: 'linear-gradient(135deg, #F9FAFB, #F3F4F6)', color: '#374151', dot: '#9CA3AF' },
    // default
    default: { bg: 'linear-gradient(135deg, #F9FAFB, #F3F4F6)', color: '#374151', dot: '#9CA3AF' },
};

export default function Badge({ variant, children, showDot = false, className = '' }) {
    const style = VARIANTS[variant] ?? VARIANTS.default;

    return (
        <span
            className={`clay-badge ${className}`}
            style={{
                background: style.bg,
                color: style.color,
                boxShadow: '2px 2px 6px rgba(0,0,0,0.07), -1px -1px 4px rgba(255,255,255,0.85)',
                border: '1px solid rgba(255,255,255,0.70)',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
            }}
        >
            {showDot && (
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: style.dot, boxShadow: `0 0 5px ${style.dot}80` }} />
            )}
            {children}
        </span>
    );
}
