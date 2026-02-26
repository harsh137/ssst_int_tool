'use client';

export default function Select({
    label,
    labelHi,
    lang = 'en',
    options = [],
    error,
    hint,
    className = '',
    containerClassName = '',
    required = false,
    placeholder = 'Select...',
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
                <select
                    className={[
                        'w-full appearance-none border border-[var(--border)] rounded-[var(--radius-md)] bg-white',
                        'text-[var(--text-primary)] text-sm px-3 py-2.5 pr-9',
                        'focus:outline-none focus:border-[var(--saffron)] focus:ring-2 focus:ring-[var(--saffron)]/15',
                        'transition-all duration-150 disabled:bg-gray-50 disabled:text-[var(--muted)] cursor-pointer',
                        error ? 'border-[var(--danger)]' : '',
                        className,
                    ].join(' ')}
                    {...props}
                >
                    {placeholder && <option value="">{placeholder}</option>}
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {lang === 'hi' && opt.labelHi ? opt.labelHi : opt.label}
                        </option>
                    ))}
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--muted)]">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                        <path d="M2.5 4.5l4.5 5 4.5-5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </span>
            </div>
            {error && <p className="text-xs text-[var(--danger)]">{error}</p>}
            {hint && !error && <p className="text-xs text-[var(--text-muted)]">{hint}</p>}
        </div>
    );
}
