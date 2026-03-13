'use client';

import { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const TOASTS = { listeners: [], emit(t) { this.listeners.forEach(fn => fn(t)); } };

export const toast = {
    success: (msg) => TOASTS.emit({ id: Date.now(), msg, type: 'success' }),
    error: (msg) => TOASTS.emit({ id: Date.now(), msg, type: 'error' }),
    warning: (msg) => TOASTS.emit({ id: Date.now(), msg, type: 'warning' }),
    info: (msg) => TOASTS.emit({ id: Date.now(), msg, type: 'info' }),
};

const CONFIGS = {
    success: { icon: <CheckCircle2 size={20} strokeWidth={2} />, bg: 'linear-gradient(135deg, #F0FDF4, #DCFCE7)', color: '#166534', border: 'rgba(34,197,94,0.30)' },
    error: { icon: <XCircle size={20} strokeWidth={2} />, bg: 'linear-gradient(135deg, #FFF1F2, #FFE4E6)', color: '#881337', border: 'rgba(239,68,68,0.30)' },
    warning: { icon: <AlertTriangle size={20} strokeWidth={2} />, bg: 'linear-gradient(135deg, #FFFBEB, #FEF3C7)', color: '#92400E', border: 'rgba(245,158,11,0.30)' },
    info: { icon: <Info size={20} strokeWidth={2} />, bg: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)', color: '#1E40AF', border: 'rgba(59,130,246,0.30)' },
};

function Toast({ toast: t, onRemove }) {
    const cfg = CONFIGS[t.type] ?? CONFIGS.info;

    useEffect(() => {
        const id = setTimeout(() => onRemove(t.id), 4000);
        return () => clearTimeout(id);
    }, [t.id, onRemove]);

    return (
        <div className="anim-toast flex items-center gap-3 px-4 py-3 rounded-2xl min-w-72 max-w-sm"
            style={{
                background: cfg.bg,
                color: cfg.color,
                boxShadow: '6px 6px 20px rgba(0,0,0,0.12), -2px -2px 10px rgba(255,255,255,0.90), inset 0 1px 0 rgba(255,255,255,0.70)',
                border: `1.5px solid ${cfg.border}`,
                fontFamily: 'Plus Jakarta Sans, sans-serif',
            }}>
            <span className="text-lg flex-shrink-0">{cfg.icon}</span>
            <span className="text-sm font-semibold flex-1">{t.msg}</span>
            <button onClick={() => onRemove(t.id)}
                className="opacity-50 hover:opacity-100 transition-opacity ml-1 flex items-center justify-center">
                <X size={14} strokeWidth={2.5} />
            </button>
        </div>
    );
}

export function ToastContainer() {
    const [toasts, setToasts] = useState([]);

    useEffect(() => {
        const fn = (t) => setToasts(p => [...p, t]);
        TOASTS.listeners.push(fn);
        return () => { TOASTS.listeners = TOASTS.listeners.filter(x => x !== fn); };
    }, []);

    const remove = useCallback((id) => setToasts(p => p.filter(t => t.id !== id)), []);

    return (
        <div className="fixed bottom-5 right-5 z-[200] flex flex-col gap-2 items-end">
            {toasts.map(t => <Toast key={t.id} toast={t} onRemove={remove} />)}
        </div>
    );
}
