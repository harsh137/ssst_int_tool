'use client';

const variants = {
    primary: 'bg-[var(--saffron)] hover:bg-[var(--saffron-dark)] text-white shadow-sm hover:shadow-md',
    secondary: 'bg-white hover:bg-gray-50 text-[var(--text-primary)] border border-[var(--border)] shadow-sm',
    danger: 'bg-[var(--danger)] hover:bg-red-600 text-white shadow-sm',
    ghost: 'bg-transparent hover:bg-gray-100 text-[var(--text-secondary)]',
    success: 'bg-[var(--success)] hover:bg-emerald-600 text-white shadow-sm',
    outline: 'bg-transparent border border-[var(--saffron)] text-[var(--saffron)] hover:bg-orange-50',
};

const sizes = {
    sm: 'px-3 py-1.5 text-xs rounded-[var(--radius-sm)]',
    md: 'px-4 py-2 text-sm rounded-[var(--radius-md)]',
    lg: 'px-6 py-2.5 text-sm rounded-[var(--radius-lg)]',
    xl: 'px-8 py-3 text-base rounded-[var(--radius-lg)]',
    icon: 'w-8 h-8 rounded-[var(--radius-md)] flex items-center justify-center',
};

export default function Button({
    children,
    variant = 'primary',
    size = 'md',
    className = '',
    loading = false,
    disabled = false,
    icon,
    iconRight,
    onClick,
    type = 'button',
    fullWidth = false,
    ...props
}) {
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            className={[
                'inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 cursor-pointer select-none',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                variants[variant] ?? variants.primary,
                sizes[size] ?? sizes.md,
                fullWidth ? 'w-full' : '',
                className,
            ].join(' ')}
            {...props}
        >
            {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : icon ? (
                <span className="flex-shrink-0">{icon}</span>
            ) : null}
            {children}
            {iconRight && !loading && <span className="flex-shrink-0">{iconRight}</span>}
        </button>
    );
}
