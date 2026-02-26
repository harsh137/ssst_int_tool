'use client';

export default function Input({
    label,
    labelHi,
    lang = 'en',
    error,
    hint,
    icon,
    iconRight,
    className = '',
    containerClassName = '',
    required = false,
    ...props
}) {
    const displayLabel = lang === 'hi' && labelHi ? labelHi : label;

    return (
        <div className={`flex flex-col gap-1 ${containerClassName}`}>
            {displayLabel && (
                <label className="text-sm font-medium text-[var(--text-primary)]">
                    {displayLabel}
                    {required && <span className="text-[var(--danger)] ml-0.5">*</span>}
                </label>
            )}
            <div className="relative">
                {icon && (
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]">
                        {icon}
                    </span>
                )}
                <input
                    className={[
                        'w-full border border-[var(--border)] rounded-[var(--radius-md)] bg-white',
                        'text-[var(--text-primary)] text-sm placeholder:text-[var(--muted)]',
                        'focus:outline-none focus:border-[var(--saffron)] focus:ring-2 focus:ring-[var(--saffron)]/15',
                        'transition-all duration-150 disabled:bg-gray-50 disabled:text-[var(--muted)]',
                        error ? 'border-[var(--danger)] focus:ring-[var(--danger)]/15' : '',
                        icon ? 'pl-9' : 'pl-3',
                        iconRight ? 'pr-9' : 'pr-3',
                        'py-2.5',
                        className,
                    ].join(' ')}
                    {...props}
                />
                {iconRight && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)]">
                        {iconRight}
                    </span>
                )}
            </div>
            {error && <p className="text-xs text-[var(--danger)]">{error}</p>}
            {hint && !error && <p className="text-xs text-[var(--text-muted)]">{hint}</p>}
        </div>
    );
}

export function Textarea({
    label, labelHi, lang = 'en', error, hint, className = '', containerClassName = '', required = false, rows = 3, ...props
}) {
    const displayLabel = lang === 'hi' && labelHi ? labelHi : label;
    return (
        <div className={`flex flex-col gap-1 ${containerClassName}`}>
            {displayLabel && (
                <label className="text-sm font-medium text-[var(--text-primary)]">
                    {displayLabel}
                    {required && <span className="text-[var(--danger)] ml-0.5">*</span>}
                </label>
            )}
            <textarea
                rows={rows}
                className={[
                    'w-full border border-[var(--border)] rounded-[var(--radius-md)] bg-white',
                    'text-[var(--text-primary)] text-sm placeholder:text-[var(--muted)] px-3 py-2.5 resize-none',
                    'focus:outline-none focus:border-[var(--saffron)] focus:ring-2 focus:ring-[var(--saffron)]/15',
                    'transition-all duration-150',
                    error ? 'border-[var(--danger)]' : '',
                    className,
                ].join(' ')}
                {...props}
            />
            {error && <p className="text-xs text-[var(--danger)]">{error}</p>}
            {hint && !error && <p className="text-xs text-[var(--text-muted)]">{hint}</p>}
        </div>
    );
}
